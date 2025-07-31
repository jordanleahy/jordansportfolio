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
    const { prompt, type = 'general' } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Initialize Supabase client for prompt storage
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    console.log(`Generating content for type: ${type}`);

    let systemContent;
    let finalPrompt = prompt;

    if (type === 'image_prompt') {
      systemContent = 'You are an expert at creating detailed, professional image generation prompts for AI image generators. Focus on creating clear, specific prompts that will generate high-quality, professional visuals.';
    } else {
      systemContent = 'You are a helpful assistant that generates high-quality content based on user prompts.';
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: finalPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const generatedText = data.choices[0].message.content;

    // Store the generated content in cached_prompts table (for image prompts and important content)
    if (userId && (type === 'image_prompt' || type === 'important')) {
      try {
        const promptHash = Buffer.from(prompt).toString('base64').slice(0, 20);
        const cacheKey = `content_${type}_${promptHash}`;
        
        await supabase.from('cached_prompts').insert({
          user_id: userId,
          cache_key: cacheKey,
          category: type,
          prompt_text: generatedText,
          metadata: {
            original_prompt: prompt,
            content_type: type,
            agent: 'General Content Generator',
            model: 'gpt-4o-mini',
            generated_at: new Date().toISOString()
          },
          hit_count: 1,
          version: 1,
          expires_at: null
        });
        console.log('✅ Generated content stored in cache successfully');
      } catch (cacheError) {
        console.error('❌ Failed to store generated content in cache:', cacheError);
        // Don't fail the request if caching fails
      }
    }

    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate content. Please check your request and try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});