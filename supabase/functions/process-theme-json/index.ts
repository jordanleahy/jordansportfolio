/**
 * EDGE FUNCTION: Process Theme JSON
 * 
 * PURPOSE:
 * Cleans, validates, and enhances raw theme JSON data using OpenAI for intelligent processing.
 * Fixes JSON syntax errors, validates theme structure, generates missing fields, and ensures
 * data integrity for social media content calendar imports with comprehensive error reporting.
 * 
 * INPUTS:
 * - rawJson: any - Raw theme data that may have formatting issues or missing fields
 * 
 * OUTPUTS:
 * - Success: { success: true, cleanedData: object, fixes: array, warnings: array, errors: array }
 * - Error: { success: false, fixes: array, warnings: array, errors: array }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-4o-mini for intelligent data cleaning and validation)
 * - OpenAI Attribution System (usage tracking and cost calculation)
 * 
 * USAGE:
 * Called from: Data import workflows, theme processing pipelines, content validation systems
 * Authentication: Optional - enhanced tracking and attribution available for authenticated users
 * 
 * FLOW:
 * 1. Parse incoming raw JSON data with comprehensive logging
 * 2. Apply AI-powered cleaning using OpenAI to fix syntax and structural issues
 * 3. Generate missing required fields (day numbers, status, etc.)
 * 4. Validate theme structure against expected schema (category, theme, posts array)
 * 5. Apply business rules (30 post limit, required fields validation)
 * 6. Track API usage and costs for monitoring
 * 7. Return detailed processing results with fixes, warnings, and errors
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { trackOpenAIUsage, generateCorrelationId, makeOpenAIRequest, enhanceOpenAIRequestBody, extractUsageFromOpenAIResponse } from '../_shared/openai-attribution.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingResult {
  success: boolean;
  cleanedData?: any;
  fixes: string[];
  warnings: string[];
  errors: string[];
}

serve(async (req) => {
  console.log('🚀 Edge Function: process-theme-json started');
  console.log('📥 Request method:', req.method);
  console.log('📋 Request headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  const correlationId = generateCorrelationId();
  let success = false;
  let estimatedCost = 0;
  let tokensUsed = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let errorMessage: string | undefined;
  let requestMetadata: any = {};
  let openAIRequestId: string | undefined;

  try {
    console.log('📦 Parsing request body...');
    const requestBody = await req.json();
    console.log('📊 Request body keys:', Object.keys(requestBody));
    console.log('📋 Raw JSON type:', typeof requestBody.rawJson);
    console.log('📋 Raw JSON preview:', JSON.stringify(requestBody.rawJson, null, 2).substring(0, 500));
    
    const { rawJson } = requestBody;
    requestMetadata = { correlationId, dataType: typeof rawJson };
    console.log('🔄 Processing theme JSON data...', { correlationId });

    const result = await processThemeJsonWithAI(rawJson, userId, correlationId, requestMetadata);
    console.log('✅ Processing completed:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('💥 Error in process-theme-json function:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({
      success: false,
      errors: [error.message || 'Unknown error occurred'],
      fixes: [],
      warnings: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processThemeJsonWithAI(rawData: any, userId?: string, correlationId?: string, requestMetadata?: any): Promise<ProcessingResult> {
  console.log('🤖 Starting AI processing pipeline');
  console.log('📊 Input data type:', typeof rawData);
  console.log('📋 Input data structure:', JSON.stringify(rawData, null, 2).substring(0, 300));
  
  const fixes: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    console.log('🔄 Calling AI processing...');
    const aiProcessedData = await aiProcessThemeData(rawData, userId, correlationId, requestMetadata);
    console.log('✅ AI processing completed');
    console.log('📊 AI result type:', typeof aiProcessedData);
    console.log('📋 AI result preview:', JSON.stringify(aiProcessedData, null, 2).substring(0, 300));
    
    console.log('🔍 Validating theme fields...');
    const validatedData = validateThemeFields(aiProcessedData, fixes, warnings, errors);
    console.log('✅ Validation completed');
    console.log('📊 Validation fixes:', fixes);
    console.log('⚠️ Validation warnings:', warnings);
    console.log('❌ Validation errors:', errors);

    const result = {
      success: errors.length === 0,
      cleanedData: validatedData,
      fixes,
      warnings,
      errors
    };
    
    console.log('🎯 Final processing result:', result);
    return result;
  } catch (error) {
    console.error('💥 AI processing pipeline failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    errors.push(`AI processing failed: ${error.message}`);
    
    return {
      success: false,
      fixes,
      warnings,
      errors
    };
  }
}

async function aiProcessThemeData(rawData: any, userId?: string, correlationId?: string, requestMetadata?: any) {
  console.log('🔐 Checking OpenAI API key...');
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.error('❌ OpenAI API key not configured');
    throw new Error('OpenAI API key not configured');
  }
  console.log('✅ OpenAI API key found');

  const prompt = `Fix and clean this JSON data for a social media content calendar. 
  
  Expected structure:
  {
    "category": "string (1-100, optional)",
    "theme": "string (1-200)", 
    "theme_description": "string (optional, <=1000)",
    "posts": [
      {
        "day": number (1-365, optional),
        "title": "string (1-500)",
        "story_description": "string (1-2000)",
        "status": "draft|scheduled|published"
      }
    ]
  }
  
  Rules:
  - Fix JSON syntax errors
  - Ensure all posts have title and story_description (map description -> story_description if needed)
  - Generate sequential day numbers if missing
  - Set status to "draft" if not provided
  - Limit to 100 posts maximum
  - Trim strings and enforce length limits
  
  Raw data:
  ${JSON.stringify(rawData, null, 2)}
  
  Return only the cleaned JSON:`;

  console.log('🔗 Calling OpenAI API for theme processing...');
  console.log('📋 Prompt length:', prompt.length);

  try {
     const requestBody = {
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON processor. Return only valid JSON without explanations or markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_completion_tokens: 3000,
    };
    
    console.log('📤 Sending request to OpenAI...');
    
    // Enhanced OpenAI request with correlation tracking
    const enhancedRequestBody = enhanceOpenAIRequestBody(requestBody, correlationId);

    const { response, openAIRequestId: responseOpenAIRequestId, responseTime } = await makeOpenAIRequest({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enhancedRequestBody),
      correlationId,
    });

    const openAIRequestId = responseOpenAIRequestId;

    console.log('📥 OpenAI response status:', response.status);
    console.log('📋 OpenAI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    console.log('✅ Parsing OpenAI response...');
    const result = await response.json();
    console.log('📊 OpenAI response structure:', Object.keys(result));
    console.log('📋 OpenAI choices count:', result.choices?.length);
    
    const aiResponse = result.choices[0].message.content.trim();
    console.log('📝 AI response length:', aiResponse.length);
    console.log('📋 AI response preview:', aiResponse.substring(0, 200));

    try {
      console.log('🧹 Cleaning AI response...');
      const cleanJson = aiResponse.replace(/^```json\s*|\s*```$/g, '');
      console.log('📋 Clean JSON preview:', cleanJson.substring(0, 200));
      
      console.log('📊 Parsing cleaned JSON...');
      const processedData = JSON.parse(cleanJson);
      console.log('✅ JSON parsed successfully');
      console.log('📊 Processed data type:', typeof processedData);
      console.log('📋 Processed data keys:', Object.keys(processedData));
      
      // Track API usage with enhanced attribution if we have userId
      if (userId) {
        const usageData = extractUsageFromOpenAIResponse(result);
        await trackOpenAIUsage({
          userId,
          functionName: 'process-theme-json',
          model: 'gpt-5-mini',
          requestType: 'text_generation',
          success: true,
          estimatedCost: usageData.estimatedCost,
          tokensUsed: usageData.totalTokens || 0,
          promptTokens: usageData.promptTokens || 0,
          completionTokens: usageData.completionTokens || 0,
          responseTimeMs: responseTime,
          metadata: requestMetadata,
          correlationId,
          openAIRequestId,
        });
      }
      
      return processedData;
    } catch (parseError) {
      console.error('💥 Failed to parse AI response:', parseError);
      console.error('📋 Raw AI response:', aiResponse);
      throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error('💥 OpenAI API call failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

function validateThemeFields(data: any, fixes: string[], warnings: string[], errors: string[]): any {
  const validated: any = { ...data };

  // Category optional: default to 'general', enforce length ≤100
  if (validated.category === undefined || validated.category === null || String(validated.category).trim().length === 0) {
    validated.category = 'general';
    fixes.push("Set default category to 'general'");
  } else if (typeof validated.category !== 'string') {
    validated.category = String(validated.category);
    warnings.push('Coerced category to string');
  }
  if (validated.category.length > 100) {
    validated.category = validated.category.slice(0, 100);
    fixes.push('Truncated category to 100 characters');
  }

  // Theme required with max length 200
  if (!validated.theme || typeof validated.theme !== 'string' || validated.theme.trim().length === 0) {
    errors.push('Theme is required and must be a non-empty string');
  } else if (validated.theme.length > 200) {
    validated.theme = validated.theme.slice(0, 200);
    fixes.push('Truncated theme to 200 characters');
  }

  // theme_description optional, max 1000
  if (validated.theme_description != null) {
    validated.theme_description = String(validated.theme_description);
    if (validated.theme_description.length > 1000) {
      validated.theme_description = validated.theme_description.slice(0, 1000);
      fixes.push('Truncated theme_description to 1000 characters');
    }
  }

  if (!Array.isArray(validated.posts)) {
    errors.push('Posts must be an array');
    return validated;
  }
  if (validated.posts.length === 0) {
    errors.push('At least one post is required');
    return validated;
  }
  if (validated.posts.length > 100) {
    validated.posts = validated.posts.slice(0, 100);
    warnings.push('Limited posts to maximum of 100');
  }

  // Validate each post
  validated.posts = validated.posts.map((post: any, index: number) => {
    const p: any = { ...post };

    // day 1-365
    const dayVal = p.day != null ? Number(p.day) : index + 1;
    if (!Number.isFinite(dayVal)) {
      p.day = index + 1;
      warnings.push(`Post ${index + 1}: invalid day, auto-set`);
    } else {
      const day = Math.round(dayVal);
      p.day = Math.max(1, Math.min(365, day));
      if (p.day !== dayVal) warnings.push(`Post ${index + 1}: day clamped to [1,365]`);
    }

    // title 1-500
    if (!p.title || typeof p.title !== 'string' || p.title.trim().length === 0) {
      errors.push(`Post ${index + 1}: Title is required`);
    } else if (p.title.length > 500) {
      p.title = p.title.slice(0, 500);
      fixes.push(`Post ${index + 1}: Truncated title to 500 characters`);
    }

    // story_description 1-2000 (map description if present)
    if (!p.story_description && typeof p.description === 'string') {
      p.story_description = p.description;
      fixes.push(`Post ${index + 1}: Mapped description -> story_description`);
    }
    if (!p.story_description || typeof p.story_description !== 'string' || p.story_description.trim().length === 0) {
      errors.push(`Post ${index + 1}: story_description is required`);
    } else if (p.story_description.length > 2000) {
      p.story_description = p.story_description.slice(0, 2000);
      fixes.push(`Post ${index + 1}: Truncated story_description to 2000 characters`);
    }

    // status default draft
    const status = String(p.status || 'draft').toLowerCase();
    p.status = (status === 'draft' || status === 'scheduled' || status === 'published') ? status : 'draft';
    if (p.status === 'draft' && status !== 'draft') {
      fixes.push(`Post ${index + 1}: Invalid status, set to draft`);
    }

    // Remove legacy field to keep output clean
    if ('description' in p) delete p.description;

    return p;
  });

  return validated;
}