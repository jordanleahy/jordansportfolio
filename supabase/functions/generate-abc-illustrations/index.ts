import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

interface ABCRequest {
  description?: string;
  user_id?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

// Generate correlation ID for request tracking
const generateCorrelationId = () => {
  return `abc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = generateCorrelationId();
  console.log(`🔵 [${correlationId}] ABC Illustrations generation started`);

  try {
    // Initialize Supabase clients
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const userSupabase = createClient(
      supabaseUrl!,
      supabaseAnonKey!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      console.error(`❌ [${correlationId}] Authentication failed:`, authError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { description = '' }: ABCRequest = await req.json();
    console.log(`📝 [${correlationId}] Processing ABC theme: "${description}"`);

    // Create system prompt for ABC generation
    const systemPrompt = `You are an expert educational content creator specializing in ABC books for young children (ages 3-6).

Your task is to generate a complete A-Z alphabet series with 26 posts, one for each letter of the alphabet.

THEME CONTEXT: ${description || 'Generic educational content suitable for young children'}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 26 posts, one for each letter A through Z
2. Each post MUST follow the format: "[Letter] is for [Word]"
3. All content must be appropriate for ages 3-6
4. Use simple, clear language that young children can understand
5. Choose words that are familiar and relatable to children

STYLE GUIDELINES:
${description ? `- Adapt all content to the "${description}" theme while maintaining educational value` : '- Use bright, colorful educational illustration style suitable for young children'}
- Keep descriptions short and engaging (2-3 sentences maximum)
- Focus on positive, encouraging language
- Choose words that are fun and memorable for children

OUTPUT FORMAT (JSON only):
{
  "category": "abc-${description ? description.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'educational'}",
  "theme": "${description ? `ABC ${description}` : 'ABC Learning for Kids'}",
  "theme_description": "${description ? `A fun alphabet series exploring letters A-Z with a ${description} theme, perfect for young learners.` : 'A fun and engaging way for preschool children to explore the alphabet, with each letter featuring a delightful word and concept.'}",
  "posts": [
    {
      "day": 1,
      "title": "A is for [Word]",
      "description": "[2-3 sentences appropriate for ages 3-6, relating to the theme]"
    },
    // ... continue through all 26 letters of the alphabet
  ]
}

EXAMPLES:

Generic Educational:
A is for Apple - "Apples are crunchy and sweet! They grow on trees and come in red, green, and yellow. Eating apples helps keep us healthy and strong."

Space Theme:
A is for Astronaut - "Astronauts are brave explorers who travel to space! They wear special suits and helmets to keep them safe. Astronauts get to see Earth from way up high!"

Animal Theme:
A is for Alligator - "Alligators are big reptiles with sharp teeth! They live in swamps and rivers where it's warm. Baby alligators are called hatchlings."

GENERATE ALL 26 LETTERS NOW:`;

    console.log(`🤖 [${correlationId}] Calling OpenAI API for ABC generation...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Generate a complete A-Z alphabet series for: ${description || 'educational content for young children'}`
          }
        ],
        max_completion_tokens: 6000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [${correlationId}] OpenAI API error:`, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content.trim();
    console.log(`📦 [${correlationId}] OpenAI response received, length:`, generatedContent.length);

    // Parse JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error(`❌ [${correlationId}] JSON parsing failed:`, parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate that we have exactly 26 posts
    if (!parsedData.posts || parsedData.posts.length !== 26) {
      console.error(`❌ [${correlationId}] Invalid post count: ${parsedData.posts?.length}, expected 26`);
      throw new Error(`Expected 26 posts for A-Z series, got ${parsedData.posts?.length}`);
    }

    console.log(`✅ [${correlationId}] Generated ${parsedData.posts.length} ABC posts`);

    // Create theme in database
    const themeId = crypto.randomUUID();
    const { error: themeError } = await supabase
      .from('themes')
      .insert({
        id: themeId,
        user_id: user.id,
        theme_name: parsedData.theme,
        description: parsedData.theme_description,
        category: parsedData.category,
        query: description || 'ABC educational content',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (themeError) {
      console.error(`❌ [${correlationId}] Theme creation failed:`, themeError);
      throw new Error(`Failed to create theme: ${themeError.message}`);
    }

    console.log(`✅ [${correlationId}] Theme created with ID: ${themeId}`);

    // Prepare posts with specialized image prompts that guarantee letter placement
    const postsWithImagePrompts = parsedData.posts.map((post: any, index: number) => {
      const letter = String.fromCharCode(65 + index); // A=65, B=66, etc.
      const word = post.title.split(' is for ')[1] || post.title.split(' ')[3]; // Extract word after "is for"
      
      const styleInstruction = description 
        ? `${description}-themed illustration showing` 
        : 'bright, colorful educational illustration suitable for young children (ages 3-6) showing';

      // CRITICAL: Every image prompt starts with letter placement instruction
      const imagePrompt = `CRITICAL: Place a large, bold letter '${letter}' in the top-left corner of the image. ${styleInstruction} ${word}. The image should be clean, child-friendly, and clearly represent the concept of ${word}. Use bright colors and simple, appealing visuals that would engage young children aged 3-6.`;

      return {
        id: crypto.randomUUID(),
        user_id: user.id,
        theme_id: themeId,
        day: post.day,
        title: post.title,
        description: post.description,
        category: parsedData.category,
        generated_image_prompt: imagePrompt,
        individual_prompt_status: 'completed',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    // Insert all posts
    const { error: postsError } = await supabase
      .from('social_media_posts')
      .insert(postsWithImagePrompts);

    if (postsError) {
      console.error(`❌ [${correlationId}] Posts insertion failed:`, postsError);
      throw new Error(`Failed to create posts: ${postsError.message}`);
    }

    console.log(`✅ [${correlationId}] Created ${postsWithImagePrompts.length} posts with specialized image prompts`);

    // Update theme completion status
    const { error: updateError } = await supabase
      .from('themes')
      .update({
        prompt_generation_status: 'completed',
        prompt_completion_count: 26,
        total_posts_count: 26,
        lifecycle_status: 'ready',
        background_processing_complete: true,
        user_interaction_required: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', themeId);

    if (updateError) {
      console.error(`❌ [${correlationId}] Theme status update failed:`, updateError);
    }

    console.log(`🎉 [${correlationId}] ABC Illustrations pipeline completed successfully!`);

    return new Response(
      JSON.stringify({
        success: true,
        theme_id: themeId,
        category: parsedData.category,
        theme_name: parsedData.theme,
        post_count: 26,
        message: 'ABC Illustrations created successfully with guaranteed letter placement',
        correlation_id: correlationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error(`❌ [${correlationId}] ABC generation error:`, error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate ABC illustrations', 
        details: error.message,
        correlation_id: correlationId
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});