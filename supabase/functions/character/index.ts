/**
 * IMPORTANT: OpenAI API Guidelines for this function
 * 
 * ✅ REQUIRED MODELS: Use GPT-5 family only
 * - gpt-5-2025-08-07 (flagship)
 * - gpt-5-mini-2025-08-07 (faster)  
 * - gpt-5-nano-2025-08-07 (fastest)
 * 
 * ❌ NEVER USE: GPT-4 models (gpt-4, gpt-4o, gpt-4.1, etc.)
 * ❌ NEVER USE: temperature parameter (not supported in GPT-5)
 * ❌ NEVER USE: max_tokens parameter (use max_completion_tokens instead)
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { image, prompt, characterType = 'pixar', seed } = await req.json();

    if (!image || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: image and prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎭 Starting character creation process...');
    console.log('📝 User prompt:', prompt);
    console.log('🎨 Character type:', characterType);
    console.log('🌱 Seed:', seed);

    // Generate a unique seed if not provided
    const characterSeed = seed || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // First, analyze the person in the image to extract key features
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing people in photos to extract their core physical characteristics for character creation. Focus ONLY on permanent facial features and ignore clothing, backgrounds, and accessories.

Analyze this person and extract:
1. Age group (child/teen/adult)
2. Face shape (oval/round/square/heart)
3. Eye color and shape
4. Hair color and style
5. Skin tone
6. Notable facial features
7. Expression/personality traits visible

Ignore: clothing, accessories, background, seasonal context.

Respond with a brief, focused description of the person's permanent characteristics.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this person and describe their key physical characteristics for character creation:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_completion_tokens: 300
      }),
    });

    if (!analysisResponse.ok) {
      const error = await analysisResponse.text();
      console.error('❌ Analysis API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysisData = await analysisResponse.json();
    const characterDescription = analysisData.choices[0].message.content;
    
    console.log('✅ Character analysis completed:', characterDescription);

    // Create style-specific prompt based on character type
    let stylePrompt = '';
    
    if (characterType === 'pixar') {
      stylePrompt = `Pixar 3D animated character: ${characterDescription}, ${prompt}. Large expressive eyes (1.5x normal size), soft rounded facial features, warm studio lighting, high-quality 3D render in Disney Pixar movie animation style, vibrant colors, child-friendly appearance, professional animation quality, detailed textures, glossy finish typical of Pixar films.`;
    } else if (characterType === 'vector') {
      stylePrompt = `Vector illustration character: ${characterDescription}, ${prompt}. Clean geometric lines, bold solid colors, minimalist design, flat illustration style, modern vector art aesthetic, smooth gradients, digital art style, professional vector illustration, scalable design.`;
    } else if (characterType === 'realistic') {
      stylePrompt = `Realistic digital art character: ${characterDescription}, ${prompt}. Photorealistic rendering, natural lighting, detailed textures, high-resolution digital painting, professional portrait quality, realistic proportions and features.`;
    }

    console.log('🎨 Generated style prompt:', stylePrompt.substring(0, 200) + '...');

    // Generate the character image
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: stylePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        output_format: 'png'
      }),
    });

    if (!imageResponse.ok) {
      const error = await imageResponse.text();
      console.error('❌ Image generation error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate character image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageData = await imageResponse.json();
    console.log('✅ Character image generated successfully');

    // Create image hash for duplicate detection
    const imageHash = btoa(image).slice(0, 32);

    // Check if character already exists
    const { data: existingCharacter } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id)
      .eq('original_photo_hash', imageHash)
      .eq('character_type', characterType)
      .single();

    let characterId = existingCharacter?.id;

    // Create or update character record
    if (!characterId) {
      const { data: newCharacter, error: characterError } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          character_name: `${characterType.charAt(0).toUpperCase() + characterType.slice(1)} Character`,
          character_description: characterDescription,
          original_image_url: `data:image/jpeg;base64,${image}`,
          sample_image_url: imageData.data[0].b64_json ? `data:image/png;base64,${imageData.data[0].b64_json}` : imageData.data[0].url,
          image_hash: imageHash,
          seed: characterSeed,
          character_type: characterType,
          style_prompt: stylePrompt,
          original_photo_hash: imageHash,
          style: characterType
        })
        .select()
        .single();

      if (characterError) {
        console.error('❌ Character creation error:', characterError);
        return new Response(
          JSON.stringify({ error: 'Failed to save character' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      characterId = newCharacter.id;
    }

    // Create character generation record
    const { error: generationError } = await supabase
      .from('character_generations')
      .insert({
        user_id: user.id,
        character_id: characterId,
        user_prompt: prompt,
        enhanced_prompt: stylePrompt,
        generated_image_url: imageData.data[0].b64_json ? `data:image/png;base64,${imageData.data[0].b64_json}` : imageData.data[0].url,
        style: characterType,
        seed: characterSeed,
        character_type: characterType
      });

    if (generationError) {
      console.error('❌ Generation record error:', generationError);
    }

    // Since gpt-image-1 returns base64, we need to handle the response properly
    const generatedImage = imageData.data[0];
    
    return new Response(
      JSON.stringify({
        success: true,
        imageData: generatedImage.b64_json ? `data:image/png;base64,${generatedImage.b64_json}` : generatedImage.url,
        characterAnalysis: characterDescription,
        stylePrompt: stylePrompt,
        characterId: characterId,
        seed: characterSeed,
        characterType: characterType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in character creation:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred during character creation', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});