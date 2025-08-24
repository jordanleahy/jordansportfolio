import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to generate image hash
async function generateImageHash(imageData: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(imageData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not found');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          details: 'Please set the OPENAI_API_KEY environment variable'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { image, prompt, style = 'vector', characterId = null, saveAsCharacter = false, characterName = null } = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!image || !prompt) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: 'Both image and prompt are required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🎨 Starting ${style} character generation for user ${user.id}...`);
    
    // Generate image hash for character lookup
    const imageHash = await generateImageHash(image);
    console.log(`📸 Image hash: ${imageHash}`);
    
    let existingCharacter = null;
    let characterAnalysis = '';
    
    // Check if we have an existing character for this image
    if (characterId) {
      const { data: character } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .eq('user_id', user.id)
        .single();
      
      if (character) {
        existingCharacter = character;
        characterAnalysis = character.character_description;
        console.log(`🎯 Using existing character: ${character.character_name || 'Unnamed'}`);
      }
    } else {
      // Look up by image hash
      const { data: character } = await supabase
        .from('characters')
        .select('*')
        .eq('image_hash', imageHash)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (character) {
        existingCharacter = character;
        characterAnalysis = character.character_description;
        console.log(`🔄 Found existing character by image hash: ${character.character_name || 'Unnamed'}`);
      }
    }
    
    // Step 1: Analyze the uploaded image (only if we don't have existing analysis)
    if (!characterAnalysis) {
      console.log('🔍 Analyzing uploaded image...');
      
      const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: `You are an expert at analyzing people in photos for character creation. 

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
                  text: 'Please analyze this person for character creation:'
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
      characterAnalysis = analysisData.choices[0].message.content;
      
      console.log('📊 Analysis result:', characterAnalysis);

      // Check if validation failed
      if (characterAnalysis.startsWith('VALIDATION_FAILED:')) {
        const reason = characterAnalysis.replace('VALIDATION_FAILED: ', '');
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
            userMessage = 'Please use a photo of a human person for character conversion.';
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
    }

    console.log('✅ Character analysis completed');

    // Step 2: Create style-appropriate prompt combining character analysis with user's request
    let finalPrompt: string;
    
    if (style === 'vector') {
      finalPrompt = `Flat vector illustration: ${characterAnalysis}, ${prompt}. Clean geometric shapes, bold flat colors with minimal gradients, simple clean lines, modern graphic design aesthetic, professional vector art quality, minimalist approach focusing on essential features, contemporary flat design principles, clean background with subtle geometric patterns, ultra high resolution with crisp scalable vector appearance.`;
    } else {
      finalPrompt = `Pixar 3D animated character: ${characterAnalysis}, ${prompt}. Large expressive eyes (1.5x normal size), soft rounded facial features, warm studio lighting, high-quality 3D render in Disney Pixar movie animation style, vibrant colors, child-friendly appearance, professional animation quality, detailed textures, glossy finish typical of Pixar films.`;
    }

    console.log('🎨 Generated prompt:', finalPrompt.substring(0, 200) + '...');

    // Step 3: Generate the image
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: finalPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        output_format: 'png',
        background: style === 'vector' ? 'transparent' : 'opaque'
      }),
    });

    if (!imageResponse.ok) {
      const error = await imageResponse.text();
      console.error('❌ Image generation error:', error);
      return new Response(
        JSON.stringify({ error: `Failed to generate ${style} image` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageData = await imageResponse.json();
    const generatedImage = imageData.data[0];
    const generatedImageUrl = generatedImage.b64_json ? `data:image/png;base64,${generatedImage.b64_json}` : generatedImage.url;
    
    console.log('✅ Character image generated successfully');
    
    // Step 4: Handle character storage
    let characterRecord = existingCharacter;
    
    if (!existingCharacter && saveAsCharacter) {
      // Create new character record
      console.log('💾 Saving new character...');
      
      const { data: newCharacter, error: characterError } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          character_name: characterName,
          image_hash: imageHash,
          character_description: characterAnalysis,
          original_image_url: `data:image/jpeg;base64,${image}`,
          style: style,
          sample_image_url: generatedImageUrl
        })
        .select()
        .single();
      
      if (characterError) {
        console.error('❌ Error saving character:', characterError);
      } else {
        characterRecord = newCharacter;
        console.log(`✅ Character saved with ID: ${newCharacter.id}`);
      }
    }
    
    // Step 5: Save generation record
    if (characterRecord) {
      console.log('📝 Saving generation record...');
      
      const { error: generationError } = await supabase
        .from('character_generations')
        .insert({
          character_id: characterRecord.id,
          user_id: user.id,
          user_prompt: prompt,
          enhanced_prompt: finalPrompt,
          generated_image_url: generatedImageUrl,
          style: style
        });
      
      if (generationError) {
        console.error('❌ Error saving generation:', generationError);
      } else {
        console.log('✅ Generation record saved');
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: generatedImageUrl,
        characterAnalysis: characterAnalysis,
        enhancedPrompt: finalPrompt,
        style: style,
        characterId: characterRecord?.id || null,
        characterName: characterRecord?.character_name || null,
        existingCharacter: !!existingCharacter
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in character conversion:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred during character conversion', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});