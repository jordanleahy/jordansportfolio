import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface BulkSingleAspectRequest {
  postIds: string[];
  aspectRatio: '16:9' | '9:16' | '4:3' | '3:4' | '1:1';
  category?: string;
  mode: 'missing_only' | 'regenerate_all';
}

interface GenerationResult {
  postId: string;
  success: boolean;
  url?: string;
  error?: string;
  cost: number;
  tokens: number;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const requestBody: BulkSingleAspectRequest = await req.json();
    const { postIds, aspectRatio, category = 'general', mode } = requestBody;
    
    // Auth validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const userSupabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!postIds || postIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No post IDs provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch posts data with existing prompts
    const { data: posts, error: postsError } = await supabase
      .from('social_media_posts')
      .select('id, title, description, generated_image_prompt, image_16_9_url, image_9_16_url, image_4_3_url, image_3_4_url, image_1_1_url')
      .in('id', postIds)
      .eq('user_id', user.id);

    if (postsError || !posts) {
      return new Response(JSON.stringify({ error: 'Failed to fetch posts' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter posts based on mode
    let targetPosts = posts;
    if (mode === 'missing_only') {
      const imageUrlField = `image_${aspectRatio.replace(':', '_')}_url`;
      targetPosts = posts.filter(post => !post[imageUrlField]);
    }

    if (targetPosts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        results: [],
        failures: [],
        totalCost: 0,
        totalTokens: 0,
        imagesGenerated: 0,
        processingTimeMs: Date.now() - startTime,
        message: mode === 'missing_only' ? 'All posts already have images for this aspect ratio' : 'No posts to process'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🚀 BULK_SINGLE: Processing ${targetPosts.length} posts for ${aspectRatio} (mode: ${mode})`);

    // Process posts with limited concurrency
    const concurrency = 3;
    const results: GenerationResult[] = [];
    let totalCost = 0;
    let totalTokens = 0;

    async function processPost(post: any): Promise<GenerationResult> {
      try {
        if (!post.generated_image_prompt) {
          throw new Error('No image prompt found for this post');
        }

        // Generate image using existing prompt
        const imageResponse = await supabase.functions.invoke('generate-image-gpt', {
          body: {
            prompt: post.generated_image_prompt,
            aspectRatio: aspectRatio,
            category
          },
          headers: { Authorization: authHeader }
        });

        if (imageResponse.error) {
          throw new Error(`Image generation failed: ${imageResponse.error.message}`);
        }

        const base64Image = imageResponse.data?.image;
        const imageCost = imageResponse.data?.cost || 0;
        const imageTokens = imageResponse.data?.tokens || 0;

        if (!base64Image) {
          throw new Error('No image generated');
        }

        // Upload to storage
        const timestamp = Date.now();
        const fileName = `bulk-${aspectRatio}-${post.id}-${timestamp}.jpg`;
        const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('social-media-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('social-media-images')
          .getPublicUrl(fileName);

        // Update post with image URL
        const imageField = `image_${aspectRatio.replace(':', '_')}_url`;
        const statusField = `image_${aspectRatio.replace(':', '_')}_status`;
        
        const { error: updateError } = await supabase
          .from('social_media_posts')
          .update({
            [imageField]: publicUrl,
            [statusField]: 'complete'
          })
          .eq('id', post.id);

        if (updateError) {
          console.warn(`Failed to update post ${post.id}:`, updateError);
        }

        return {
          postId: post.id,
          success: true,
          url: publicUrl,
          cost: imageCost,
          tokens: imageTokens
        };

      } catch (error) {
        console.error(`Failed to process post ${post.id}:`, error);
        
        // Update status to failed
        const statusField = `image_${aspectRatio.replace(':', '_')}_status`;
        await supabase
          .from('social_media_posts')
          .update({ [statusField]: 'failed' })
          .eq('id', post.id)
          .catch(() => {}); // Ignore secondary errors

        return {
          postId: post.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          cost: 0,
          tokens: 0
        };
      }
    }

    // Process in batches with concurrency limit
    const batches = [];
    for (let i = 0; i < targetPosts.length; i += concurrency) {
      batches.push(targetPosts.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      const batchResults = await Promise.all(batch.map(processPost));
      results.push(...batchResults);
      
      // Update totals
      batchResults.forEach(result => {
        totalCost += result.cost;
        totalTokens += result.tokens;
      });
    }

    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    // Track API usage
    try {
      await supabase
        .from('api_usage_tracking')
        .insert({
          user_id: user.id,
          function_name: 'bulk-generate-single-aspect',
          model_used: 'batch-operation',
          request_type: 'image_generation',
          success: successfulResults.length > 0,
          estimated_cost: totalCost,
          tokens_used: totalTokens,
          response_time_ms: Date.now() - startTime,
          request_metadata: {
            aspect_ratio: aspectRatio,
            mode: mode,
            posts_processed: targetPosts.length,
            successful_images: successfulResults.length,
            failed_images: failedResults.length
          }
        });
    } catch (error) {
      console.warn('Failed to track API usage:', error);
    }

    const processingTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      results: successfulResults,
      failures: failedResults,
      totalCost,
      totalTokens,
      imagesGenerated: successfulResults.length,
      processingTimeMs: processingTime,
      aspectRatio,
      mode,
      postsProcessed: targetPosts.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('bulk-generate-single-aspect error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});