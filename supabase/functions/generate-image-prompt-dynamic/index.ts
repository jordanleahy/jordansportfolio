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

    // Fetch the Blog Visual Prompt Generator agent
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: agent, error: agentError } = await supabase
      .from('openai_agents')
      .select('system_prompts, supported_categories')
      .eq('name', 'Blog Visual Prompt Generator')
      .eq('status', 'active')
      .single();

    if (agentError || !agent) {
      throw new Error('Blog Visual Prompt Generator agent not found or inactive');
    }

    // Find the appropriate system prompt for the category
    const systemPrompts = agent.system_prompts as any[];
    const categoryPrompt = systemPrompts?.find((prompt: any) => prompt.category === category);

    if (!categoryPrompt) {
      throw new Error(`No system prompt found for category: ${category}. Supported categories: ${agent.supported_categories?.join(', ')}`);
    }

    // Create the user message
    const userMessage = `Generate a detailed image prompt based on this content:

Title: ${title}
Description: ${description}
Category: ${category}

Please create a professional, engaging image prompt that captures the essence of this content and follows the style guidelines for ${category} visuals.`;

    // Call OpenAI API with the dynamic system prompt
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
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const generatedPrompt = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      generatedPrompt,
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