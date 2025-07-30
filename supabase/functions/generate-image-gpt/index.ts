import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { prompt, aspectRatio = "1:1" } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Map aspect ratios to GPT-Image-1 sizes
    const sizeMap: Record<string, string> = {
      '16:9': '1536x1024',
      '9:16': '1024x1536', 
      '3:4': '1024x1536',
      '4:3': '1536x1024',
      '1:1': '1024x1024'
    };

    const size = sizeMap[aspectRatio] || '1024x1024';

    console.log('🎨 IMAGE_GENERATION: Starting with prompt:', prompt.substring(0, 100) + '...');
    console.log('🎨 IMAGE_GENERATION: Aspect ratio:', aspectRatio, 'Size:', size);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        size: size,
        quality: 'high',
        output_format: 'png',
        n: 1
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('🎨 IMAGE_GENERATION: OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate image', details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      console.error('🎨 IMAGE_GENERATION: Unexpected response format:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid response from image generation API' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const base64Image = data.data[0].b64_json;
    
    console.log('🎨 IMAGE_GENERATION: Successfully generated image');
    
    return new Response(
      JSON.stringify({ 
        image: base64Image,
        aspectRatio: aspectRatio,
        size: size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('🎨 IMAGE_GENERATION: Error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});