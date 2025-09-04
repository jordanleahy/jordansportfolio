/**
 * EDGE FUNCTION: Generate Voiceover Script
 * 
 * PURPOSE:
 * Converts text content into teleprompter-style voiceover scripts optimized for voice recording.
 * Supports multiple tones (engaging, professional, casual) and generates scripts with estimated
 * duration, word counts, and voice delivery optimization for content creators.
 * 
 * INPUTS:
 * - source_text: string - Original text content to transform
 * - content_type: string (optional) - Type of content for context
 * - tone: string (default: 'engaging') - Delivery tone for script style
 * - style: string (default: 'teleprompter') - Script formatting style
 * 
 * OUTPUTS:
 * - Success: { script: string, word_count: number, estimated_duration_seconds: number, tone: string, style: string, correlationId: string, usage: object }
 * - Error: { error: string }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-4o for high-quality script generation)
 * - Supabase Database (openai_agents, system_prompts tables)
 * - OpenAI Attribution System (usage tracking and cost calculation)
 * 
 * USAGE:
 * Called from: Video production workflows, podcast preparation, content creator tools
 * Authentication: Optional - enhanced features and tracking available for authenticated users
 * 
 * FLOW:
 * 1. Validate source text and retrieve Voiceover Script Generator agent
 * 2. Get tone-specific system prompt or fallback to available prompts
 * 3. Transform content using OpenAI with teleprompter optimization
 * 4. Calculate word count and estimated reading duration (150 WPM)
 * 5. Track API usage and costs for monitoring
 * 6. Return optimized script with delivery metrics
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { trackOpenAIUsage, generateCorrelationId, makeOpenAIRequest, enhanceOpenAIRequestBody, extractUsageFromOpenAIResponse } from '../_shared/openai-attribution.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    const { content_type, source_text, tone = 'engaging', style = 'teleprompter' } = await req.json();
    
    requestMetadata = { content_type, tone, style, textLength: source_text?.length, correlationId };
    
    console.log('Generate voiceover script request:', { content_type, tone, style, textLength: source_text?.length, correlationId });

    if (!source_text) {
      throw new Error('source_text is required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Get the Voiceover Script Generator agent
    const { data: agent, error: agentError } = await supabase
      .from('openai_agents')
      .select('id')
      .eq('name', 'Voiceover Script Generator')
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      throw new Error('Voiceover Script Generator agent not found');
    }

    // Get the system prompt for the tone from the system_prompts table
    // First try to get the specific tone, then fall back to any available prompt
    let { data: systemPromptData, error: promptError } = await supabase
      .from('theme_system_prompts_to_create_image_prompt_via_visual_prompt_agent')
      .select('prompt_text, name')
      .eq('agent_id', agent.id)
      .eq('name', tone)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    let selectedPrompt = systemPromptData;
    
    if (promptError || !selectedPrompt) {
      console.log('Specific tone not found, trying fallback. Requested tone:', tone);
      // Try to get any available prompt as fallback
      const { data: fallbackData } = await supabase
        .from('theme_system_prompts_to_create_image_prompt_via_visual_prompt_agent')
        .select('prompt_text, name')
        .eq('agent_id', agent.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (fallbackData) {
        console.log('Using fallback prompt:', fallbackData.name, 'instead of:', tone);
        selectedPrompt = fallbackData;
      } else {
        throw new Error(`No system prompts available. Agent may not be properly configured.`);
      }
    }

    console.log('Using system prompt for tone:', selectedPrompt.name);

    // Prepare the user prompt
    const userPrompt = `Content Type: ${content_type}
Style: ${style}
Source Text: ${source_text}

Please transform this content into a teleprompter-style voiceover script optimized for ${tone} delivery.`;

    // Enhanced OpenAI request with correlation tracking
    const requestBody = enhanceOpenAIRequestBody({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: selectedPrompt.prompt_text },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 2000,
    }, correlationId);

    const { response: openaiResponse, openAIRequestId: responseOpenAIRequestId, responseTime } = await makeOpenAIRequest({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      correlationId,
    });

    openAIRequestId = responseOpenAIRequestId;

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedScript = openaiData.choices[0].message.content;

    // Extract usage data for cost calculation
    const usageData = extractUsageFromOpenAIResponse(openaiData);
    promptTokens = usageData.promptTokens || 0;
    completionTokens = usageData.completionTokens || 0;
    tokensUsed = usageData.totalTokens || 0;
    estimatedCost = usageData.estimatedCost;

    success = true;

    console.log('Generated script length:', generatedScript.length);

    // Calculate word count and estimated duration
    const wordCount = generatedScript.split(/\s+/).length;
    const estimatedDurationSeconds = Math.round(wordCount / 150 * 60); // Assuming 150 words per minute

    // Track API usage with enhanced attribution if we have userId
    if (userId) {
      const responseTime = Date.now() - startTime;
      await trackOpenAIUsage({
        userId,
        functionName: 'generate-voiceover-script',
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

    const result = {
      script: generatedScript,
      word_count: wordCount,
      estimated_duration_seconds: estimatedDurationSeconds,
      tone,
      style,
      correlationId,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: tokensUsed,
        estimated_cost: estimatedCost
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-voiceover-script function:', error);
    errorMessage = error.message || 'An unexpected error occurred';
    
    // Track failed API usage with enhanced attribution if we have userId
    if (userId) {
      try {
        const responseTime = Date.now() - startTime;
        await trackOpenAIUsage({
          userId,
          functionName: 'generate-voiceover-script',
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

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});