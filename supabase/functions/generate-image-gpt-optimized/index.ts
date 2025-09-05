import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { trackOpenAIUsage, generateCorrelationId, calculateImageGenerationCost } from '../_shared/openai-attribution.ts';
import { appendSafeSpaceRules } from '../_shared/safeSpace.ts';

interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: string;
  seed?: number | null;
  useDeterministicSeed?: boolean;
  useManagedSeed?: boolean;
  managedSeedCategory?: string | null;
  seedContext?: string | null;
  category?: string | null;
  backgroundProcessing?: boolean;
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
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Background processing tasks
const backgroundTasks: Promise<void>[] = [];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  const correlationId = generateCorrelationId();

  try {
    const requestBody = await req.json() as ImageGenerationRequest;
    const { 
      prompt, 
      aspectRatio = "4:3", 
      seed = null, 
      useDeterministicSeed = false,
      useManagedSeed = false, 
      managedSeedCategory = null, 
      seedContext = null, 
      category = null,
      backgroundProcessing = false
    } = requestBody;

    const normalizedAspectRatio = String(aspectRatio).replace(/_/g, ':');

    if (!prompt) {
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

    // Initialize Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
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

    console.log('🎨 IMAGE_GENERATION_OPTIMIZED: Starting generation', {
      correlationId,
      aspectRatio: normalizedAspectRatio,
      size,
      backgroundProcessing,
      userId: userId?.slice(0, 8)
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
      user: correlationId,
      ...(finalSeed && { seed: finalSeed })
    };

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
    const openAIRequestId = response.headers.get('x-request-id') || correlationId;

    if (!response.ok) {
      console.error('🎨 IMAGE_GENERATION_OPTIMIZED: OpenAI API error', response.status);
      
      // Background task for error tracking
      if (backgroundProcessing && userId) {
        const errorTrackingTask = trackOpenAIUsage({
          userId,
          functionName: 'generate-image-gpt-optimized',
          model: 'gpt-image-1',
          requestType: 'image_generation',
          success: false,
          estimatedCost: 0,
          imageSize: size,
          imageQuality: 'high',
          responseTimeMs: responseTime,
          errorMessage: `HTTP ${response.status}`,
          metadata: { prompt: prompt.substring(0, 200), aspectRatio: normalizedAspectRatio },
          correlationId,
          openAIRequestId,
        });
        
        EdgeRuntime.waitUntil(errorTrackingTask);
      }
      
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: 'Failed to generate image', details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      console.error('🎨 IMAGE_GENERATION_OPTIMIZED: Invalid response format');
      return new Response(
        JSON.stringify({ error: 'Invalid response from image generation API' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const base64Image = data.data[0].b64_json;
    const processingTimeMs = Date.now() - startTime;
    
    // Background task for success tracking
    if (backgroundProcessing && userId) {
      const successTrackingTask = trackOpenAIUsage({
        userId,
        functionName: 'generate-image-gpt-optimized',
        model: 'gpt-image-1',
        requestType: 'image_generation',
        success: true,
        estimatedCost,
        imageSize: size,
        imageQuality: 'high',
        responseTimeMs: responseTime,
        metadata: { 
          prompt: prompt.substring(0, 200), 
          aspectRatio: normalizedAspectRatio, 
          seed: finalSeed,
          backgroundProcessing 
        },
        correlationId,
        openAIRequestId,
      });
      
      EdgeRuntime.waitUntil(successTrackingTask);
    } else if (userId) {
      // Immediate tracking for non-background requests
      await trackOpenAIUsage({
        userId,
        functionName: 'generate-image-gpt-optimized',
        model: 'gpt-image-1',
        requestType: 'image_generation',
        success: true,
        estimatedCost,
        imageSize: size,
        imageQuality: 'high',
        responseTimeMs: responseTime,
        metadata: { 
          prompt: prompt.substring(0, 200), 
          aspectRatio: normalizedAspectRatio, 
          seed: finalSeed 
        },
        correlationId,
        openAIRequestId,
      });
    }
    
    console.log('🎨 IMAGE_GENERATION_OPTIMIZED: Success', {
      correlationId,
      processingTimeMs,
      backgroundProcessing
    });
    
    return new Response(
      JSON.stringify({ 
        image: base64Image,
        aspectRatio: normalizedAspectRatio,
        size: size,
        seed: finalSeed,
        usage: { estimated_cost: estimatedCost },
        processingTimeMs
      } as ImageGenerationResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('🎨 IMAGE_GENERATION_OPTIMIZED: Error:', error);
    
    // Background error tracking
    if (userId) {
      const errorTrackingTask = trackOpenAIUsage({
        userId,
        functionName: 'generate-image-gpt-optimized',
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
      
      EdgeRuntime.waitUntil(errorTrackingTask);
    }
    
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});