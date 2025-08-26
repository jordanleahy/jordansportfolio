import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface TriageRequest {
  input: string;
  context?: string;
}

interface TriageResponse {
  primary_route: 'vendor_analysis' | 'theme_structuring' | 'book_research';
  confidence: number;
  reasoning: string;
  secondary_route?: string | null;
  input_classification: {
    contains_company_names: boolean;
    contains_theme_data: boolean;
    is_research_request: boolean;
    is_content_creation: boolean;
    is_book_research: boolean;
  };
  suggested_preprocessing?: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Input triage request received');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { input, context }: TriageRequest = await req.json();

    if (!input || typeof input !== 'string') {
      throw new Error('Input is required and must be a string');
    }

    console.log('Processing input:', input.substring(0, 100) + '...');

    // Get JWT from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    console.log('User authenticated:', user.id);

    // Get the triage agent's system prompt by finding the agent first
    const { data: triageAgent, error: agentError } = await supabase
      .from('openai_agents')
      .select('id')
      .eq('name', 'Triage Orchestra Agent')
      .eq('user_id', user.id)
      .single();

    if (agentError || !triageAgent) {
      console.error('Triage agent not found:', agentError);
      throw new Error('Triage Orchestra Agent not found. Please ensure the agent is properly configured.');
    }

    const { data: systemPrompt, error: promptError } = await supabase
      .from('system_prompts')
      .select('id, prompt_text, agent_name, theme_id')
      .eq('agent_id', triageAgent.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (promptError || !systemPrompt) {
      console.error('System prompt error:', promptError);
      throw new Error('Triage system prompt not found. Please ensure the Triage Orchestra Agent is properly configured.');
    }

    console.log('System prompt retrieved successfully');

    // Prepare the context message
    const contextMessage = context ? `\n\nAdditional Context: ${context}` : '';
    const userMessage = `${input}${contextMessage}`;

    // Call OpenAI for triage analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt.prompt_text },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const triageResult = data.choices[0].message.content;

    console.log('OpenAI response received');

    // Parse the JSON response
    let parsedResult: TriageResponse;
    try {
      parsedResult = JSON.parse(triageResult);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', triageResult);
      // Fallback to theme structuring if parsing fails
      parsedResult = {
        primary_route: 'theme_structuring',
        confidence: 0.3,
        reasoning: 'Failed to parse routing decision, defaulting to theme structuring',
        secondary_route: null,
        input_classification: {
          contains_company_names: false,
          contains_theme_data: false,
          is_research_request: false,
          is_content_creation: true,
          is_book_research: false
        },
        suggested_preprocessing: null
      };
    }

    // Validate the response structure
    if (!parsedResult.primary_route || !['vendor_analysis', 'theme_structuring', 'book_research'].includes(parsedResult.primary_route)) {
      console.warn('Invalid primary_route, defaulting to theme_structuring');
      parsedResult.primary_route = 'theme_structuring';
      parsedResult.confidence = Math.min(parsedResult.confidence || 0.3, 0.3);
    }

    // Ensure confidence is between 0 and 1
    parsedResult.confidence = Math.max(0, Math.min(1, parsedResult.confidence || 0.5));

    console.log('Triage analysis completed:', {
      route: parsedResult.primary_route,
      confidence: parsedResult.confidence,
      reasoning: parsedResult.reasoning?.substring(0, 100) + '...'
    });

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in input-triage function:', error);
    
    // Return fallback response for any errors
    const fallbackResponse: TriageResponse = {
      primary_route: 'theme_structuring',
      confidence: 0.2,
      reasoning: `Error occurred during triage: ${error.message}. Defaulting to theme structuring.`,
      secondary_route: null,
      input_classification: {
        contains_company_names: false,
        contains_theme_data: false,
        is_research_request: false,
        is_content_creation: true,
        is_book_research: false
      },
      suggested_preprocessing: null
    };

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200, // Return 200 with fallback rather than error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});