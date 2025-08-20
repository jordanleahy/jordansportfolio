import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

interface ImageGenerationRequest {
  postId: string;
  prompt: string;
  aspectRatio?: string;
  seed?: number | null;
  useDeterministicSeed?: boolean;
  useManagedSeed?: boolean;
  managedSeedCategory?: string | null;
  seedContext?: string | null;
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
      useManagedSeed = false, 
      managedSeedCategory = null, 
      seedContext = null, 
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

    console.log('🔒 CONCURRENCY_CONTROL: Lock acquired, starting generation');

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
      
      // Get managed seed if requested
      if (useManagedSeed && managedSeedCategory && !isCDICategory) {
        try {
          const { data: managedSeeds } = await supabase
            .from('image_seeds')
            .select('seed_value')
            .eq('user_id', userId)
            .eq('category', managedSeedCategory)
            .eq('is_default', true)
            .limit(1);
          
          if (managedSeeds && managedSeeds.length > 0) {
            finalSeed = managedSeeds[0].seed_value;
          }
        } catch (error) {
          console.warn('Failed to fetch managed seed:', error);
        }
      }
      
      // Generate deterministic seed if needed
      if (useDeterministicSeed && !finalSeed && !isCDICategory) {
        const encoder = new TextEncoder();
        const seedInput = seedContext ? `${seedContext}_${prompt}_${normalizedAspectRatio}` : `${prompt}_${normalizedAspectRatio}`;
        const data = encoder.encode(seedInput);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        const rawSeed = Math.abs(new DataView(hashArray.buffer).getInt32(0, false));
        finalSeed = rawSeed % 4294967295;
      }

      // OpenAI request
      const openAIRequestBody = {
        model: 'gpt-image-1',
        prompt: prompt,
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