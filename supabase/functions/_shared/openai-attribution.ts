// Enhanced OpenAI attribution utilities for API usage tracking and correlation
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

export interface OpenAIAttributionOptions {
  userId: string | null;
  functionName: string;
  model: string;
  requestType: 'text_generation' | 'image_generation' | 'image_prompt';
  success: boolean;
  estimatedCost: number;
  actualCost?: number;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  imageSize?: string;
  imageQuality?: string;
  responseTimeMs?: number;
  errorMessage?: string;
  metadata?: any;
  correlationId?: string;
  openAIRequestId?: string;
}

export function generateCorrelationId(): string {
  // Generate a unique correlation ID for tracking requests across systems
  const timestamp = Date.now().toString(36);
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('');
  return `${timestamp}-${randomString}`;
}

export async function trackOpenAIUsage(options: OpenAIAttributionOptions): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const correlationId = options.correlationId || generateCorrelationId();
    
    // Enhanced metadata with correlation and attribution info
    const enhancedMetadata = {
      ...options.metadata,
      correlation_id: correlationId,
      openai_request_id: options.openAIRequestId,
      function_context: options.functionName,
      user_attribution: {
        user_id: options.userId,
        authenticated: !!options.userId,
        timestamp: new Date().toISOString(),
      },
      request_correlation: {
        internal_id: correlationId,
        openai_id: options.openAIRequestId,
        trackable: true,
      }
    };

    const trackingData = {
      user_id: options.userId,
      function_name: options.functionName,
      model_used: options.model,
      request_type: options.requestType,
      tokens_used: options.tokensUsed,
      prompt_tokens: options.promptTokens,
      completion_tokens: options.completionTokens,
      total_tokens: options.tokensUsed,
      image_size: options.imageSize,
      image_quality: options.imageQuality,
      estimated_cost: options.estimatedCost,
      actual_cost: options.actualCost,
      success: options.success,
      error_message: options.errorMessage,
      request_metadata: enhancedMetadata,
      response_time_ms: options.responseTimeMs,
      // Enhanced OpenAI sync fields
      openai_request_id: options.openAIRequestId,
      openai_synced: false, // Will be updated during sync
      sync_status: 'pending',
    };

    await supabase.from('api_usage_tracking').insert(trackingData);

    // Also write to the new unified api_usage_events table for future-proof analytics
    const eventData = {
      user_id: options.userId,
      provider: 'openai',
      service: options.requestType === 'image_generation' ? 'images' : (options.requestType === 'image_prompt' ? 'prompts' : 'chat'),
      function_name: options.functionName,
      model_used: options.model,
      request_type: options.requestType,
      tokens_used: options.tokensUsed,
      prompt_tokens: options.promptTokens,
      completion_tokens: options.completionTokens,
      total_tokens: (typeof options.tokensUsed === 'number')
        ? options.tokensUsed
        : (typeof options.promptTokens === 'number' && typeof options.completionTokens === 'number'
          ? options.promptTokens + options.completionTokens
          : undefined),
      image_size: options.imageSize,
      image_quality: options.imageQuality,
      estimated_cost: options.estimatedCost,
      actual_cost: options.actualCost,
      success: options.success,
      error_message: options.errorMessage,
      http_status: options.metadata?.http_status ?? null,
      response_time_ms: options.responseTimeMs,
      correlation_id: correlationId,
      openai_request_id: options.openAIRequestId,
      request_metadata: enhancedMetadata,
    } as const;

    await supabase.from('api_usage_events').insert(eventData);

    
    console.log('✅ Enhanced OpenAI usage tracked:', {
      correlation_id: correlationId,
      function: options.functionName,
      user_id: options.userId?.slice(0, 8),
      model: options.model,
      success: options.success,
      cost: options.estimatedCost,
    });
    
  } catch (error) {
    console.error('❌ Failed to track OpenAI usage:', error);
    // Don't throw - tracking failures shouldn't break the main function
  }
}

export interface OpenAIRequestOptions {
  url: string;
  method: 'POST' | 'GET';
  headers: Record<string, string>;
  body?: string;
  correlationId?: string;
}

export async function makeOpenAIRequest(options: OpenAIRequestOptions) {
  const correlationId = options.correlationId || generateCorrelationId();
  
  // Add correlation headers for OpenAI request tracking
  const enhancedHeaders = {
    ...options.headers,
    'X-Correlation-ID': correlationId,
    'X-Request-Source': 'supabase-edge-function',
  };

  const startTime = Date.now();
  
  try {
    const response = await fetch(options.url, {
      method: options.method,
      headers: enhancedHeaders,
      body: options.body,
    });

    const responseTime = Date.now() - startTime;
    
    // Extract OpenAI request ID from response headers if available
    const openAIRequestId = response.headers.get('x-request-id') || 
                           response.headers.get('request-id') ||
                           correlationId; // fallback to correlation ID

    return {
      response,
      correlationId,
      openAIRequestId,
      responseTime,
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    throw {
      error,
      correlationId,
      responseTime,
    };
  }
}

export function enhanceOpenAIRequestBody(body: any, correlationId?: string): any {
  const correlation = correlationId || generateCorrelationId();
  
  // Add user tracking without metadata (metadata requires store parameter)
  return {
    ...body,
    user: correlation, // OpenAI user field for tracking
    // Remove metadata as it requires 'store' parameter to be enabled
  };
}

export function extractUsageFromOpenAIResponse(response: any): {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCost: number;
} {
  const usage = response.usage;
  
  if (!usage) {
    return { estimatedCost: 0 };
  }

  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || promptTokens + completionTokens;

  // Calculate cost based on model (simplified - should be model-specific)
  const inputCost = promptTokens * (0.000150 / 1000); // GPT-4o-mini input cost
  const outputCost = completionTokens * (0.000600 / 1000); // GPT-4o-mini output cost
  const estimatedCost = inputCost + outputCost;

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCost,
  };
}

export function calculateImageGenerationCost(size: string, quality: string = 'standard'): number {
  // GPT-Image-1 pricing (simplified)
  const baseCost = 0.040; // Standard pricing
  const qualityMultiplier = quality === 'high' ? 1.5 : 1.0;
  
  // Size adjustments (if any)
  const sizeMultiplier = size.includes('1536') || size.includes('1792') ? 1.2 : 1.0;
  
  return baseCost * qualityMultiplier * sizeMultiplier;
}