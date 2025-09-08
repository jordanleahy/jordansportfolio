import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger, AdvancedLogger } from '../_shared/advanced-logger.ts';
import { trackOpenAIUsage, generateCorrelationId, calculateImageGenerationCost } from '../_shared/openai-attribution.ts';
import { appendSafeSpaceRules } from '../_shared/safeSpace.ts';

interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: string;
  seed?: number | null;
  category?: string | null;
  backgroundProcessing?: boolean;
  outputFormat?: 'jpeg' | 'png';
  quality?: 'high' | 'medium' | 'low' | 'auto';
}

interface ImageGenerationResponse {
  image: string;
  aspectRatio: string;
  size: string;
  seed: number | null;
  usage: {
    estimated_cost: number;
  };
  processingTimeMs: number;
  correlationId: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = generateCorrelationId();
  const logger = createLogger({
    correlationId,
    functionName: 'generate-image',
    operation: 'image_generation'
  });

  logger.logFunctionStart('generate-image');

  try {
    // Parse request body
    logger.startTiming('request_parsing');
    const requestBody = await req.json() as ImageGenerationRequest;
    const { 
      prompt, 
      aspectRatio = "4:3", 
      seed = null, 
      category = null,
      backgroundProcessing = false,
      outputFormat = 'jpeg',
      quality = 'high'
    } = requestBody;
    logger.endTiming('request_parsing');

    const normalizedAspectRatio = String(aspectRatio).replace(/_/g, ':');

    logger.info('Request received', {
      promptLength: prompt?.length,
      aspectRatio: normalizedAspectRatio,
      seed,
      category,
      backgroundProcessing,
      outputFormat,
      quality
    });

    // Validate required fields
    if (!prompt) {
      logger.error('Missing required field: prompt');
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      logger.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Initialize Supabase client for authentication
    logger.startTiming('supabase_init');
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    logger.endTiming('supabase_init');

    // Get user from auth header
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      logger.startTiming('user_auth');
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
      logger.endTiming('user_auth');
      
      if (userId) {
        logger.logUserAction('image_generation_request', {
          aspectRatio: normalizedAspectRatio,
          category,
          promptLength: prompt.length
        });
      }
    }

    // Map aspect ratios to sizes
    const sizeMap: Record<string, string> = {
      '16:9': '1536x1024',
      '9:16': '1024x1536', 
      '3:4': '1024x1536',
      '4:3': '1536x1024',
      '1:1': '1024x1024'
    };

    const size = sizeMap[normalizedAspectRatio] || '1536x1024';
    const estimatedCost = calculateImageGenerationCost(size, quality);
    
    logger.info('Image configuration', {
      size,
      estimatedCost: `$${estimatedCost.toFixed(4)}`,
      outputFormat,
      quality
    });

    // Handle seed (direct seed support only)
    const finalSeed = seed;

    // Apply safe space rules to the prompt
    logger.startTiming('safe_space_rules');
    const enhancedPrompt = appendSafeSpaceRules(prompt, normalizedAspectRatio);
    logger.endTiming('safe_space_rules');
    
    logger.info('Prompt enhancement completed', {
      originalLength: prompt.length,
      enhancedLength: enhancedPrompt.length,
      aspectRatio: normalizedAspectRatio
    });

    // Prepare OpenAI request
    const openAIRequestBody = {
      model: 'gpt-image-1',
      prompt: enhancedPrompt,
      size: size,
      quality: quality,
      output_format: outputFormat,
      n: 1,
      user: correlationId,
      ...(finalSeed && { seed: finalSeed })
    };

    logger.logOpenAIRequest('gpt-image-1', undefined, estimatedCost);
    logger.logImageGeneration(enhancedPrompt, 'started', undefined, {
      size,
      seed: finalSeed,
      outputFormat,
      quality
    });

    // Make OpenAI API request
    logger.startTiming('openai_request');
    const requestStartTime = Date.now();
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify(openAIRequestBody),
    });
    
    const responseTime = Date.now() - requestStartTime;
    logger.endTiming('openai_request');
    
    const openAIRequestId = response.headers.get('x-request-id') || correlationId;

    logger.logApiResponse('POST', 'https://api.openai.com/v1/images/generations', response.status, undefined, responseTime);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Enhanced error logging for console visibility
      console.error('OpenAI API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        correlationId,
        timestamp: new Date().toISOString()
      });
      
      logger.logOpenAIResponse('gpt-image-1', undefined, undefined, {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      logger.logImageGeneration(enhancedPrompt, 'failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });

      // Background task for error tracking
      if (userId) {
        const errorTrackingTask = trackOpenAIUsage({
          userId,
          functionName: 'generate-image',
          model: 'gpt-image-1',
          requestType: 'image_generation',
          success: false,
          estimatedCost: 0,
          imageSize: size,
          imageQuality: quality,
          responseTimeMs: responseTime,
          errorMessage: `HTTP ${response.status}`,
          metadata: { 
            prompt: prompt.substring(0, 200), 
            aspectRatio: normalizedAspectRatio,
            outputFormat,
            category 
          },
          correlationId,
          openAIRequestId,
        });
        
        if (backgroundProcessing) {
          EdgeRuntime.waitUntil(errorTrackingTask);
        } else {
          await errorTrackingTask;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate image', 
          details: errorData,
          correlationId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Parse successful response
    logger.startTiming('response_parsing');
    const data = await response.json();
    logger.endTiming('response_parsing');
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      logger.error('Invalid response format from OpenAI', { responseData: data });
      logger.logImageGeneration(enhancedPrompt, 'failed', {
        error: 'Invalid response format'
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response from image generation API',
          correlationId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const base64Image = data.data[0].b64_json;
    const processingTimeMs = Date.now() - logger.getContext().metadata?.startTime || 0;
    
    logger.logOpenAIResponse('gpt-image-1', undefined, estimatedCost);
    logger.logImageGeneration(enhancedPrompt, 'completed', undefined, {
      size,
      seed: finalSeed,
      outputFormat,
      quality,
      processingTimeMs,
      responseTimeMs: responseTime
    });

    // Track usage (background or immediate based on setting)
    if (userId) {
      const usageTrackingTask = trackOpenAIUsage({
        userId,
        functionName: 'generate-image',
        model: 'gpt-image-1',
        requestType: 'image_generation',
        success: true,
        estimatedCost,
        imageSize: size,
        imageQuality: quality,
        responseTimeMs: responseTime,
        metadata: { 
          prompt: prompt.substring(0, 200), 
          aspectRatio: normalizedAspectRatio, 
          seed: finalSeed,
          outputFormat,
          category,
          backgroundProcessing 
        },
        correlationId,
        openAIRequestId,
      });
      
      if (backgroundProcessing) {
        EdgeRuntime.waitUntil(usageTrackingTask);
      } else {
        await usageTrackingTask;
      }
    }

    // Performance warnings
    if (responseTime > 15000) {
      logger.warn('Slow OpenAI response detected', {
        responseTime: `${responseTime}ms`,
        threshold: '15000ms'
      });
    }
    
    if (processingTimeMs > 30000) {
      logger.warn('Slow total processing time detected', {
        processingTime: `${processingTimeMs}ms`,
        threshold: '30000ms'
      });
    }

    const responseData: ImageGenerationResponse = { 
      image: base64Image,
      aspectRatio: normalizedAspectRatio,
      size: size,
      seed: finalSeed,
      usage: { estimated_cost: estimatedCost },
      processingTimeMs,
      correlationId
    };

    logger.success('Image generation completed successfully', {
      processingTimeMs,
      responseTimeMs: responseTime,
      imageSize: size,
      outputFormat,
      backgroundProcessing
    });

    logger.logFunctionEnd('generate-image', responseData);
    
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Unexpected error in image generation', error, {
      errorType: error?.constructor?.name,
      stack: error?.stack
    });

    logger.logImageGeneration('', 'failed', error);
    logger.logFunctionEnd('generate-image', undefined, error);
    
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: errorMessage,
        correlationId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});