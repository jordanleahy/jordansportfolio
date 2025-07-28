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

    // Create the user message for the agent
    const userMessage = `Generate a detailed image prompt based on this content:

Title: ${title}
Description: ${description}
Category: ${category}

Please create a professional, engaging image prompt that captures the essence of this content and follows the style guidelines for ${category} visuals.`;

    // Call the generate-content function with the correct parameters
    const { data: response, error: contentError } = await supabase.functions.invoke('generate-content', {
      body: {
        prompt: userMessage,
        type: 'image_prompt'
      }
    });

    if (contentError) {
      throw new Error(`Content generation error: ${contentError.message}`);
    }

    if (!response?.generatedText) {
      throw new Error('No generated text received from content function');
    }

    return new Response(JSON.stringify({ 
      generatedPrompt: response.generatedText,
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