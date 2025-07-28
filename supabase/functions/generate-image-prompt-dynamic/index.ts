import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { title, description, category } = await req.json();

    if (!title || !description || !category) {
      throw new Error('Missing required fields: title, description, and category are required');
    }

    // Initialize Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get agent and find category prompt
    const { data: agentData, error: agentError } = await supabase
      .from('openai_agents')
      .select('system_prompts, supported_categories')
      .eq('name', 'Blog Visual Prompt Generator')
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

    const userMessage = `Generate an image prompt for:
Title: ${title}
Description: ${description}
Category: ${category}`;

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

    return new Response(JSON.stringify({ 
      generatedPrompt: generatedText,
      category,
      agent: 'Blog Visual Prompt Generator'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-image-prompt-dynamic function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});