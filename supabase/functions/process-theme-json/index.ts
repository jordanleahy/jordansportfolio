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
  "category": "string",
  "theme": "string", 
  "description": "string (optional)",
  "posts": [
    {
      "day": number,
      "title": "string",
      "description": "string",
      "status": "draft|scheduled|published"
    }
  ]
}

Rules:
- Fix JSON syntax errors
- Ensure all posts have title and description
- Generate sequential day numbers if missing
- Set status to "draft" if not provided
- Limit to 30 posts maximum
- Clean and improve content quality

Raw data:
${JSON.stringify(rawData, null, 2)}

Return only the cleaned JSON:`;

  console.log('🔗 Calling OpenAI API for theme processing...');
  console.log('📋 Prompt length:', prompt.length);

  try {
    const requestBody = {
      model: 'gpt-4o-mini',
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
      temperature: 0.1,
      max_tokens: 3000,
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
          model: 'gpt-4o-mini',
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
  const validated = { ...data };

  // Validate required fields
  if (!validated.category || typeof validated.category !== 'string') {
    errors.push('Category is required and must be a string');
  }

  if (!validated.theme || typeof validated.theme !== 'string') {
    errors.push('Theme is required and must be a string');
  }

  if (!Array.isArray(validated.posts)) {
    errors.push('Posts must be an array');
    return validated;
  }

  if (validated.posts.length === 0) {
    errors.push('At least one post is required');
    return validated;
  }

  if (validated.posts.length > 30) {
    validated.posts = validated.posts.slice(0, 30);
    warnings.push('Limited posts to maximum of 30');
  }

  // Validate each post
  validated.posts = validated.posts.map((post: any, index: number) => {
    const validatedPost = { ...post };

    // Ensure day number
    if (!validatedPost.day) {
      validatedPost.day = index + 1;
      fixes.push(`Generated day number ${index + 1} for post ${index + 1}`);
    }

    // Validate title
    if (!validatedPost.title || typeof validatedPost.title !== 'string') {
      errors.push(`Post ${index + 1}: Title is required`);
    }

    // Validate description
    if (!validatedPost.description || typeof validatedPost.description !== 'string') {
      errors.push(`Post ${index + 1}: Description is required`);
    }

    // Set default status
    if (!validatedPost.status || !['draft', 'scheduled', 'published'].includes(validatedPost.status)) {
      validatedPost.status = 'draft';
      fixes.push(`Set default status for post ${index + 1}`);
    }

    return validatedPost;
  });

  return validated;
}