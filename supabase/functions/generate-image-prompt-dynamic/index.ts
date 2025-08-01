import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to track API usage
async function trackApiUsage(
  supabase: any,
  userId: string,
  functionName: string,
  modelUsed: string,
  requestType: string,
  success: boolean,
  estimatedCost: number,
  tokensUsed?: number,
  promptTokens?: number,
  completionTokens?: number,
  responseTimeMs?: number,
  errorMessage?: string,
  metadata?: any
) {
  try {
    await supabase.from('api_usage_tracking').insert({
      user_id: userId,
      function_name: functionName,
      model_used: modelUsed,
      request_type: requestType,
      tokens_used: tokensUsed,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: tokensUsed,
      estimated_cost: estimatedCost,
      success,
      error_message: errorMessage,
      request_metadata: metadata || {},
      response_time_ms: responseTimeMs,
    });
    console.log('✅ API usage tracked successfully');
  } catch (error) {
    console.error('❌ Failed to track API usage:', error);
  }
}

// Helper function to calculate cost for text generation
function calculateTextGenerationCost(promptTokens: number, completionTokens: number): number {
  const inputCost = promptTokens * (0.000150 / 1000); // $0.000150 per 1K input tokens
  const outputCost = completionTokens * (0.000600 / 1000); // $0.000600 per 1K output tokens
  return inputCost + outputCost;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let success = false;
  let estimatedCost = 0;
  let tokensUsed = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let errorMessage: string | undefined;
  let requestMetadata: any = {};

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { title, description, category, colorTheme } = await req.json();

    if (!title || !description || !category) {
      throw new Error('Missing required fields: title, description, and category are required');
    }

    // Store request metadata
    requestMetadata = { category, title, description, colorTheme };

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

    console.log('🚀 Generating image prompt for:', { category, title, userId: userId?.slice(0, 8) });

    // Get agent and find category prompt
    const { data: agentData, error: agentError } = await supabase
      .from('openai_agents')
      .select('system_prompts, supported_categories')
      .eq('name', 'Visual Prompt Generator')
      .single();

    if (agentError) {
      throw new Error(`Agent not found: ${agentError.message}`);
    }

    // Find category prompt, fallback to healthcare for unsupported categories
    let categoryPrompt = agentData.system_prompts?.find((prompt: any) => prompt.category === category);
    
    if (!categoryPrompt) {
      // Fallback to healthcare prompt for unsupported categories like "appeals"
      categoryPrompt = agentData.system_prompts?.find((prompt: any) => prompt.category === 'healthcare');
      
      if (!categoryPrompt) {
        throw new Error(`Category '${category}' not supported and no healthcare fallback found. Available: ${agentData.supported_categories?.join(', ')}`);
      }
    }

    // Build user message with color theme information
    let userMessage = `Generate an image prompt for:
Title: ${title}
Description: ${description}
Category: ${category}`;

    // Add color theme instructions if provided
    if (colorTheme) {
      userMessage += `

Color Theme Instructions:
- Primary Color: ${colorTheme.primary_color}
- Secondary Color: ${colorTheme.secondary_color}
- Accent Color: ${colorTheme.accent_color}
- Background Color: ${colorTheme.background_color}
- Text Color: ${colorTheme.text_color}
- Visual Style: ${colorTheme.visual_style}
- Color Instructions: ${colorTheme.color_instructions}

Please incorporate these colors and visual style into the image prompt to ensure brand consistency.`;
    }

    // Call OpenAI directly with the agent's system prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: categoryPrompt.prompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const openAIData = await response.json();
    const generatedText = openAIData.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No generated text received from OpenAI');
    }

    // Extract usage data for cost calculation
    const usage = openAIData.usage;
    if (usage) {
      promptTokens = usage.prompt_tokens;
      completionTokens = usage.completion_tokens;
      tokensUsed = usage.total_tokens;
      estimatedCost = calculateTextGenerationCost(promptTokens, completionTokens);
    }

    success = true;

    // Store the generated prompt in cached_prompts table
    if (userId) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(title + description);
        const hashArray = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const cacheKey = `image_prompt_${category}_${hashHex.slice(0, 20)}`;
        
        await supabase.from('cached_prompts').insert({
          user_id: userId,
          cache_key: cacheKey,
          category: category,
          prompt_text: generatedText,
          metadata: {
            title,
            description,
            agent: 'Visual Prompt Generator',
            model: 'gpt-4o-mini',
            generated_at: new Date().toISOString(),
            tokens_used: tokensUsed,
            estimated_cost: estimatedCost
          },
          hit_count: 1,
          version: 1,
          expires_at: null // No expiration for image prompts
        });
        console.log('✅ Prompt stored in cache successfully');
      } catch (cacheError) {
        console.error('❌ Failed to store prompt in cache:', cacheError);
        // Don't fail the request if caching fails
      }
    }

    console.log('✅ Prompt generated successfully');

    // Track API usage if we have userId
    if (userId) {
      const responseTime = Date.now() - startTime;
      await trackApiUsage(
        supabase,
        userId,
        'generate-image-prompt-dynamic',
        'gpt-4o-mini',
        'text_generation',
        success,
        estimatedCost,
        tokensUsed,
        promptTokens,
        completionTokens,
        responseTime,
        undefined,
        requestMetadata
      );
    }

    return new Response(JSON.stringify({ 
      generatedPrompt: generatedText,
      category,
      agent: 'Visual Prompt Generator',
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
    console.error('❌ Error in generate-image-prompt-dynamic function:', error);
    errorMessage = error.message || 'An unexpected error occurred';
    
    // Track failed API usage if we have userId
    if (userId) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const responseTime = Date.now() - startTime;
        await trackApiUsage(
          supabase,
          userId,
          'generate-image-prompt-dynamic',
          'gpt-4o-mini',
          'text_generation',
          false,
          0,
          0,
          0,
          0,
          responseTime,
          errorMessage,
          requestMetadata
        );
      } catch (trackingError) {
        console.error('Failed to track error usage:', trackingError);
      }
    }

    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});