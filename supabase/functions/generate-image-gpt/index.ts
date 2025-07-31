import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to track API usage
async function trackApiUsage(supabase: any, userId: string, functionName: string, modelUsed: string, requestType: string, success: boolean, estimatedCost: number, imageSize?: string, imageQuality?: string, responseTimeMs?: number, errorMessage?: string, metadata?: any) {
  try {
    await supabase.from('api_usage_tracking').insert({
      user_id: userId,
      function_name: functionName,
      model_used: modelUsed,
      request_type: requestType,
      image_size: imageSize,
      image_quality: imageQuality,
      estimated_cost: estimatedCost,
      success,
      error_message: errorMessage,
      request_metadata: metadata || {},
      response_time_ms: responseTimeMs,
    });
  } catch (error) {
    console.error('❌ Failed to track API usage:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const requestBody = await req.json();
    console.log('🔍 DEBUG: Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { prompt, aspectRatio = "1:1", seed = null, useDeterministicSeed = false, useManagedSeed = false, managedSeedCategory = null, seedContext = null } = requestBody;

    if (!prompt) {
      console.log('❌ DEBUG: No prompt provided');
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Initialize Supabase client and get user
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const sizeMap: Record<string, string> = {
      '16:9': '1536x1024',
      '9:16': '1024x1536', 
      '3:4': '1024x1536',
      '4:3': '1536x1024',
      '1:1': '1024x1024'
    };

    const size = sizeMap[aspectRatio] || '1024x1024';
    const estimatedCost = 0.040; // GPT-Image-1 standard pricing
    
    // Generate deterministic seed if requested, or use provided seed, or use managed seed
    let finalSeed = seed;
    
    // Check for managed seed first
    if (useManagedSeed && managedSeedCategory && userId) {
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
          console.log('🌱 Using managed seed:', finalSeed, 'for category:', managedSeedCategory);
        }
      } catch (error) {
        console.warn('Failed to fetch managed seed:', error);
      }
    }
    
    // Fall back to deterministic seed if no seed is set yet
    if (useDeterministicSeed && !finalSeed) {
      // Create deterministic seed based on seedContext + prompt + aspect ratio for uniqueness
      const encoder = new TextEncoder();
      const seedInput = seedContext ? `${seedContext}_${prompt}_${aspectRatio}` : `${prompt}_${aspectRatio}`;
      const data = encoder.encode(seedInput);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      // Convert first 4 bytes to a positive integer and constrain to valid range (0 to 2^32-1)
      const rawSeed = Math.abs(new DataView(hashArray.buffer).getInt32(0, false));
      finalSeed = rawSeed % 4294967295; // Ensure it's within valid range for OpenAI
    }

    console.log('🎨 IMAGE_GENERATION: Starting with prompt:', prompt.substring(0, 100) + '...', finalSeed ? `(seed: ${finalSeed})` : '');

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        size: size,
        quality: 'high',
        output_format: 'png',
        n: 1,
        ...(finalSeed && { seed: finalSeed })
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('🎨 IMAGE_GENERATION: OpenAI API error:', JSON.stringify(errorData, null, 2));
      console.error('🎨 IMAGE_GENERATION: Request details:', {
        url: 'https://api.openai.com/v1/images/generations',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': '[REDACTED]' },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: prompt.substring(0, 100) + '...',
          size: size,
          quality: 'high',
          output_format: 'png',
          n: 1,
          seed: finalSeed
        }, null, 2)
      });
      
      // Track failed usage
      if (userId) {
        await trackApiUsage(supabase, userId, 'generate-image-gpt', 'gpt-image-1', 'image_generation', false, 0, size, 'high', Date.now() - startTime, errorData.error?.message, { prompt: prompt.substring(0, 200), aspectRatio });
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate image', details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      console.error('🎨 IMAGE_GENERATION: Unexpected response format:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid response from image generation API' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const base64Image = data.data[0].b64_json;
    
    // Track successful usage
    if (userId) {
      await trackApiUsage(supabase, userId, 'generate-image-gpt', 'gpt-image-1', 'image_generation', true, estimatedCost, size, 'high', Date.now() - startTime, undefined, { prompt: prompt.substring(0, 200), aspectRatio });
    }
    
    console.log('🎨 IMAGE_GENERATION: Successfully generated image');
    
    return new Response(
      JSON.stringify({ 
        image: base64Image,
        aspectRatio: aspectRatio,
        size: size,
        seed: finalSeed,
        usage: { estimated_cost: estimatedCost }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('🎨 IMAGE_GENERATION: Error:', error);
    
    // Track error usage
    if (userId) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await trackApiUsage(supabase, userId, 'generate-image-gpt', 'gpt-image-1', 'image_generation', false, 0, '1024x1024', 'high', Date.now() - startTime, error.message, {});
      } catch (trackingError) {
        console.error('Failed to track error usage:', trackingError);
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});