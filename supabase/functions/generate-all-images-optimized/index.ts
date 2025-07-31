import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

// Type definitions for better type safety
interface AspectRatioConfig {
  ratio: string;
  width: number;
  height: number;
}

interface GenerationResult {
  aspectRatio: string;
  url?: string;
  prompt?: string;
  fileName?: string;
  success: boolean;
  error?: string;
  cost: number;
  tokens: number;
}

interface BatchRequest {
  postId: string;
  title: string;
  description: string;
  category?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Optimized aspect ratio configurations
const ASPECT_RATIOS: AspectRatioConfig[] = [
  { ratio: '16:9', width: 1792, height: 1024 },
  { ratio: '9:16', width: 1024, height: 1792 },
  { ratio: '4:3', width: 1536, height: 1024 },
  { ratio: '3:4', width: 1024, height: 1536 },
];

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting optimized batch image generation');
    
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

    const requestBody: BatchRequest = await req.json();
    const { postId, title, description, category = 'general' } = requestBody;

    if (!postId || !title || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📝 Processing post: ${postId} - "${title}"`);

    // PERFORMANCE IMPROVEMENT #1: Parallel processing with Promise.allSettled
    const generationPromises = ASPECT_RATIOS.map(async (aspectConfig): Promise<GenerationResult> => {
      const { ratio } = aspectConfig;
      
      try {
        console.log(`🖼️ Starting ${ratio} generation...`);

        // Step 1: Generate prompt (parallel execution)
        const promptResponse = await supabase.functions.invoke('generate-image-prompt-dynamic', {
          body: { title, description, category }
        });

        if (promptResponse.error) {
          throw new Error(`Prompt generation failed: ${promptResponse.error.message}`);
        }

        const prompt = promptResponse.data?.generatedPrompt;
        const promptUsage = promptResponse.data?.usage;
        const promptCost = promptUsage?.estimated_cost || 0;
        const promptTokens = promptUsage?.total_tokens || 0;

        if (!prompt) {
          throw new Error('No prompt generated');
        }

        // Step 2: Generate image with deterministic seed for consistency
        const imageResponse = await supabase.functions.invoke('generate-image-gpt', {
          body: { 
            prompt, 
            aspectRatio: ratio,
            useDeterministicSeed: true
          }
        });

        if (imageResponse.error) {
          throw new Error(`Image generation failed: ${imageResponse.error.message}`);
        }

        const base64Image = imageResponse.data?.image;
        const imageCost = imageResponse.data?.cost || 0;

        if (!base64Image) {
          throw new Error('No image generated');
        }

        // PERFORMANCE IMPROVEMENT #2: Optimized image processing
        // Create optimized file path structure
        const timestamp = Date.now();
        const fileName = `social-media/${user.id}/${postId}/${ratio.replace(':', 'x')}-${timestamp}.png`;
        
        // More efficient base64 conversion
        const imageData = base64Image.includes(',') 
          ? base64Image.split(',')[1] 
          : base64Image;
        
        const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('social-media-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('social-media-images')
          .getPublicUrl(fileName);

        console.log(`✅ Successfully generated ${ratio}`);

        return {
          aspectRatio: ratio,
          url: publicUrl,
          prompt,
          fileName,
          success: true,
          cost: promptCost + imageCost,
          tokens: promptTokens
        };

      } catch (error) {
        console.error(`❌ Error processing ${ratio}:`, error);
        return {
          aspectRatio: ratio,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          cost: 0,
          tokens: 0
        };
      }
    });

    // PERFORMANCE IMPROVEMENT #3: Wait for all operations, don't fail on single errors
    const results = await Promise.allSettled(generationPromises);
    const successfulResults: GenerationResult[] = [];
    const failedResults: GenerationResult[] = [];
    let totalCost = 0;
    let totalTokens = 0;

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const generationResult = result.value;
        totalCost += generationResult.cost;
        totalTokens += generationResult.tokens;
        
        if (generationResult.success) {
          successfulResults.push(generationResult);
        } else {
          failedResults.push(generationResult);
        }
      }
    });

    // PERFORMANCE IMPROVEMENT #4: Batch database updates
    if (successfulResults.length > 0) {
      console.log(`💾 Batch updating database with ${successfulResults.length} images...`);
      
      // Build update object for all successful results
      const updateData: Record<string, any> = {
        generated_image_prompt: successfulResults[0]?.prompt || null
      };

      successfulResults.forEach(result => {
        const aspectKey = `image_${result.aspectRatio.replace(':', '_')}_url`;
        const statusKey = `image_${result.aspectRatio.replace(':', '_')}_status`;
        updateData[aspectKey] = result.url;
        updateData[statusKey] = 'complete';
      });

      // Single database update instead of multiple
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update(updateData)
        .eq('id', postId);

      if (updateError) {
        console.error('❌ Database update failed:', updateError);
        // Don't fail the entire operation for DB update issues
      } else {
        console.log('✅ Database updated successfully');
      }
    }

    // PERFORMANCE IMPROVEMENT #5: Background processing for non-critical operations
    // Use EdgeRuntime.waitUntil for non-blocking operations
    const backgroundTasks = async () => {
      // Track API usage
      try {
        await supabase
          .from('api_usage_tracking')
          .insert({
            user_id: user.id,
            function_name: 'generate-all-images-optimized',
            model_used: 'batch-operation',
            request_type: 'image_generation',
            success: successfulResults.length > 0,
            estimated_cost: totalCost,
            tokens_used: totalTokens,
            response_time_ms: Date.now() - startTime,
            request_metadata: {
              post_id: postId,
              successful_images: successfulResults.length,
              failed_images: failedResults.length,
              aspect_ratios: ASPECT_RATIOS.map(r => r.ratio),
              results: [...successfulResults, ...failedResults]
            }
          });
      } catch (error) {
        console.error('⚠️ API usage tracking failed:', error);
      }

      // Trigger background processing
      if (successfulResults.length > 0) {
        try {
          await supabase.functions.invoke('process-uploaded-images', {
            body: { 
              postId,
              imageUrls: successfulResults.map(r => r.url!),
              aspectRatios: successfulResults.map(r => r.aspectRatio)
            }
          });
        } catch (error) {
          console.error('⚠️ Background processing failed:', error);
        }
      }
    };

    // Use waitUntil if available (Edge Runtime), otherwise run in background
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(backgroundTasks());
    } else {
      backgroundTasks().catch(console.error);
    }

    const processingTime = Date.now() - startTime;
    console.log(`🎉 Optimized batch generation complete! Generated ${successfulResults.length}/${ASPECT_RATIOS.length} images in ${processingTime}ms`);

    return new Response(JSON.stringify({ 
      success: true,
      results: successfulResults,
      failures: failedResults,
      totalCost,
      totalTokens,
      imagesGenerated: successfulResults.length,
      processingTimeMs: processingTime,
      aspectRatiosProcessed: ASPECT_RATIOS.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Optimized batch generation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});