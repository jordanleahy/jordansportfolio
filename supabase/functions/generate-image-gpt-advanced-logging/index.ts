/**
 * EDGE FUNCTION: Generate Image GPT with Advanced Logging
 * 
 * PURPOSE:
 * Enhanced version of image generation with comprehensive performance logging
 * to identify bottlenecks in mobile image generation workflows.
 * 
 * FEATURES:
 * - Detailed timing metrics for each phase
 * - Mobile-specific performance tracking
 * - Request correlation IDs for debugging
 * - Comprehensive error logging
 * - Network latency analysis
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogEntry {
  timestamp: string;
  correlationId: string;
  phase: string;
  duration?: number;
  metadata?: any;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
}

class AdvancedLogger {
  private correlationId: string;
  private startTime: number;
  private phaseStartTimes: Map<string, number> = new Map();

  constructor(correlationId: string) {
    this.correlationId = correlationId;
    this.startTime = Date.now();
  }

  log(level: LogEntry['level'], phase: string, metadata?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId,
      phase,
      level,
      metadata
    };

    console.log(`[${level}] [${this.correlationId}] ${phase}:`, metadata || '');
    return entry;
  }

  startPhase(phase: string, metadata?: any) {
    this.phaseStartTimes.set(phase, Date.now());
    this.log('INFO', `${phase}_START`, metadata);
  }

  endPhase(phase: string, metadata?: any) {
    const startTime = this.phaseStartTimes.get(phase);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.log('INFO', `${phase}_END`, { ...metadata, duration_ms: duration });
      this.phaseStartTimes.delete(phase);
      return duration;
    }
    return 0;
  }

  getTotalDuration() {
    return Date.now() - this.startTime;
  }
}

function generateCorrelationId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

serve(async (req) => {
  const correlationId = generateCorrelationId();
  const logger = new AdvancedLogger(correlationId);
  
  logger.startPhase('REQUEST_INIT', {
    method: req.method,
    userAgent: req.headers.get('user-agent'),
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer')
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logger.log('INFO', 'CORS_PREFLIGHT', { duration_ms: logger.getTotalDuration() });
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    logger.startPhase('REQUEST_PARSE');
    const { prompt, aspectRatio, quality = 'high', backgroundProcessing = false } = await req.json();
    logger.endPhase('REQUEST_PARSE', { 
      promptLength: prompt?.length || 0,
      aspectRatio,
      quality,
      backgroundProcessing
    });

    if (!prompt) {
      throw new Error('Missing required field: prompt');
    }

    // Validate and set image dimensions based on aspect ratio
    logger.startPhase('DIMENSION_CALC');
    let size = '1024x1024'; // Default square
    
    if (aspectRatio) {
      switch (aspectRatio) {
        case '16:9':
          size = '1792x1024';
          break;
        case '9:16':
          size = '1024x1792';
          break;
        case '4:3':
          size = '1536x1024';
          break;
        case '3:4':
          size = '1024x1536';
          break;
        case '1:1':
        default:
          size = '1024x1024';
          break;
      }
    }
    
    logger.endPhase('DIMENSION_CALC', { calculatedSize: size });

    // Prepare OpenAI request
    logger.startPhase('OPENAI_REQUEST_PREP');
    const requestBody = {
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality,
      response_format: 'b64_json' // Always get base64 for consistent processing
    };
    
    logger.endPhase('OPENAI_REQUEST_PREP', {
      model: requestBody.model,
      size: requestBody.size,
      quality: requestBody.quality
    });

    // Call OpenAI API with detailed timing
    logger.startPhase('OPENAI_API_CALL');
    const apiCallStart = Date.now();
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const apiCallDuration = Date.now() - apiCallStart;
    
    logger.endPhase('OPENAI_API_CALL', { 
      statusCode: response.status,
      statusText: response.statusText,
      apiCallDuration_ms: apiCallDuration,
      responseHeaders: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.log('ERROR', 'OPENAI_API_ERROR', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    logger.startPhase('RESPONSE_PARSE');
    const data = await response.json();
    logger.endPhase('RESPONSE_PARSE', {
      hasData: !!data,
      hasImages: !!data.images,
      imageCount: data.images?.length || 0
    });

    if (!data.images || data.images.length === 0) {
      logger.log('ERROR', 'NO_IMAGES_GENERATED', { responseData: data });
      throw new Error('No images generated by OpenAI');
    }

    logger.startPhase('IMAGE_PROCESSING');
    const imageData = data.images[0];
    const base64Image = imageData.b64_json;
    
    if (!base64Image) {
      logger.log('ERROR', 'NO_BASE64_DATA', { imageData });
      throw new Error('No base64 image data received');
    }

    // Calculate approximate image size
    const imageSizeBytes = (base64Image.length * 3) / 4;
    const imageSizeMB = imageSizeBytes / (1024 * 1024);
    
    logger.endPhase('IMAGE_PROCESSING', {
      base64Length: base64Image.length,
      estimatedSizeBytes: imageSizeBytes,
      estimatedSizeMB: imageSizeMB.toFixed(2)
    });

    // Final success logging
    const totalDuration = logger.getTotalDuration();
    logger.log('INFO', 'GENERATION_COMPLETE', {
      totalDuration_ms: totalDuration,
      totalDuration_seconds: (totalDuration / 1000).toFixed(2),
      imageSize: size,
      quality: quality,
      success: true
    });

    // Performance analysis
    if (totalDuration > 30000) { // 30+ seconds
      logger.log('WARN', 'SLOW_GENERATION', {
        duration_ms: totalDuration,
        threshold_ms: 30000,
        possibleCauses: ['Network latency', 'OpenAI API load', 'Large image size', 'High quality setting']
      });
    }

    if (apiCallDuration > 20000) { // 20+ seconds on API call alone
      logger.log('WARN', 'SLOW_API_RESPONSE', {
        apiDuration_ms: apiCallDuration,
        threshold_ms: 20000,
        recommendation: 'Consider using lower quality setting or smaller size for faster generation'
      });
    }

    return new Response(
      JSON.stringify({ 
        image: base64Image,
        metadata: {
          correlationId,
          totalDuration_ms: totalDuration,
          size,
          quality,
          estimatedSizeMB: imageSizeMB.toFixed(2)
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
          'X-Generation-Time': totalDuration.toString()
        } 
      }
    );

  } catch (error) {
    const totalDuration = logger.getTotalDuration();
    
    logger.log('ERROR', 'GENERATION_FAILED', {
      error: error.message,
      stack: error.stack,
      totalDuration_ms: totalDuration,
      correlationId
    });

    console.error('Error in advanced image generation:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        correlationId,
        duration_ms: totalDuration
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId
        } 
      }
    );
  }
});