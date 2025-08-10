import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  themeId: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { themeId, userId }: RequestBody = await req.json();

    if (!themeId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: themeId and userId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🎨 DAY_1_4:3: Starting Day 1 image generation for theme ${themeId}, user ${userId}`);

    // Step 1: Find Day 1 post for this theme and user
    const { data: day1Post, error: queryError } = await supabase
      .from('social_media_posts')
      .select('id, title, description, category, image_4_3_url, image_4_3_status')
      .eq('theme_id', themeId)
      .eq('user_id', userId)
      .eq('day', 1)
      .single();

    if (queryError || !day1Post) {
      console.error('❌ DAY_1_4:3: Day 1 post not found:', queryError);
      return new Response(
        JSON.stringify({ error: 'Day 1 post not found for this theme' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const postId = day1Post.id;
    const aspectRatio = '4_3';
    const statusField = `image_${aspectRatio}_status`;
    const imageField = `image_${aspectRatio}_url`;

    console.log(`🎨 DAY_1_4:3: Found Day 1 post ${postId}: "${day1Post.title}"`);

    // Idempotency: skip if already processing/complete or URL already set
    if (day1Post.image_4_3_status === 'processing' || day1Post.image_4_3_status === 'complete' || day1Post.image_4_3_url) {
      console.log('⏭️ DAY_1_4:3: Skipping — already in progress or completed for post', postId, {
        status: day1Post.image_4_3_status,
        hasUrl: !!day1Post.image_4_3_url
      });
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'already_processing_or_complete', postId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Update status to uploading
    await supabase
      .from('social_media_posts')
      .update({ [statusField]: 'uploading' })
      .eq('id', postId);

    // Step 3: Generate prompt using the same pipeline as useImageManager
    console.log('🎨 DAY_1_4:3: Generating image prompt...');
    
    const promptResponse = await supabase.functions.invoke('generate-image-prompt-dynamic', {
      body: {
        title: day1Post.title,
        description: day1Post.description,
        category: day1Post.category || 'cdi',
        aspectRatio: '4:3'
      }
    });

    if (promptResponse.error) {
      throw new Error(`Failed to generate prompt: ${promptResponse.error.message}`);
    }

    const generatedPrompt = promptResponse.data?.generatedPrompt;
    if (!generatedPrompt) {
      throw new Error('No prompt generated');
    }

    // Store the generated prompt
    await supabase
      .from('social_media_posts')
      .update({ generated_image_prompt: generatedPrompt })
      .eq('id', postId);

    console.log(`🎨 DAY_1_4:3: Generated prompt: ${generatedPrompt.substring(0, 100)}...`);

    // Step 4: Generate image using the same pipeline
    console.log('🎨 DAY_1_4:3: Generating image with AI...');

    const imageResponse = await supabase.functions.invoke('generate-image-gpt', {
      body: {
        prompt: generatedPrompt,
        aspectRatio: '4:3'
      }
    });

    if (imageResponse.error) {
      throw new Error(`Failed to generate image: ${imageResponse.error.message}`);
    }

    const base64Image = imageResponse.data?.image;
    if (!base64Image) {
      throw new Error('No image generated');
    }

    // Step 5: Convert to file and upload (same as useImageManager)
    console.log('🎨 DAY_1_4:3: Processing and uploading image...');

    // Convert base64 to blob
    const response = await fetch(`data:image/jpeg;base64,${base64Image}`);
    const blob = await response.blob();
    
    // Create file object
    const fileName = `generated_${postId}_${aspectRatio}_${Date.now()}.jpg`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('social-media-images')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('social-media-images')
      .getPublicUrl(uploadData.path);

    console.log(`🎨 DAY_1_4:3: Setting image URL and status to 'processing' for post ${postId}`, {
      imageField,
      statusField,
      url: urlData.publicUrl.substring(0, 100) + '...'
    });

    // Step 6: Update post with image URL
    await supabase
      .from('social_media_posts')
      .update({ 
        [imageField]: urlData.publicUrl,
        [statusField]: 'processing' // Will be updated by background processing
      })
      .eq('id', postId);

    // Step 7: Trigger background processing for watermark (same as useImageManager)
    const triggerProcessing = () =>
      supabase.functions.invoke('process-uploaded-images', {
        body: {
          imageUrl: urlData.publicUrl,
          postId,
          aspectRatio
        }
      });

    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(
        triggerProcessing().catch((e: any) => console.error('process-uploaded-images failed', e))
      );
    } else {
      triggerProcessing().catch((e: any) => console.error('process-uploaded-images failed', e));
    }

    console.log(`✅ DAY_1_4:3: Day 1 image generation completed successfully for post ${postId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: urlData.publicUrl,
        postId,
        title: day1Post.title
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ DAY_1_4:3: Error in generate-day-1-4:3 function:', error);

    // Try to update status to failed if we have the necessary info
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    try {
      const body = await req.clone().json();
      if (body.themeId && body.userId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          const { data: day1Post } = await supabase
            .from('social_media_posts')
            .select('id')
            .eq('theme_id', body.themeId)
            .eq('user_id', body.userId)
            .eq('day', 1)
            .single();

          if (day1Post) {
            await supabase
              .from('social_media_posts')
              .update({ image_4_3_status: 'failed' })
              .eq('id', day1Post.id);
          }
        }
      }
    } catch (updateError) {
      console.error('❌ DAY_1_4:3: Failed to update status to failed:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});