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
  timeout?: number;
  retryAttempt?: number;
  maxRetries?: number;
  operationType?: 'system_prompt' | 'content_generation' | 'image_generation' | 'default';
}

// Circuit breaker state for OpenAI API
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailureTime: 0,
  state: 'CLOSED'
};

// Timeout configuration based on operation type
function getTimeoutForOperation(operationType: string = 'default', retryAttempt: number = 1): number {
  const baseTimeouts = {
    'system_prompt': 180000,      // 180 seconds for complex system prompts
    'content_generation': 120000,  // 120 seconds for content generation
    'image_generation': 90000,    // 90 seconds for image generation
    'default': 180000             // 180 seconds default
  };
  
  const baseTimeout = baseTimeouts[operationType] || baseTimeouts['default'];
  
  // Escalating timeouts for retries
  const escalationMultipliers = [1, 1.5, 2]; // 1x, 1.5x, 2x for attempts 1, 2, 3
  const multiplier = escalationMultipliers[Math.min(retryAttempt - 1, 2)] || 2;
  
  return Math.floor(baseTimeout * multiplier);
}

// Exponential backoff with jitter
function calculateBackoffDelay(attempt: number): number {
  const baseDelay = 1000; // 1 second base
  const maxDelay = 10000; // 10 seconds max
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  const jitter = Math.random() * 0.3; // ±30% jitter
  return Math.floor(exponentialDelay * (1 + jitter));
}

// Check circuit breaker state
function checkCircuitBreaker(): boolean {
  const now = Date.now();
  const FAILURE_THRESHOLD = 3;
  const RECOVERY_TIMEOUT = 30000; // 30 seconds
  
  if (circuitBreaker.state === 'OPEN') {
    if (now - circuitBreaker.lastFailureTime >= RECOVERY_TIMEOUT) {
      circuitBreaker.state = 'HALF_OPEN';
      console.log('🔄 Circuit breaker: HALF_OPEN - testing recovery');
      return true;
    }
    console.log('⚡ Circuit breaker: OPEN - blocking request');
    return false;
  }
  
  return true;
}

// Update circuit breaker state
function updateCircuitBreaker(success: boolean) {
  if (success) {
    if (circuitBreaker.state === 'HALF_OPEN') {
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failures = 0;
      console.log('✅ Circuit breaker: CLOSED - recovered');
    }
  } else {
    circuitBreaker.failures++;
    circuitBreaker.lastFailureTime = Date.now();
    
    if (circuitBreaker.failures >= 3) {
      circuitBreaker.state = 'OPEN';
      console.log('🚨 Circuit breaker: OPEN - too many failures');
    }
  }
}

export async function makeOpenAIRequest(options: OpenAIRequestOptions) {
  const correlationId = options.correlationId || generateCorrelationId();
  const retryAttempt = options.retryAttempt || 1;
  const maxRetries = options.maxRetries || 3;
  const operationType = options.operationType || 'default';
  
  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    throw {
      error: new Error('Circuit breaker is open - too many recent failures'),
      correlationId,
      responseTime: 0,
      circuitBreakerOpen: true,
    };
  }
  
  // Add correlation headers for OpenAI request tracking
  const enhancedHeaders = {
    ...options.headers,
    'X-Correlation-ID': correlationId,
    'X-Request-Source': 'supabase-edge-function',
    'X-Retry-Attempt': retryAttempt.toString(),
    'X-Operation-Type': operationType,
  };

  const startTime = Date.now();
  const TIMEOUT_MS = options.timeout || getTimeoutForOperation(operationType, retryAttempt);
  
  // Implement timeout using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    console.log(`🔍 OpenAI Request with escalating timeout (${TIMEOUT_MS}ms):`, {
      url: options.url,
      method: options.method,
      correlationId,
      retryAttempt,
      operationType,
      timeout: TIMEOUT_MS,
      circuitBreakerState: circuitBreaker.state
    });

    const response = await fetch(options.url, {
      method: options.method,
      headers: enhancedHeaders,
      body: options.body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    // Update circuit breaker on success
    updateCircuitBreaker(true);
    
    console.log(`📥 OpenAI Response Details:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseTime,
      correlationId,
      retryAttempt,
      operationType
    });
    
    // Extract OpenAI request ID from response headers if available
    const openAIRequestId = response.headers.get('x-request-id') || 
                           response.headers.get('request-id') ||
                           correlationId; // fallback to correlation ID

    return {
      response,
      correlationId,
      openAIRequestId,
      responseTime,
      retryAttempt,
      operationType,
    };
    
  } catch (error) {
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    // Update circuit breaker on failure
    updateCircuitBreaker(false);
    
    if (error.name === 'AbortError') {
      console.error(`⏰ OpenAI Request timeout after ${TIMEOUT_MS}ms:`, {
        correlationId,
        responseTime,
        url: options.url,
        retryAttempt,
        operationType,
        circuitBreakerState: circuitBreaker.state
      });
      
      // Attempt retry with exponential backoff if retries remaining
      if (retryAttempt < maxRetries) {
        const backoffDelay = calculateBackoffDelay(retryAttempt);
        console.log(`🔄 Retrying OpenAI request in ${backoffDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        
        return makeOpenAIRequest({
          ...options,
          retryAttempt: retryAttempt + 1,
          correlationId, // Keep same correlation ID for tracking
        });
      }
      
      throw {
        error: new Error(`Trying to generate some prompts, your internet connection good? Request timed out after ${TIMEOUT_MS}ms (${retryAttempt} attempts)`),
        correlationId,
        responseTime,
        timeout: true,
        retryAttempt,
        operationType,
        circuitBreakerState: circuitBreaker.state,
        userFriendlyMessage: "Trying to generate some prompts, your internet connection good?",
      };
    }
    
    console.error(`❌ OpenAI Request failed:`, {
      error: error.message,
      correlationId,
      responseTime,
      url: options.url,
      retryAttempt,
      operationType,
      circuitBreakerState: circuitBreaker.state
    });
    
    // Attempt retry for non-timeout errors if retries remaining
    if (retryAttempt < maxRetries) {
      const backoffDelay = calculateBackoffDelay(retryAttempt);
      console.log(`🔄 Retrying OpenAI request in ${backoffDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      return makeOpenAIRequest({
        ...options,
        retryAttempt: retryAttempt + 1,
        correlationId, // Keep same correlation ID for tracking
      });
    }
    
    throw {
      error,
      correlationId,
      responseTime,
      retryAttempt,
      operationType,
      circuitBreakerState: circuitBreaker.state,
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
  const inputCost = promptTokens * (0.000150 / 1000); // gpt-5-mini input cost (per 1k tokens)
  const outputCost = completionTokens * (0.000600 / 1000); // gpt-5-mini output cost (per 1k tokens)
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