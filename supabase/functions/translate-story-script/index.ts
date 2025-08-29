/**
 * EDGE FUNCTION: Translate Story Script
 * 
 * PURPOSE:
 * Translates story scripts to target languages while preserving narrative flow, emotional tone,
 * and voice delivery cues. Supports children's stories and professional narratives with 
 * language-specific cultural adaptation and storytelling optimization.
 * 
 * INPUTS:
 * - script_text: string - Original story script to translate
 * - target_language: string - Target language ('german', 'spanish', 'chinese', 'swedish')
 * - story_type: string (optional) - Story context ('childrens_story' | 'convincing_story')
 * 
 * OUTPUTS:
 * - Success: { translated_script: string, target_language: string, word_count: number, correlationId: string, usage: object }
 * - Error: { error: string }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-5 for high-quality translation)
 * - OpenAI Attribution System (usage tracking and cost calculation)
 * 
 * USAGE:
 * Called from: Multi-language content workflows, global story distribution, localization pipelines
 * Authentication: Optional - enhanced tracking available for authenticated users
 * 
 * IMPORTANT: OpenAI API Guidelines for this function
 * 
 * ✅ REQUIRED MODELS: Use GPT-5 family only
 * - gpt-5-2025-08-07 (flagship)
 * - gpt-5-mini-2025-08-07 (faster)  
 * - gpt-5-nano-2025-08-07 (fastest)
 * 
 * ❌ NEVER USE: GPT-4 models (gpt-4, gpt-4o, gpt-4.1, etc.)
 * ❌ NEVER USE: temperature parameter (not supported in GPT-5)
 * ❌ NEVER USE: max_tokens parameter (use max_completion_tokens instead)
 * 
 * FLOW:
 * 1. Validate script text and target language requirements
 * 2. Apply language-specific translation instructions and cultural context
 * 3. Preserve story type context (children's warmth vs professional authority)
 * 4. Translate using OpenAI while maintaining voice delivery cues and formatting
 * 5. Track API usage and costs for monitoring
 * 6. Return translated script with preserved structure and estimated word count
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { trackOpenAIUsage, generateCorrelationId, makeOpenAIRequest, enhanceOpenAIRequestBody, extractUsageFromOpenAIResponse } from '../_shared/openai-attribution.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Translate story script function started');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
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
    const { script_text, target_language, story_type } = await req.json();
    
    requestMetadata = { script_length: script_text?.length || 0, target_language, story_type, correlationId };
    
    console.log('Request data:', {
      script_length: script_text?.length || 0,
      target_language,
      story_type,
      correlationId
    });

    if (!script_text) {
      return new Response(
        JSON.stringify({ error: 'Script text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!target_language) {
      return new Response(
        JSON.stringify({ error: 'Target language is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Language-specific instructions
    const languageInstructions = {
      'german': 'Translate to German (Deutsch). Maintain the storytelling flow and emotional tone.',
      'spanish': 'Translate to Spanish (Español). Preserve the narrative style and cultural sensitivity.',
      'chinese': 'Translate to Simplified Chinese (中文). Keep the storytelling essence and appropriate tone.',
      'swedish': 'Translate to Swedish (Svenska). Maintain the narrative flow and emotional resonance.'
    };

    const storyTypeContext = story_type === 'childrens_story' 
      ? 'This is a children\'s story script - maintain warmth, wonder, and age-appropriate language.'
      : 'This is a professional narrative script - preserve authority, credibility, and persuasive elements.';

    const systemPrompt = `You are an expert translator specializing in storytelling and narrative content. Your task is to translate story scripts while preserving their emotional impact, narrative flow, and intended audience engagement.

Key Requirements:
- ${languageInstructions[target_language] || 'Translate accurately while maintaining storytelling quality'}
- ${storyTypeContext}
- Preserve formatting, including [PAUSE], [EMPHASIS], and other voice delivery cues
- Maintain the same narrative structure and pacing
- Keep cultural references appropriate for the target audience
- Ensure the translation flows naturally when read aloud
- Preserve the word count and reading time as closely as possible

Return only the translated script, maintaining all original formatting and structure.`;

    const userPrompt = `Please translate the following story script:

${script_text}`;

    console.log('Sending request to OpenAI...');

    // Enhanced OpenAI request with correlation tracking
    const requestBody = enhanceOpenAIRequestBody({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_completion_tokens: 3000,
    }, correlationId);

    const { response, openAIRequestId: responseOpenAIRequestId, responseTime } = await makeOpenAIRequest({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      correlationId,
    });

    openAIRequestId = responseOpenAIRequestId;

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Translation service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const translatedScript = data.choices[0].message.content;

    // Extract usage data for cost calculation
    const usageData = extractUsageFromOpenAIResponse(data);
    promptTokens = usageData.promptTokens || 0;
    completionTokens = usageData.completionTokens || 0;
    tokensUsed = usageData.totalTokens || 0;
    estimatedCost = usageData.estimatedCost;

    success = true;

    console.log(`Translation completed, length: ${translatedScript.length}`);

    // Track API usage with enhanced attribution if we have userId
    if (userId) {
      const responseTime = Date.now() - startTime;
      await trackOpenAIUsage({
        userId,
        functionName: 'translate-story-script',
        model: 'gpt-5-mini',
        requestType: 'text_generation',
        success,
        estimatedCost,
        tokensUsed,
        promptTokens,
        completionTokens,
        responseTimeMs: responseTime,
        metadata: requestMetadata,
        correlationId,
        openAIRequestId,
      });
    }

    return new Response(JSON.stringify({ 
      translated_script: translatedScript,
      target_language,
      word_count: translatedScript.split(' ').length,
      correlationId,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: tokensUsed,
        estimated_cost: estimatedCost
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in translate story script function:', error);
    errorMessage = error.message || 'Internal server error';
    
    // Track failed API usage with enhanced attribution if we have userId
    if (userId) {
      try {
        const responseTime = Date.now() - startTime;
        await trackOpenAIUsage({
          userId,
          functionName: 'translate-story-script',
          model: 'gpt-5-mini',
          requestType: 'text_generation',
          success: false,
          estimatedCost: 0,
          tokensUsed: 0,
          promptTokens: 0,
          completionTokens: 0,
          responseTimeMs: responseTime,
          errorMessage,
          metadata: requestMetadata,
          correlationId,
          openAIRequestId,
        });
      } catch (trackingError) {
        console.error('Failed to track error usage:', trackingError);
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});