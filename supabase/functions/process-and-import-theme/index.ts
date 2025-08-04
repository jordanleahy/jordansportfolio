import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingResult {
  success: boolean;
  data?: any;
  insertedCount?: number;
  fixes: string[];
  warnings: string[];
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    const { rawJson } = await req.json();

    // Combined AI processing and validation
    const aiResult = await processThemeJsonWithAI(rawJson);
    if (!aiResult.success) {
      return new Response(JSON.stringify(aiResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Database import
    const importResult = await importToDatabase(supabase, aiResult.cleanedData, user.id);
    if (!importResult.success) {
      return new Response(JSON.stringify({
        ...aiResult,
        success: false,
        errors: [...aiResult.errors, ...importResult.errors]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Background system prompt generation
    if (aiResult.cleanedData?.category) {
      generateSystemPromptBackground(supabase, aiResult.cleanedData.category, user.id);
    }

    const finalResult: ProcessingResult = {
      success: true,
      data: aiResult.cleanedData,
      insertedCount: importResult.insertedCount,
      fixes: [...aiResult.fixes, ...importResult.fixes],
      warnings: [...aiResult.warnings, ...importResult.warnings],
      errors: []
    };

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      errors: [error.message || 'Unknown error occurred'],
      fixes: [],
      warnings: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processThemeJsonWithAI(rawData: any): Promise<ProcessingResult> {
  const fixes: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const aiProcessedData = await aiProcessThemeData(rawData);
    const validatedData = validateThemeFields(aiProcessedData, fixes, warnings, errors);

    return {
      success: errors.length === 0,
      cleanedData: validatedData,
      fixes,
      warnings,
      errors
    };
  } catch (error) {
    console.error('💥 AI processing failed:', error);
    errors.push(`AI processing failed: ${error.message}`);
    
    return {
      success: false,
      fixes,
      warnings,
      errors
    };
  }
}

async function aiProcessThemeData(rawData: any) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Clean and fix this JSON for a content calendar:

Structure: {"category": "string", "theme": "string", "posts": [{"day": number, "title": "string", "description": "string", "status": "draft"}]}

Rules: Fix syntax, ensure title/description exist, set status="draft", limit 100 posts, generate day numbers.

Data: ${JSON.stringify(rawData)}

Return only valid JSON:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'o4-mini-2025-04-16',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0,
      max_tokens: 2000,
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

  // Validate required fields
  if (!validated.category || typeof validated.category !== 'string') {
    errors.push('Category is required and must be a string');
  } else if (validated.category.length > 100) {
    validated.category = validated.category.substring(0, 100);
    fixes.push('Truncated category to 100 characters');
  }

  if (!validated.theme || typeof validated.theme !== 'string') {
    errors.push('Theme is required and must be a string');
  } else if (validated.theme.length > 200) {
    validated.theme = validated.theme.substring(0, 200);
    fixes.push('Truncated theme to 200 characters');
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

    // Validate description
    if (!validatedPost.description || typeof validatedPost.description !== 'string') {
      errors.push(`Post ${index + 1}: Description is required`);
    } else if (validatedPost.description.length > 2000) {
      validatedPost.description = validatedPost.description.substring(0, 2000);
      fixes.push(`Truncated description for post ${index + 1}`);
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

async function importToDatabase(supabase: any, data: any, userId: string): Promise<ProcessingResult> {
  const fixes: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Rate limiting check - max 5 imports per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentImports, error: rateLimitError } = await supabase
      .from('social_media_posts')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      console.warn('Rate limit check failed:', rateLimitError);
    } else if (recentImports && recentImports.length > 200) {
      errors.push('Rate limit exceeded: Maximum 200 posts per hour');
      return { success: false, fixes, warnings, errors };
    }

    // Check for existing category (warn but don't block)
    const { data: existingPosts } = await supabase
      .from('social_media_posts')
      .select('id')
      .eq('category', data.category)
      .eq('user_id', userId)
      .limit(1);

    if (existingPosts && existingPosts.length > 0) {
      warnings.push(`Category '${data.category}' already exists - posts will be added to it`);
    }

    // Convert posts for database insertion
    const postsForDb = data.posts.map((post: any) => ({
      ...post,
      status: post.status || 'draft',
      theme: data.theme
    }));

    // Insert using RPC with error handling
    const { data: insertCount, error } = await supabase
      .rpc('insert_category_content', {
        category_name: data.category,
        posts_data: postsForDb
      });

    if (error) {
      console.error('Database insert error:', error);
      errors.push(`Database error: ${error.message}`);
      return { success: false, fixes, warnings, errors };
    }

    fixes.push(`Successfully inserted ${insertCount || postsForDb.length} posts`);

    return {
      success: true,
      insertedCount: insertCount || postsForDb.length,
      fixes,
      warnings,
      errors: []
    };

  } catch (error) {
    console.error('Import to database failed:', error);
    errors.push(`Import failed: ${error.message}`);
    return { success: false, fixes, warnings, errors };
  }
}

async function generateSystemPromptBackground(supabase: any, category: string, userId: string) {
  try {
    const { data: existingPrompts } = await supabase
      .from('system_prompts')
      .select('id')
      .eq('category', category)
      .eq('user_id', userId)
      .limit(1);

    if (existingPrompts?.length > 0) return;

    await supabase.functions.invoke('invoke-system-prompt-agent', {
      body: { category }
    });
  } catch (error) {
    // Silent fail for background process
  }
}