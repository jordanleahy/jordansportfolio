import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded system prompt for street vision transformation
const STREET_VISION_SYSTEM_PROMPT = `## System Prompt (City Street Transformation for Public Space & Safety)

**Role & Scope**
You are an **urban design visualization model**. Your purpose is to take a real photo of any city street and create a photorealistic transformation that reimagines the *street and sidewalks only* into safer, more livable public spaces.

**Rules**

1. **Preserve Buildings & Context**
   * Keep all buildings, storefronts, signage, and background elements exactly as they appear in the uploaded photo.
   * Do not alter façades, windows, or skyline elements.

2. **Editable Zones**
   * Only the **street, curbs, sidewalks, and immediate streetscape features** (cars, pavement, trees, street furniture, lighting) may be redesigned.
   * Transformations must respect the original proportions and perspective.

3. **User Intent (Public Space & Safe Streets)**
   * Always interpret user input with a focus on:
     * **Creating bike lanes** (protected, clearly separated).
     * **Expanding sidewalks** for pedestrians, families, and gathering spaces.
     * **Adding greenery, trees, and seating** to improve livability.
     * **Reducing car dominance** by limiting lanes or removing parking.
     * **Improving safety** for people walking, biking, and using public space.
   * User prompts may specify particular changes, but all transformations should align with the goal of making streets safer, greener, and more people-centered.

4. **Output Quality**
   * The rendering must be **photorealistic**, daylight quality, and visually consistent with the original city context.
   * Maintain the **authentic character of the neighborhood** (e.g., a New York street should look like New York, not a generic European plaza).

**Goal**
Enable anyone to upload a photo of a street, specify how they want it redesigned, and receive a **photorealistic visualization that transforms car-oriented streets into safer, people-focused public spaces with bike lanes, greenery, and walkable design.**`;

serve(async (req) => {
  console.log('Street Vision Agent called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!openAIApiKey) {
    console.error('OPENAI_API_KEY not found');
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imageData, userPrompt } = await req.json();

    if (!imageData || !userPrompt) {
      return new Response(JSON.stringify({ error: 'Missing imageData or userPrompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing street vision request with user prompt:', userPrompt);

    // Step 1: Analyze the street photo using GPT-5 Vision
    console.log('Analyzing street photo...');
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'You are a street and urban design analyst. Describe what you see in this street photo, focusing on current infrastructure, traffic patterns, safety concerns, and opportunities for improvement.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this street photo and identify current conditions, then suggest how to transform it based on this user request: "${userPrompt}"`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageData}`
                }
              }
            ]
          }
        ],
        max_completion_tokens: 1000,
      }),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Vision API error:', errorText);
      throw new Error(`Vision API error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    const analysis = visionData.choices[0].message.content;
    console.log('Street analysis completed');

    // Step 2: Generate transformation image using the system prompt + analysis + user input
    console.log('Generating street transformation...');
    const imagePrompt = `${STREET_VISION_SYSTEM_PROMPT}

**Current Street Analysis:**
${analysis}

**User Transformation Request:**
${userPrompt}

**Instructions:**
Create a photorealistic transformation of this street that implements the user's vision while following the urban design principles above. Focus on making the street safer, more walkable, and people-centered while preserving the existing buildings and neighborhood character.`;

    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: imagePrompt,
        size: '1024x1024',
        quality: 'high',
        n: 1,
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Image generation error:', errorText);
      throw new Error(`Image generation error: ${imageResponse.status}`);
    }

    const imageData_result = await imageResponse.json();
    
    // gpt-image-1 returns base64 data directly
    const transformedImageBase64 = imageData_result.data[0].b64_json;
    
    console.log('Street transformation completed successfully');

    return new Response(JSON.stringify({
      analysis,
      transformedImageBase64,
      originalPrompt: userPrompt,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in street-vision-agent:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process street transformation',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});