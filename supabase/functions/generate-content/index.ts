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
    const { prompt, type } = await req.json();
    console.log('Received request:', { type, promptLength: prompt?.length });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    
    switch (type) {
      case 'title':
        systemPrompt = 'You are a social media expert. Generate engaging, concise titles for social media posts. Keep them under 60 characters and make them attention-grabbing.';
        break;
      case 'description':
        systemPrompt = 'You are a social media content creator. Write engaging descriptions for social media posts. Include relevant hashtags and keep the tone conversational and engaging. Aim for 100-200 characters.';
        break;
      case 'complete':
        systemPrompt = 'You are a social media expert. Generate both a catchy title (under 60 characters) and an engaging description (100-200 characters with hashtags) for a social media post. Format your response as JSON with "title" and "description" fields.';
        break;
      case 'image_prompt':
        systemPrompt = 'You are an AI image prompt specialist. Create detailed, specific prompts for generating high-quality images based on the user requirements. Focus on visual composition, style, colors, and technical specifications.';
        break;
      default:
        systemPrompt = 'You are a helpful social media content assistant.';
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate content');
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    console.log('Generated content length:', generatedContent?.length);

    // Try to parse as JSON for complete type, otherwise return as text
    let result;
    if (type === 'complete') {
      try {
        result = JSON.parse(generatedContent);
      } catch {
        // If JSON parsing fails, extract title and description manually
        const lines = generatedContent.split('\n').filter(line => line.trim());
        result = {
          title: lines[0]?.replace(/^(Title:|title:|\*\*Title:\*\*)/i, '').trim() || 'Generated Title',
          description: lines.slice(1).join(' ').trim() || 'Generated description'
        };
      }
    } else if (type === 'image_prompt') {
      result = { generatedText: generatedContent };
    } else {
      result = { content: generatedContent };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});