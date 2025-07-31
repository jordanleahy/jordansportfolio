import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting batch image generation');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const userSupabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user ID from auth
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { postId, title, description, category } = await req.json();
    console.log(`📝 Processing post: ${postId} - "${title}"`);

    if (!postId || !title || !description) {
      console.error('❌ Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aspectRatios = ['16:9', '9:16', '4:3', '3:4'];
    const results = [];
    let totalCost = 0;
    let totalTokens = 0;

    console.log(`🎯 Generating images for ${aspectRatios.length} aspect ratios`);

    for (const aspectRatio of aspectRatios) {
      console.log(`🖼️ Generating ${aspectRatio} image...`);
      
      try {
        // Step 1: Generate prompt
        console.log(`📝 Generating prompt for ${aspectRatio}...`);
        const promptResponse = await supabase.functions.invoke('generate-image-prompt-dynamic', {
          body: { title, description, category: category || 'general' }
        });

        if (promptResponse.error) {
          console.error(`❌ Prompt generation failed for ${aspectRatio}:`, promptResponse.error);
          continue;
        }

        // Fix response structure - use correct field names from generate-image-prompt-dynamic
        const prompt = promptResponse.data?.generatedPrompt;
        const promptUsage = promptResponse.data?.usage;
        const promptCost = promptUsage?.estimated_cost || 0;
        
        if (!prompt) {
          console.error(`❌ No prompt received for ${aspectRatio}:`, promptResponse.data);
          continue;
        }
        
        // Add null check for substring to prevent errors
        const promptPreview = prompt ? prompt.substring(0, 100) : 'No prompt';
        console.log(`✅ Prompt generated for ${aspectRatio}: "${promptPreview}..."`);
        
        if (promptUsage?.total_tokens) totalTokens += promptUsage.total_tokens;
        if (promptCost) totalCost += promptCost;

        // Step 2: Generate image
        console.log(`🎨 Generating image for ${aspectRatio}...`);
        const imageResponse = await supabase.functions.invoke('generate-image-gpt', {
          body: { prompt, aspectRatio }
        });

        if (imageResponse.error) {
          console.error(`❌ Image generation failed for ${aspectRatio}:`, imageResponse.error);
          continue;
        }

        const { image: base64Image, cost: imageCost } = imageResponse.data || {};
        
        if (!base64Image) {
          console.error(`❌ No image received for ${aspectRatio}`);
          continue;
        }
        
        console.log(`✅ Image generated for ${aspectRatio}`);
        
        if (imageCost) totalCost += imageCost;

        // Step 3: Upload to storage
        console.log(`☁️ Uploading ${aspectRatio} image to storage...`);
        const fileName = `social-media/${user.id}/${postId}/${aspectRatio.replace(':', 'x')}-${Date.now()}.png`;
        
        const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('social-media-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error(`❌ Upload failed for ${aspectRatio}:`, uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('social-media-images')
          .getPublicUrl(fileName);

        console.log(`✅ Image uploaded for ${aspectRatio}: ${publicUrl}`);

        results.push({
          aspectRatio,
          url: publicUrl,
          prompt,
          fileName
        });

      } catch (error) {
        console.error(`❌ Error processing ${aspectRatio}:`, error);
      }
    }

    // Step 4: Update database with all images
    console.log(`💾 Updating database with ${results.length} images...`);
    
    const updateData: any = {};
    const statusData: any = {};
    
    results.forEach(result => {
      const aspectKey = `image_${result.aspectRatio.replace(':', '_')}_url`;
      const statusKey = `image_${result.aspectRatio.replace(':', '_')}_status`;
      updateData[aspectKey] = result.url;
      statusData[statusKey] = 'complete';
    });

    updateData.generated_image_prompt = results[0]?.prompt || null;
    Object.assign(updateData, statusData);

    const { error: updateError } = await supabase
      .from('social_media_posts')
      .update(updateData)
      .eq('id', postId);

    if (updateError) {
      console.error('❌ Database update failed:', updateError);
      return new Response(JSON.stringify({ error: 'Database update failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Database updated successfully');

    // Step 5: Track API usage
    console.log('📊 Tracking API usage...');
    try {
      const { error: trackingError } = await supabase
        .from('api_usage_tracking')
        .insert({
          user_id: user.id,
          function_name: 'generate-all-images',
          model_used: 'batch-operation',
          success: true,
          estimated_cost: totalCost,
          tokens_used: totalTokens,
          request_metadata: {
            post_id: postId,
            images_generated: results.length,
            aspect_ratios: aspectRatios,
            results: results.map(r => ({ aspectRatio: r.aspectRatio, success: true }))
          }
        });

      if (trackingError) {
        console.error('⚠️ API usage tracking failed:', trackingError);
      } else {
        console.log('✅ API usage tracked successfully');
      }
    } catch (trackingError) {
      console.error('⚠️ API usage tracking error:', trackingError);
    }

    // Step 6: Trigger background processing
    console.log('🔄 Triggering background processing...');
    try {
      await supabase.functions.invoke('process-uploaded-images', {
        body: { 
          postId,
          imageUrls: results.map(r => r.url),
          aspectRatios: results.map(r => r.aspectRatio)
        }
      });
      console.log('✅ Background processing triggered');
    } catch (processingError) {
      console.error('⚠️ Background processing failed:', processingError);
    }

    console.log(`🎉 Batch generation complete! Generated ${results.length} images with total cost: $${totalCost.toFixed(4)}`);

    return new Response(JSON.stringify({ 
      success: true,
      results,
      totalCost,
      totalTokens,
      imagesGenerated: results.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Batch generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});