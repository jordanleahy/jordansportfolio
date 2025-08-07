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
      .select('system_prompts, supported_categories')
      .eq('name', 'Voiceover Script Generator')
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      throw new Error('Voiceover Script Generator agent not found');
    }

    // Find the appropriate system prompt based on tone
    const systemPrompts = agent.system_prompts as Array<{category: string, prompt: string}>;
    console.log('Available system prompts:', systemPrompts?.map(p => p.category));
    
    let selectedPrompt = systemPrompts?.find(p => p.category === tone);
    
    if (!selectedPrompt) {
      console.error('Tone not supported:', tone, 'Available categories:', agent.supported_categories);
      // Try to use first available prompt as fallback
      const fallbackPrompt = systemPrompts?.[0];
      if (fallbackPrompt) {
        console.log('Using fallback prompt:', fallbackPrompt.category, 'instead of:', tone);
        selectedPrompt = fallbackPrompt;
      } else {
        throw new Error(`No system prompts available. Agent may not be properly configured.`);
      }
    }

    console.log('Using system prompt for tone:', selectedPrompt.category);

    // Prepare the user prompt
    const userPrompt = `Content Type: ${content_type}
Style: ${style}
Source Text: ${source_text}

Please transform this content into a teleprompter-style voiceover script optimized for ${tone} delivery.`;

    // Enhanced OpenAI request with correlation tracking
    const requestBody = enhanceOpenAIRequestBody({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: selectedPrompt.prompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
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
        model: 'gpt-4o',
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
          model: 'gpt-4o',
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