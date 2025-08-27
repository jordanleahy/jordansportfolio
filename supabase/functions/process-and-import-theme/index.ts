import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

declare const EdgeRuntime: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const createErrorResponse = (errors: string[], status = 500, extras = {}) => 
  new Response(JSON.stringify({ success: false, errors, ...extras }), { status, headers: corsHeaders });

const createSuccessResponse = (data: any, status = 200) => 
  new Response(JSON.stringify({ success: true, ...data }), { status, headers: corsHeaders });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('Authentication required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Invalid authentication');

    const requestBody = await req.json();
    const { rawJson } = requestBody;

    if (!rawJson) return createErrorResponse(['Missing rawJson data'], 400);

    const idempotencyKey = requestBody.idempotencyKey || 
      `${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Process theme JSON with AI
    const fixes: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    let cleanedData;
    try {
      const aiProcessedData = await aiProcessThemeData(rawJson);
      cleanedData = validateThemeFields(aiProcessedData, fixes, warnings, errors);
    } catch (error) {
      console.error('💥 AI processing failed:', error);
      errors.push(`AI processing failed: ${error.message}`);
    }
    
    if (errors.length > 0) {
      return createErrorResponse(errors, 400, { fixes, warnings, idempotencyKey });
    }

    try {
      const resolvedCategory = cleanedData.category || 'general';

      const { data: createdTheme, error: themeError } = await supabase
        .from('themes')
        .insert({
          user_id: user.id,
          theme_name: cleanedData.theme,
          theme_description: cleanedData.theme_description || null,
          category: resolvedCategory
        })
        .select('id')
        .single();

      if (themeError) return createErrorResponse([themeError.message], 500, { idempotencyKey });

      const { data: insertedCount, error: postsError } = await supabase
        .rpc('insert_posts_for_theme', {
          theme_id: createdTheme.id,
          posts_data: cleanedData.posts,
          theme_description_param: cleanedData.theme_description || null
        });

      if (postsError) return createErrorResponse([postsError.message], 500, { idempotencyKey });

      // Start background tasks
      EdgeRuntime.waitUntil(
        generateSystemPromptBackground(supabase, resolvedCategory, user.id, createdTheme.id)
          .then(() => generateBlogPostPromptsBackground(resolvedCategory, user.id))
          .catch(console.error)
      );

      return createSuccessResponse({
        insertedCount,
        data: { ...cleanedData, category: resolvedCategory },
        idempotencyKey,
        themeId: createdTheme.id,
        message: 'Theme imported successfully. Background processing initiated.'
      });

    } catch (error) {
      return createErrorResponse([error.message || 'Database transaction failed'], 500, { idempotencyKey });
    }

  } catch (error) {
    return createErrorResponse([error.message || 'Unknown error occurred'], 500, { fixes: [], warnings: [] });
  }
});

async function aiProcessThemeData(rawData: any) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) throw new Error('OpenAI API key not configured');

  const prompt = `Clean and fix this JSON for a content calendar with the exact structure:

{"category": "string", "theme": "string", "theme_description": "optional string", "posts": [{"day": number, "title": "string", "story_description": "string", "status": "draft"}]}

Rules: 
- Fix syntax errors
- Ensure title/story_description exist
- Set status="draft" if missing
- Limit 100 posts max
- Generate day numbers if missing
- Keep theme_description if provided
- Map description → story_description

Data: ${JSON.stringify(rawData)}

Return only valid JSON:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const aiResponse = result.choices[0].message.content.trim();

  try {
    const cleanJson = aiResponse.replace(/^```json\s*|\s*```$/g, '');
    return JSON.parse(cleanJson);
  } catch (parseError) {
    throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
  }
}

function validateThemeFields(data: any, fixes: string[], warnings: string[], errors: string[]): any {
  const validated = { ...data };

  // Category is now optional - will be derived from theme or use default
  if (validated.category !== undefined && (typeof validated.category !== 'string' || validated.category.trim().length === 0)) {
    warnings.push('Category provided but invalid, will use default category');
    delete validated.category;
  } else if (validated.category && validated.category.length > 100) {
    validated.category = validated.category.substring(0, 100);
    fixes.push('Truncated category to 100 characters');
  }

  if (!validated.theme || typeof validated.theme !== 'string') {
    errors.push('Theme is required and must be a string');
  } else if (validated.theme.length > 200) {
    validated.theme = validated.theme.substring(0, 200);
    fixes.push('Truncated theme to 200 characters');
  }

  // Optional theme_description validation
  if (validated.theme_description && (typeof validated.theme_description !== 'string' || validated.theme_description.length > 1000)) {
    validated.theme_description = String(validated.theme_description).substring(0, 1000);
    fixes.push('Truncated theme_description to 1000 characters');
  }

  if (!Array.isArray(validated.posts)) {
    errors.push('Posts must be an array');
    return validated;
  }

  if (validated.posts.length === 0) {
    errors.push('At least one post is required');
    return validated;
  }

  if (validated.posts.length > 100) {
    validated.posts = validated.posts.slice(0, 100);
    warnings.push('Limited posts to maximum of 100');
  }

  // Validate each post
  validated.posts = validated.posts.map((post: any, index: number) => {
    const validatedPost = { ...post };

    // Ensure day number
    if (!validatedPost.day) {
      validatedPost.day = index + 1;
      fixes.push(`Generated day number ${index + 1} for post ${index + 1}`);
    }

    // Validate title
    if (!validatedPost.title || typeof validatedPost.title !== 'string') {
      errors.push(`Post ${index + 1}: Title is required`);
    } else if (validatedPost.title.length > 500) {
      validatedPost.title = validatedPost.title.substring(0, 500);
      fixes.push(`Truncated title for post ${index + 1}`);
    }

    // Validate story_description
    if (!validatedPost.story_description || typeof validatedPost.story_description !== 'string') {
      errors.push(`Post ${index + 1}: Story description is required`);
    } else if (validatedPost.story_description.length > 2000) {
      validatedPost.story_description = validatedPost.story_description.substring(0, 2000);
      fixes.push(`Truncated story_description for post ${index + 1}`);
    }

    // Set default status
    if (!validatedPost.status || !['draft', 'scheduled', 'published'].includes(validatedPost.status)) {
      validatedPost.status = 'draft';
      fixes.push(`Set default status for post ${index + 1}`);
    }

    return validatedPost;
  });

  return validated;
}

async function generateSystemPromptBackground(supabase: any, category: string, userId: string, themeId: string) {
  try {
    const { data: existingPrompts, error: checkError } = await supabase
      .from('system_prompts')
      .select('id')
      .eq('theme_id', themeId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1);

    if (checkError) return { success: false, error: checkError.message };
    if (existingPrompts?.length > 0) return { success: true };

    const invokeResult = await supabase.functions.invoke('invoke-system-prompt-agent', {
      body: { 
        category: 'system_prompt_generation',
        theme: category,
        description: `Generated content for ${category} category`,
        user_id: userId
      }
    });
    
    return invokeResult.error 
      ? { success: false, error: invokeResult.error.message }
      : { success: true };
      
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function generateBlogPostPromptsBackground(category: string, userId: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return { success: false, error: 'Missing Supabase configuration' };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/ensure-post-image-prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ category, userId }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

  } catch (error) {
    return { success: false, error: error.message };
  }
}