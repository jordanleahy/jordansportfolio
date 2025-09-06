import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { appendSafeSpaceRules } from '../_shared/safeSpace.ts';

interface ImageGenerationRequest {
  postId: string;
  prompt: string;
  aspectRatio?: string;
  seed?: number | null;
  useDeterministicSeed?: boolean;
  category?: string | null;
}

interface ImageGenerationResponse {
  success: boolean;
  image?: string;
  aspectRatio?: string;
  size?: string;
  seed?: number | null;
  usage?: {
    estimated_cost: number;
  };
  processingTimeMs?: number;
  error?: string;
  message?: string;
  currentStatus?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const calculateImageGenerationCost = (size: string, quality: string): number => {
  const baseCosts: Record<string, number> = {
    '1024x1024': 0.04,
    '1536x1024': 0.08,
    '1024x1536': 0.08,
  };
  const qualityMultiplier = quality === 'high' ? 2 : 1;
  return (baseCosts[size] || 0.04) * qualityMultiplier;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const requestBody = await req.json() as ImageGenerationRequest;
    const { 
      postId,
      prompt, 
      aspectRatio = "4:3", 
      seed = null, 
      useDeterministicSeed = false,
      category = null
    } = requestBody;

    const normalizedAspectRatio = String(aspectRatio).replace(/_/g, ':');

    if (!postId || !prompt) {
      return new Response(
        JSON.stringify({ success: false, error: 'PostId and prompt are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('🔒 CONCURRENCY_CONTROL: Attempting to start generation', {
      postId,
      aspectRatio: normalizedAspectRatio,
      userId: userId.slice(0, 8)
    });

    // Try to acquire generation lock atomically
    const { data: lockResult, error: lockError } = await supabase.rpc(
      'try_start_image_generation',
      {
        p_post_id: postId,
        p_aspect_ratio: normalizedAspectRatio,
        p_user_id: userId
      }
    );

    if (lockError) {
      console.error('🔒 CONCURRENCY_CONTROL: Lock error:', lockError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error', details: lockError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!lockResult?.success) {
      console.log('🔒 CONCURRENCY_CONTROL: Generation already in progress', {
        postId,
        currentStatus: lockResult?.current_status,
        message: lockResult?.message
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Generation already in progress',
          message: lockResult?.message || 'Another process is already generating this image',
          currentStatus: lockResult?.current_status
        } as ImageGenerationResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      );
    }

    console.log('🔒 CONCURRENCY_CONTROL: Lock acquired, checking usage limits');

    // Check usage limits before proceeding with generation
    try {
      const { data: usageCheck, error: usageError } = await supabase.functions.invoke('check-usage-limits', {
        body: { usage_type: 'image_generation', amount: 1 }
      });

      if (usageError) {
        console.error('🔒 CONCURRENCY_CONTROL: Usage check error:', usageError);
        // Mark as failed and release lock
        await supabase.rpc('complete_image_generation', {
          p_post_id: postId,
          p_aspect_ratio: normalizedAspectRatio,
          p_user_id: userId,
          p_status: 'failed'
        });
        
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to check usage limits', details: usageError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      if (!usageCheck?.allowed) {
        console.log('🔒 CONCURRENCY_CONTROL: Usage limit exceeded', {
          remaining: usageCheck?.remaining,
          limit: usageCheck?.limit,
          message: usageCheck?.message
        });
        
        // Mark as failed and release lock
        await supabase.rpc('complete_image_generation', {
          p_post_id: postId,
          p_aspect_ratio: normalizedAspectRatio,
          p_user_id: userId,
          p_status: 'failed'
        });
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Usage limit exceeded',
            message: usageCheck?.message || 'You have exceeded your usage limits',
            remaining: usageCheck?.remaining || 0,
            limit: usageCheck?.limit || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }

      console.log('🔒 CONCURRENCY_CONTROL: Usage limits passed, starting generation');
    } catch (limitError) {
      console.error('🔒 CONCURRENCY_CONTROL: Limit check failed:', limitError);
      // Mark as failed and release lock
      await supabase.rpc('complete_image_generation', {
        p_post_id: postId,
        p_aspect_ratio: normalizedAspectRatio,
        p_user_id: userId,
        p_status: 'failed'
      });
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify usage limits' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    try {
      const sizeMap: Record<string, string> = {
        '16:9': '1536x1024',
        '9:16': '1024x1536', 
        '3:4': '1024x1536',
        '4:3': '1536x1024',
        '1:1': '1024x1024'
      };

      const size = sizeMap[normalizedAspectRatio] || '1536x1024';
      const estimatedCost = calculateImageGenerationCost(size, 'high');
      
      const isCDICategory = category === 'cdi';
      let finalSeed = isCDICategory ? null : seed;
      
      
      // Generate deterministic seed if needed
      if (useDeterministicSeed && !finalSeed && !isCDICategory) {
        const encoder = new TextEncoder();
        const seedInput = `${prompt}_${normalizedAspectRatio}`;
        const data = encoder.encode(seedInput);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        const rawSeed = Math.abs(new DataView(hashArray.buffer).getInt32(0, false));
        finalSeed = rawSeed % 4294967295;
      }

      console.log('🔒 CONCURRENCY_CONTROL: Starting OpenAI generation', {
        postId,
        aspectRatio: normalizedAspectRatio,
        size,
        seed: finalSeed
      });

      // Apply safe space rules to the prompt
      const enhancedPrompt = appendSafeSpaceRules(prompt, normalizedAspectRatio);
      console.log('🛡️ SAFE_SPACE: Applied safe space rules for', normalizedAspectRatio);

      // OpenAI request
      const openAIRequestBody = {
        model: 'gpt-image-1',
        prompt: enhancedPrompt,
        size: size,
        quality: 'high',
        output_format: 'jpeg',
        n: 1,
        ...(finalSeed && { seed: finalSeed })
      };

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openAIRequestBody),
      });

      if (!response.ok) {
        console.error('🔒 CONCURRENCY_CONTROL: OpenAI API error', response.status);
        
        // Track failed usage
        try {
          await supabase
            .from('api_usage_tracking')
            .insert({
              user_id: userId,
              function_name: 'generate-image-with-concurrency-control',
              request_type: 'image_generation',
              model_used: 'gpt-image-1',
              success: false,
              estimated_cost: 0,
              image_size: size,
              image_quality: 'high',
              response_time_ms: Date.now() - startTime,
              error_message: `OpenAI API error: ${response.status}`,
              request_metadata: {
                post_id: postId,
                aspect_ratio: normalizedAspectRatio,
                prompt_length: prompt.length
              }
            });
        } catch (trackingError) {
          console.error('🔒 CONCURRENCY_CONTROL: Failed to track failed usage:', trackingError);
        }
        
        // Mark as failed in database
        await supabase.rpc('complete_image_generation', {
          p_post_id: postId,
          p_aspect_ratio: normalizedAspectRatio,
          p_user_id: userId,
          p_status: 'failed'
        });
        
        const errorData = await response.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to generate image', details: errorData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
        );
      }

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].b64_json) {
        console.error('🔒 CONCURRENCY_CONTROL: Invalid response format');
        
        // Mark as failed in database
        await supabase.rpc('complete_image_generation', {
          p_post_id: postId,
          p_aspect_ratio: normalizedAspectRatio,
          p_user_id: userId,
          p_status: 'failed'
        });
        
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid response from image generation API' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const base64Image = data.data[0].b64_json;
      
      // Upload to Supabase Storage
      const fileName = `${postId}_${normalizedAspectRatio.replace(':', '_')}_${Date.now()}.jpg`;
      const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('🔒 CONCURRENCY_CONTROL: Upload error:', uploadError);
        
        // Mark as failed in database
        await supabase.rpc('complete_image_generation', {
          p_post_id: postId,
          p_aspect_ratio: normalizedAspectRatio,
          p_user_id: userId,
          p_status: 'failed'
        });
        
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to upload image', details: uploadError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;
      const processingTimeMs = Date.now() - startTime;

      // Mark as complete in database with image URL
      const updateResult = await supabase.rpc('complete_image_generation', {
        p_post_id: postId,
        p_aspect_ratio: normalizedAspectRatio,
        p_user_id: userId,
        p_status: 'complete',
        p_image_url: imageUrl
      });

      if (!updateResult) {
        console.warn('🔒 CONCURRENCY_CONTROL: Failed to update database with completion status');
      }

      // Track successful usage
      try {
        await supabase
          .from('api_usage_tracking')
          .insert({
            user_id: userId,
            function_name: 'generate-image-with-concurrency-control',
            request_type: 'image_generation',
            model_used: 'gpt-image-1',
            success: true,
            estimated_cost: estimatedCost,
            image_size: size,
            image_quality: 'high',
            response_time_ms: processingTimeMs,
            request_metadata: {
              post_id: postId,
              aspect_ratio: normalizedAspectRatio,
              seed: finalSeed,
              prompt_length: prompt.length
            }
          });
        console.log('🔒 CONCURRENCY_CONTROL: Usage tracked successfully');
      } catch (trackingError) {
        console.error('🔒 CONCURRENCY_CONTROL: Failed to track usage:', trackingError);
        // Don't fail the whole request for tracking errors, just log them
      }

      console.log('🔒 CONCURRENCY_CONTROL: Generation complete', {
        postId,
        processingTimeMs,
        imageUrl: imageUrl.slice(-50)
      });
      
      return new Response(
        JSON.stringify({ 
          success: true,
          image: base64Image,
          aspectRatio: normalizedAspectRatio,
          size: size,
          seed: finalSeed,
          usage: { estimated_cost: estimatedCost },
          processingTimeMs
        } as ImageGenerationResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (generationError) {
      console.error('🔒 CONCURRENCY_CONTROL: Generation error:', generationError);
      
      // Mark as failed in database
      await supabase.rpc('complete_image_generation', {
        p_post_id: postId,
        p_aspect_ratio: normalizedAspectRatio,
        p_user_id: userId,
        p_status: 'failed'
      });
      
      throw generationError;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('🔒 CONCURRENCY_CONTROL: Error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred', details: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});