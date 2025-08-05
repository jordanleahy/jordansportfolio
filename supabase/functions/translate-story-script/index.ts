import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Translate story script function started');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { script_text, target_language, story_type } = await req.json();
    
    console.log('Request data:', {
      script_length: script_text?.length || 0,
      target_language,
      story_type
    });

    if (!script_text) {
      return new Response(
        JSON.stringify({ error: 'Script text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!target_language) {
      return new Response(
        JSON.stringify({ error: 'Target language is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Language-specific instructions
    const languageInstructions = {
      'german': 'Translate to German (Deutsch). Maintain the storytelling flow and emotional tone.',
      'spanish': 'Translate to Spanish (Español). Preserve the narrative style and cultural sensitivity.',
      'chinese': 'Translate to Simplified Chinese (中文). Keep the storytelling essence and appropriate tone.',
      'swedish': 'Translate to Swedish (Svenska). Maintain the narrative flow and emotional resonance.'
    };

    const storyTypeContext = story_type === 'childrens_story' 
      ? 'This is a children\'s story script - maintain warmth, wonder, and age-appropriate language.'
      : 'This is a professional narrative script - preserve authority, credibility, and persuasive elements.';

    const systemPrompt = `You are an expert translator specializing in storytelling and narrative content. Your task is to translate story scripts while preserving their emotional impact, narrative flow, and intended audience engagement.

Key Requirements:
- ${languageInstructions[target_language] || 'Translate accurately while maintaining storytelling quality'}
- ${storyTypeContext}
- Preserve formatting, including [PAUSE], [EMPHASIS], and other voice delivery cues
- Maintain the same narrative structure and pacing
- Keep cultural references appropriate for the target audience
- Ensure the translation flows naturally when read aloud
- Preserve the word count and reading time as closely as possible

Return only the translated script, maintaining all original formatting and structure.`;

    const userPrompt = `Please translate the following story script:

${script_text}`;

    console.log('Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Translation service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const translatedScript = data.choices[0].message.content;

    console.log(`Translation completed, length: ${translatedScript.length}`);

    return new Response(JSON.stringify({ 
      translated_script: translatedScript,
      target_language,
      word_count: translatedScript.split(' ').length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in translate story script function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});