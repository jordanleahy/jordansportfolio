import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { trackOpenAIUsage, generateCorrelationId, makeOpenAIRequest, enhanceOpenAIRequestBody, calculateImageGenerationCost } from '../_shared/openai-attribution.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  const correlationId = generateCorrelationId();

  try {
    console.log('🔍 DEBUG: Function started, parsing request body...');
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('🔍 DEBUG: Request body parsed successfully');
    } catch (parseError) {
      console.error('❌ DEBUG: JSON parsing failed:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { prompt, aspectRatio = "4:3", seed = null, useDeterministicSeed = false, useManagedSeed = false, managedSeedCategory = null, seedContext = null, category = null } = requestBody;

    console.log('🔍 DEBUG: Parsed parameters - prompt exists:', !!prompt, 'aspectRatio:', aspectRatio, 'seedContext exists:', !!seedContext);
    console.log('📐 ASPECT_RATIO: Received aspect ratio:', aspectRatio);

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

    const size = sizeMap[aspectRatio] || '1536x1024';
    console.log('📐 ASPECT_RATIO: Final size for OpenAI:', size, '(from aspect ratio:', aspectRatio + ')');
    console.log('🔗 CORRELATION: Request ID:', correlationId);
    const estimatedCost = calculateImageGenerationCost(size, 'high');
    
    // Disable seeds for CDI category
    const isCDICategory = category === 'cdi';
    
    // Generate deterministic seed if requested, or use provided seed, or use managed seed
    let finalSeed = isCDICategory ? null : seed;
    
    // Check for managed seed first (skip for CDI)
    if (useManagedSeed && managedSeedCategory && userId && !isCDICategory) {
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
    
    // Fall back to deterministic seed if no seed is set yet (skip for CDI)
    if (useDeterministicSeed && !finalSeed && !isCDICategory) {
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

    console.log('🎨 IMAGE_GENERATION: Starting with prompt:', prompt.substring(0, 100) + '...', finalSeed ? `(seed: ${finalSeed})` : '', `(correlation: ${correlationId})`);

    // Enhanced OpenAI request with correlation tracking
    const requestBody = enhanceOpenAIRequestBody({
      model: 'gpt-image-1',
      prompt: prompt,
      size: size,
      quality: 'high',
      output_format: 'png',
      n: 1,
      ...(finalSeed && { seed: finalSeed })
    }, correlationId);

    const { response, openAIRequestId, responseTime } = await makeOpenAIRequest({
      url: 'https://api.openai.com/v1/images/generations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      correlationId,
    });

    if (!response.ok) {
      console.error('🎨 IMAGE_GENERATION: OpenAI API error - Status:', response.status, 'StatusText:', response.statusText);
      let errorData;
      try {
        errorData = await response.json();
        console.error('🎨 IMAGE_GENERATION: OpenAI API error data:', JSON.stringify(errorData, null, 2));
      } catch (jsonError) {
        console.error('🎨 IMAGE_GENERATION: Failed to parse error response as JSON:', jsonError);
        const textResponse = await response.text();
        console.error('🎨 IMAGE_GENERATION: Raw error response:', textResponse.substring(0, 500));
        errorData = { error: { message: `Invalid response format: ${textResponse.substring(0, 200)}` } };
      }
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
      
      // Track failed usage with enhanced attribution
      if (userId) {
        await trackOpenAIUsage({
          userId,
          functionName: 'generate-image-gpt',
          model: 'gpt-image-1',
          requestType: 'image_generation',
          success: false,
          estimatedCost: 0,
          imageSize: size,
          imageQuality: 'high',
          responseTimeMs: responseTime,
          errorMessage: errorData.error?.message,
          metadata: { prompt: prompt.substring(0, 200), aspectRatio },
          correlationId,
          openAIRequestId,
        });
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate image', details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    console.log('🎨 IMAGE_GENERATION: Response status:', response.status, 'Content-Type:', response.headers.get('content-type'));
    
    let data;
    try {
      data = await response.json();
      console.log('🎨 IMAGE_GENERATION: Successfully parsed JSON response');
    } catch (jsonError) {
      console.error('🎨 IMAGE_GENERATION: Failed to parse success response as JSON:', jsonError);
      const textResponse = await response.text();
      console.error('🎨 IMAGE_GENERATION: Raw success response:', textResponse.substring(0, 500));
      
      // Track failed usage for JSON parsing error with enhanced attribution
      if (userId) {
        await trackOpenAIUsage({
          userId,
          functionName: 'generate-image-gpt',
          model: 'gpt-image-1',
          requestType: 'image_generation',
          success: false,
          estimatedCost: 0,
          imageSize: size,
          imageQuality: 'high',
          responseTimeMs: responseTime,
          errorMessage: `JSON parsing error: ${jsonError.message}`,
          metadata: { prompt: prompt.substring(0, 200), aspectRatio },
          correlationId,
          openAIRequestId,
        });
      }
      
      return new Response(
        JSON.stringify({ error: 'Invalid JSON response from OpenAI API', details: `Parse error: ${jsonError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      console.error('🎨 IMAGE_GENERATION: Unexpected response format:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid response from image generation API' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const base64Image = data.data[0].b64_json;
    
    // Track successful usage with enhanced attribution
    if (userId) {
      await trackOpenAIUsage({
        userId,
        functionName: 'generate-image-gpt',
        model: 'gpt-image-1',
        requestType: 'image_generation',
        success: true,
        estimatedCost,
        imageSize: size,
        imageQuality: 'high',
        responseTimeMs: responseTime,
        metadata: { prompt: prompt.substring(0, 200), aspectRatio, seed: finalSeed },
        correlationId,
        openAIRequestId,
      });
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
    
    // Track error usage with enhanced attribution
    if (userId) {
      try {
        await trackOpenAIUsage({
          userId,
          functionName: 'generate-image-gpt',
          model: 'gpt-image-1',
          requestType: 'image_generation',
          success: false,
          estimatedCost: 0,
          imageSize: '1024x1024',
          imageQuality: 'high',
          responseTimeMs: Date.now() - startTime,
          errorMessage: error.message,
          metadata: {},
          correlationId,
        });
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