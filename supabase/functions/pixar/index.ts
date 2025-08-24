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
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { image, prompt } = await req.json();

    if (!image || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: image and prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎭 Starting Pixar conversion process...');
    console.log('📝 User prompt:', prompt);

    // Step 1: Validate photo quality and suitability
    console.log('🔍 Validating photo quality...');
    const validationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are an expert photo validator for character creation. Analyze this image and determine if it's suitable for Pixar character conversion.

Return a JSON object with this exact structure:
{
  "isValid": boolean,
  "confidence": number (0-100),
  "faceCount": number,
  "primaryFaceDetected": boolean,
  "issues": [array of specific issue strings],
  "validationMessage": "specific message for user"
}

Validation criteria:
- Must have exactly one clearly visible human face (faceCount = 1)
- Face must be well-lit and in focus
- Image quality must be sufficient to see facial features
- Face should take up reasonable portion of image
- No multiple faces competing for attention

Common issues to detect:
- "multiple_faces": More than one face detected
- "no_face": No human face clearly visible  
- "poor_quality": Blurry, dark, or low resolution
- "face_too_small": Face is too small in frame
- "unclear_features": Cannot distinguish facial features clearly
- "not_human": Subject is not a human person`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please validate this image for Pixar character conversion:'
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
        max_completion_tokens: 300,
        response_format: { type: 'json_object' }
      }),
    });

    if (!validationResponse.ok) {
      const error = await validationResponse.text();
      console.error('❌ Validation API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to validate image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validationData = await validationResponse.json();
    let validation;
    try {
      validation = JSON.parse(validationData.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse validation JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate image format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Validation result:', validation);

    // Check if image is valid for processing
    if (!validation.isValid) {
      console.log('❌ Image validation failed:', validation.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Image validation failed',
          validationError: true,
          issues: validation.issues,
          validationMessage: validation.validationMessage,
          faceCount: validation.faceCount,
          confidence: validation.confidence
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Photo validation passed, proceeding with character analysis...');

    // Step 2: Analyze the person in the image to extract key features
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
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

    // Create Pixar-style prompt combining character analysis with user's request
    const pixarPrompt = `Pixar 3D animated character: ${characterDescription}, ${prompt}. Large expressive eyes (1.5x normal size), soft rounded facial features, warm studio lighting, high-quality 3D render in Disney Pixar movie animation style, vibrant colors, child-friendly appearance, professional animation quality, detailed textures, glossy finish typical of Pixar films.`;

    console.log('🎨 Generated Pixar prompt:', pixarPrompt.substring(0, 200) + '...');

    // Generate the Pixar image
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: pixarPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        output_format: 'png',
        background: 'transparent'
      }),
    });

    if (!imageResponse.ok) {
      const error = await imageResponse.text();
      console.error('❌ Image generation error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate Pixar image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageData = await imageResponse.json();
    console.log('✅ Pixar image generated successfully');

    // Since gpt-image-1 returns base64, we need to handle the response properly
    const generatedImage = imageData.data[0];
    
    return new Response(
      JSON.stringify({
        success: true,
        imageData: generatedImage.b64_json ? `data:image/png;base64,${generatedImage.b64_json}` : generatedImage.url,
        characterAnalysis: characterDescription,
        pixarPrompt: pixarPrompt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in Pixar conversion:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred during Pixar conversion', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});