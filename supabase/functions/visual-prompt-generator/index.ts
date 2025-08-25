import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface VisualPromptRequest {
  category: string;
  context: string;
  theme: string;
  description: string;
  aspect_ratio?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎨 Starting visual prompt generation...');
    
    const { category, context, theme, description, aspect_ratio = '1:1' }: VisualPromptRequest = await req.json();
    
    if (!category || !context) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: category and context are required',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt = '';
    
    if (category === 'book_highlights_visual') {
      systemPrompt = `You are the Book Highlights Visual Style Agent. Your role is to create sophisticated visual prompts for book quotes and highlights that maintain consistency with professional, academic, and inspirational aesthetics.

Visual Style Guidelines:
- Professional typography-focused layouts
- Clean, modern design with plenty of white space
- Sophisticated color palettes (deep blues, warm grays, elegant golds)
- Inspirational but not overly decorative
- Focus on readability and impact
- Avoid cliché book imagery (no stacks of books, reading glasses, etc.)
- Use subtle textures, gradients, or geometric patterns as backgrounds
- Emphasize the wisdom and insights of the content

Create a detailed image generation prompt that will produce a visually appealing social media post or infographic featuring the book quote. Include specific details about:
- Layout and composition
- Typography style and hierarchy 
- Color scheme and mood
- Background elements
- Any symbolic or thematic visual elements related to the book's subject matter

Make it sophisticated and share-worthy for professional social media platforms.`;
    } else {
      // Default visual prompt agent for other categories
      systemPrompt = `You are a Visual Prompt Generator Agent. Create detailed, professional image generation prompts that will produce high-quality visual content suitable for social media and marketing materials.

Focus on:
- Clean, modern design aesthetics
- Professional color schemes
- Clear hierarchy and composition
- Brand-appropriate styling
- High visual impact and shareability`;
    }

    const promptRequest = `${systemPrompt}

Theme: ${theme}
Context: ${context}
Description: ${description}
Aspect Ratio: ${aspect_ratio}

Generate a detailed visual prompt that will create an engaging, professional image.`;

    console.log('🤖 Calling OpenAI for visual prompt generation...');
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are a professional visual prompt generator. Create detailed, specific prompts for image generation.' },
          { role: 'user', content: promptRequest }
        ],
        max_completion_tokens: 1000,
      }),
    });

    const openAIData = await openAIResponse.json();
    console.log('✅ OpenAI visual prompt generation completed');

    if (!openAIData.choices?.[0]?.message?.content) {
      throw new Error('No visual prompt generated from OpenAI');
    }

    const imagePrompt = openAIData.choices[0].message.content;

    return new Response(JSON.stringify({
      success: true,
      image_prompt: imagePrompt,
      category,
      theme,
      aspect_ratio
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in visual-prompt-generator:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});