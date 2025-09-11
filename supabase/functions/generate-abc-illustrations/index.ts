import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

interface ABCRequest {
  description?: string;
  user_id?: string;
}

// JSON Schema for structured output
const ABC_SCHEMA = {
  name: "abc_deck",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["category", "theme", "theme_description", "posts"],
    properties: {
      category: { type: "string", minLength: 1, maxLength: 100 },
      theme: { type: "string", minLength: 1, maxLength: 200 },
      theme_description: { type: "string", minLength: 1, maxLength: 1000 },
      posts: {
        type: "array",
        minItems: 26,
        maxItems: 26,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["day", "title", "description"],
          properties: {
            day: { type: "integer", minimum: 1, maximum: 26 },
            title: {
              type: "string",
              pattern: "^[A-Z] is for [A-Za-z][A-Za-z\\- ]*$",
              minLength: 8,
              maxLength: 80
            },
            description: { type: "string", minLength: 10, maxLength: 240 }
          }
        }
      }
    }
  },
  strict: true
} as const;

// Alphabet letters array
const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

// Generate minimal system prompt
const buildSystemPrompt = (theme: string) => `
You create structured ABC decks for children ages 3–6.

Follow these principles:
- 26 items exactly (A–Z), age-appropriate, positive tone.
- Simple, concrete words kids know; no brand/IP.
- Each title must be "[Letter] is for [Word]".
- Descriptions are 1–2 short sentences max, plain language.
- Keep content aligned to THEME while remaining kid-safe.

THEME: ${theme || 'General preschool learning'}

Return JSON that strictly matches the provided JSON Schema. Do not include any extra text.
`.trim();

// Generate user message
const userMessage = (theme: string) =>
  `Generate an A–Z deck for preschoolers aligned to THEME="${theme || 'General'}".
- 26 items exactly, days 1..26.
- Titles must be "[Letter] is for [Word]".
- Descriptions: 1–2 short sentences.`;

// Extract word from title
const extractWord = (title: string) => {
  const match = title.match(/^[A-Z] is for (.+)$/i);
  return match ? match[1].trim() : title;
};

// Generate image prompt template
const imagePromptFor = (letter: string, word: string, theme: string) => 
  `Place a large, bold letter "${letter}" in the top-left corner.
Include the exact text "${letter} is for ${word}" prominently along the bottom.
Create a bright, child-friendly illustration (ages 3–6) of "${word}" in the context of "${theme}".
Keep shapes simple, colors vivid, and the concept unmistakable for preschoolers.`;

// Safe slug generation
const safeSlug = (s: string) => (s || 'educational').toLowerCase().replace(/[^a-z0-9]+/g, '-');

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
            content: buildSystemPrompt(description)
          },
          {
            role: 'user',
            content: userMessage(description)
          }
        ],
        max_completion_tokens: 4000,
        response_format: {
          type: 'json_schema',
          json_schema: ABC_SCHEMA
        }
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
    let parsed;
    try {
      parsed = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error(`❌ [${correlationId}] JSON parsing failed:`, parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate that we have exactly 26 posts
    if (!parsed.posts || parsed.posts.length !== 26) {
      console.error(`❌ [${correlationId}] Invalid post count: ${parsed.posts?.length}, expected 26`);
      throw new Error(`Expected 26 posts for A-Z series, got ${parsed.posts?.length}`);
    }

    console.log(`✅ [${correlationId}] Generated ${parsed.posts.length} ABC posts`);

    // Create theme in database
    const themeId = crypto.randomUUID();
    
    // Generate deterministic category and theme fields
    const category = `abc-${safeSlug(description)}`;
    const theme = description ? `ABC ${description}` : 'ABC Learning for Kids';
    const theme_description = description
      ? `A fun alphabet series exploring A–Z with a ${description} theme for young learners.`
      : 'A playful, age-appropriate A–Z deck for preschoolers.';

    const { error: themeError } = await supabase
      .from('themes')
      .insert({
        id: themeId,
        user_id: user.id,
        theme_name: theme,
        description: theme_description,
        category: category,
        query: description || 'ABC educational content',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (themeError) {
      console.error(`❌ [${correlationId}] Theme creation failed:`, themeError);
      throw new Error(`Failed to create theme: ${themeError.message}`);
    }

    console.log(`✅ [${correlationId}] Theme created with ID: ${themeId}`);

    // Prepare posts with templated image prompts
    const postsWithImagePrompts = parsed.posts.map((post: any, index: number) => {
      const letter = LETTERS[index];
      const word = extractWord(post.title);
      const themeContext = description || 'Preschool ABCs';
      
      return {
        id: crypto.randomUUID(),
        user_id: user.id,
        theme_id: themeId,
        day: post.day,
        title: post.title,
        description: post.description,
        category: category,
        generated_image_prompt: imagePromptFor(letter, word, themeContext),
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

    console.log(`✅ [${correlationId}] Created ${postsWithImagePrompts.length} posts with templated image prompts`);

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
        category: category,
        theme_name: theme,
        post_count: 26,
        message: 'ABC Illustrations created successfully with optimized prompts',
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