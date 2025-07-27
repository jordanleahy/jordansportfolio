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

    const { title, description, category, aspectRatio } = await req.json();

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
    let categoryPrompt = systemPrompts?.find((prompt: any) => prompt.category === category);
    
    // If no specific category prompt found, use the default one
    if (!categoryPrompt) {
      categoryPrompt = systemPrompts?.find((prompt: any) => prompt.category === 'default');
    }

    if (!categoryPrompt) {
      throw new Error(`No system prompt found for category: ${category}. Agent has prompts for: ${systemPrompts?.map((p: any) => p.category).join(', ')}`);
    }

    // Format aspect ratio instruction
    const aspectRatioText = aspectRatio ? ` The image should be in ${aspectRatio} aspect ratio.` : '';

    // Create the user message with content analysis focus
    const userMessage = `Analyze this blog content and create a unique, tailored image prompt:

CONTENT TO ANALYZE:
Title: "${title}"
Description: "${description}"
Category: ${category}

REQUIREMENTS:
- Create a completely unique visual concept based on the specific content above
- Adapt the style and elements to match the themes in the title and description
- Generate a clean, professional image prompt without any meta-text or formatting
- Focus purely on visual elements that represent the content's key concepts${aspectRatioText}

Generate a detailed image prompt that captures the essence of this specific content:`;

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
      agent: 'Blog Visual Prompt Generator',
      systemPrompt: categoryPrompt.prompt
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