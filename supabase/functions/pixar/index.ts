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

    // Combined analysis and validation in one call for efficiency
    console.log('🔍 Analyzing and validating image...');
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
            content: `You are an expert at analyzing people in photos for Pixar character creation. 

First, validate if this image is suitable:
- Must have exactly one clearly visible human face
- Face must be well-lit and in focus
- Image quality must be sufficient to see facial features
- Face should take up reasonable portion of image

If the image is NOT suitable, respond with: "VALIDATION_FAILED: [reason]"
Where [reason] is one of: MULTIPLE_FACES, NO_FACE, POOR_QUALITY, FACE_TOO_SMALL, UNCLEAR_FEATURES, NOT_HUMAN

If the image IS suitable, analyze the person and extract:
1. Age group (child/teen/adult)
2. Face shape (oval/round/square/heart)
3. Eye color and shape
4. Hair color and style
5. Skin tone
6. Notable facial features
7. Expression/personality traits visible

Focus ONLY on permanent facial features and ignore clothing, backgrounds, and accessories.
Respond with a brief, focused description of the person's permanent characteristics.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this person for Pixar character creation:'
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
        max_completion_tokens: 400
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
    const analysisResult = analysisData.choices[0].message.content;
    
    console.log('📊 Analysis result:', analysisResult);

    // Check if validation failed
    if (analysisResult.startsWith('VALIDATION_FAILED:')) {
      const reason = analysisResult.replace('VALIDATION_FAILED: ', '');
      console.log('❌ Image validation failed:', reason);
      
      let userMessage = 'Image validation failed. Please try a different photo.';
      let issues = [reason.toLowerCase()];
      
      switch (reason) {
        case 'MULTIPLE_FACES':
          userMessage = 'Multiple faces detected. Please crop the photo to focus on one person.';
          break;
        case 'NO_FACE':
          userMessage = 'No face clearly visible. Please use a photo with a clear view of a person\'s face.';
          break;
        case 'POOR_QUALITY':
          userMessage = 'Image quality too low. Please use a clearer, well-lit photo with good resolution.';
          break;
        case 'FACE_TOO_SMALL':
          userMessage = 'Face is too small in the image. Please use a closer photo where the face is more prominent.';
          break;
        case 'UNCLEAR_FEATURES':
          userMessage = 'Facial features are unclear. Please use a sharper photo with better lighting.';
          break;
        case 'NOT_HUMAN':
          userMessage = 'Please use a photo of a human person for Pixar character conversion.';
          break;
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Image validation failed',
          validationError: true,
          issues: issues,
          validationMessage: userMessage
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const characterDescription = analysisResult;
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