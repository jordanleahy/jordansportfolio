import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UNIVERSAL_SYSTEM_PROMPT = `You are an expert at creating detailed, professional image generation prompts for AI image generators.

Your task is to analyze the provided content and create a vector-style illustration prompt that:

VISUAL STYLE (ALWAYS INCLUDE):
- Vector illustration style
- Clean, modern, professional design
- Flat design with subtle gradients
- Professional color palette (blues, greens, grays, whites)
- High contrast and clear visual hierarchy
- Minimalist approach with meaningful visual elements

CONTENT ANALYSIS:
- Read the title and description carefully
- Identify the main topic/theme (healthcare, business, technology, etc.)
- Extract key concepts and metaphors
- Determine the appropriate mood (professional, innovative, trustworthy, etc.)

VISUAL ELEMENTS SELECTION:
- Choose 2-3 relevant visual elements that represent the content
- Include appropriate icons, symbols, or metaphors
- For healthcare: medical charts, stethoscopes, healthcare technology, patient care
- For business: documents, handshakes, charts, professional settings
- For technology: digital interfaces, networks, data visualization
- For contracts/legal: documents, signatures, compliance symbols
- For general topics: abstract shapes that convey the concept

COMPOSITION:
- Clean background with subtle textures or gradients
- Balanced composition with clear focal points
- Professional typography elements if text is included
- Ensure the design works well at different sizes

Always specify the aspect ratio and ensure the prompt will generate appropriate, professional visuals that enhance the content without being too literal or cluttered.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { title, description, aspectRatio } = await req.json();

    if (!title || !description) {
      throw new Error('Missing required fields: title and description are required');
    }

    // Format aspect ratio instruction
    const aspectRatioText = aspectRatio ? ` The image should be in ${aspectRatio} aspect ratio.` : '';

    // Create the user message with content analysis focus
    const userMessage = `Analyze this content and create a unique, tailored vector illustration prompt:

CONTENT TO ANALYZE:
Title: "${title}"
Description: "${description}"

REQUIREMENTS:
- Create a professional vector illustration that represents the content's core concepts
- Use visual metaphors and elements that enhance understanding of the topic
- Maintain clean, modern design principles
- Generate a detailed image prompt without any meta-text or formatting
- Focus on visual elements that represent the content's key themes${aspectRatioText}

Generate a detailed vector illustration prompt:`;

    // Call OpenAI API with the universal system prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: UNIVERSAL_SYSTEM_PROMPT },
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
      type: 'simplified',
      systemPrompt: 'Universal Vector Illustration Generator'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-image-prompt-simplified function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});