import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { trackOpenAIUsage, generateCorrelationId, calculateImageGenerationCost } from '../_shared/openai-attribution.ts';
import { appendSafeSpaceRules } from '../_shared/safeSpace.ts';

// Type definitions for request/response
interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: string;
  seed?: number | null;
  useDeterministicSeed?: boolean;
  category?: string | null;
}

interface OpenAIImageResponse {
  data: Array<{
    b64_json: string;
  }>;
}

interface ImageGenerationResponse {
  image: string;
  aspectRatio: string;
  size: string;
  seed: number | null;
  usage: {
    estimated_cost: number;
  };
}

interface ErrorResponse {
  error: string;
  details?: any;
}

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
  let functionExitReason = 'unknown';

  // Enhanced startup logging
  console.log('🚀 FUNCTION_START: Image generation initiated', {
    correlationId,
    timestamp: new Date().toISOString(),
    requestId: req.headers.get('x-request-id') || 'unknown',
    userAgent: req.headers.get('user-agent'),
    method: req.method,
    url: req.url
  });

  const exitHandler = (reason: string) => {
    functionExitReason = reason;
    console.log('🏁 FUNCTION_EXIT:', {
      correlationId,
      reason,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      userId: userId?.slice(0, 8)
    });
  };

  try {
    console.log('🔍 DEBUG: Function started, parsing request body...');
    let incomingRequestBody: ImageGenerationRequest;
    try {
      incomingRequestBody = await req.json();
      console.log('🔍 DEBUG: Request body parsed successfully');
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      console.error('❌ DEBUG: JSON parsing failed:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: errorMessage } as ErrorResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { prompt, aspectRatio = "4:3", seed = null, useDeterministicSeed = false, category = null } = incomingRequestBody;

    // Normalize aspect ratio formats like "1_1" to "1:1"
    const normalizedAspectRatio: string = String(aspectRatio).replace(/_/g, ':');

    console.log('🔍 DEBUG: Parsed parameters - prompt exists:', !!prompt, 'aspectRatio:', aspectRatio, 'normalized:', normalizedAspectRatio);
    console.log('📐 ASPECT_RATIO: Received aspect ratio:', normalizedAspectRatio);

    if (!prompt) {
      console.log('❌ DEBUG: No prompt provided');
      return new Response(
        JSON.stringify({ error: 'Prompt is required' } as ErrorResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' } as ErrorResponse),
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

    const size = sizeMap[normalizedAspectRatio] || '1536x1024';
    console.log('📐 ASPECT_RATIO: Final size for OpenAI:', size, '(from aspect ratio:', normalizedAspectRatio + ')');
    console.log('🔗 CORRELATION: Request ID:', correlationId);
    const estimatedCost = calculateImageGenerationCost(size, 'high');
    
    // Disable seeds for CDI category
    const isCDICategory = category === 'cdi';
    
    // Generate deterministic seed if requested, or use provided seed, or use managed seed
    let finalSeed = isCDICategory ? null : seed;
    
    
    // Fall back to deterministic seed if no seed is set yet (skip for CDI)
    if (useDeterministicSeed && !finalSeed && !isCDICategory) {
      // Create deterministic seed based on prompt + aspect ratio for uniqueness
      const encoder = new TextEncoder();
      const seedInput = `${prompt}_${normalizedAspectRatio}`;
      const data = encoder.encode(seedInput);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      // Convert first 4 bytes to a positive integer and constrain to valid range (0 to 2^32-1)
      const rawSeed = Math.abs(new DataView(hashArray.buffer).getInt32(0, false));
      finalSeed = rawSeed % 4294967295; // Ensure it's within valid range for OpenAI
    }

    console.log('🎨 IMAGE_GENERATION: Starting with prompt:', prompt.substring(0, 100) + '...', finalSeed ? `(seed: ${finalSeed})` : '', `(correlation: ${correlationId})`);

    // Apply safe space rules to the prompt
    const enhancedPrompt = appendSafeSpaceRules(prompt, normalizedAspectRatio);
    console.log('🛡️ SAFE_SPACE: Applied safe space rules for', normalizedAspectRatio);

    // OpenAI request body without metadata (not supported by image generation API)
    const openAIRequestBody = {
      model: 'gpt-image-1',
      prompt: enhancedPrompt,
      size: size,
      quality: 'high',
      output_format: 'jpeg',
      n: 1,
      user: correlationId, // Only include user field for tracking
      ...(finalSeed && { seed: finalSeed })
    };

    // Make direct fetch call to avoid metadata issues
    const requestStartTime = Date.now();
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-Request-Source': 'supabase-edge-function',
      },
      body: JSON.stringify(openAIRequestBody),
    });
    
    const responseTime = Date.now() - requestStartTime;
    const openAIRequestId = response.headers.get('x-request-id') || 
                           response.headers.get('request-id') || 
                           correlationId;

    if (!response.ok) {
      console.error('🎨 IMAGE_GENERATION: OpenAI API error - Status:', response.status, 'StatusText:', response.statusText);
      let errorData: any;
      try {
        errorData = await response.json();
        console.error('🎨 IMAGE_GENERATION: OpenAI API error data:', JSON.stringify(errorData, null, 2));
      } catch (jsonError: unknown) {
        const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON error';
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
            output_format: 'jpeg',
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
          metadata: { prompt: prompt.substring(0, 200), aspectRatio: normalizedAspectRatio },
          correlationId,
          openAIRequestId,
        });
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate image', details: errorData } as ErrorResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    console.log('🎨 IMAGE_GENERATION: Response status:', response.status, 'Content-Type:', response.headers.get('content-type'));
    
    let data: OpenAIImageResponse;
    try {
      data = await response.json() as OpenAIImageResponse;
      console.log('🎨 IMAGE_GENERATION: Successfully parsed JSON response');
    } catch (jsonError: unknown) {
      const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON error';
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
          errorMessage: `JSON parsing error: ${errorMessage}`,
          metadata: { prompt: prompt.substring(0, 200), aspectRatio: normalizedAspectRatio },
          correlationId,
          openAIRequestId,
        });
      }
      
      return new Response(
        JSON.stringify({ error: 'Invalid JSON response from OpenAI API', details: `Parse error: ${errorMessage}` } as ErrorResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      console.error('🎨 IMAGE_GENERATION: Unexpected response format:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid response from image generation API' } as ErrorResponse),
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
        metadata: { prompt: prompt.substring(0, 200), aspectRatio: normalizedAspectRatio, seed: finalSeed },
        correlationId,
        openAIRequestId,
      });
    }
    
    console.log('🎨 IMAGE_GENERATION: Successfully generated image');
    
    exitHandler('success');
    
    return new Response(
      JSON.stringify({ 
        image: base64Image,
        aspectRatio: normalizedAspectRatio,
        size: size,
        seed: finalSeed,
        usage: { estimated_cost: estimatedCost }
      } as ImageGenerationResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
          errorMessage: errorMessage,
          metadata: {},
          correlationId,
        });
      } catch (trackingError) {
        console.error('Failed to track error usage:', trackingError);
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: errorMessage } as ErrorResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});