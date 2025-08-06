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
  idempotencyKey?: string;
}

serve(async (req) => {
  console.log('🚀 PROCESS-AND-IMPORT-THEME: Function started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔐 AUTHENTICATION: Checking auth header');
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    console.log('🔗 SUPABASE: Creating client connection');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    console.log('👤 USER: Validating authentication');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }
    console.log('✅ USER AUTHENTICATED:', { user_id: user.id, email: user.email });

    console.log('📥 REQUEST: Parsing incoming JSON data');
    const requestBody = await req.json();
    
    console.log('📥 RAW REQUEST BODY:', {
      hasRawJson: !!requestBody.rawJson,
      hasIdempotencyKey: !!requestBody.idempotencyKey,
      dataType: typeof requestBody.rawJson,
      timestamp: new Date().toISOString()
    });
    
    const { rawJson } = requestBody;

    if (!requestBody.rawJson) {
      console.log('❌ VALIDATION FAILED: Missing rawJson');
      return new Response(
        JSON.stringify({ success: false, errors: ['Missing rawJson data'] }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate idempotency key if not provided
    const idempotencyKey = requestBody.idempotencyKey || `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🔑 IDEMPOTENCY KEY:', {
      provided: !!requestBody.idempotencyKey,
      key: idempotencyKey,
      timestamp: new Date().toISOString()
    });

    // Combined AI processing and validation
    console.log('🤖 AI PROCESSING: Starting theme JSON processing');
    const aiResult = await processThemeJsonWithAI(rawJson);
    console.log('🤖 AI PROCESSING RESULT:', {
      success: aiResult.success,
      errorCount: aiResult.errors.length,
      warningCount: aiResult.warnings.length,
      fixCount: aiResult.fixes.length,
      hasCleanedData: !!aiResult.cleanedData,
      extractedCategory: aiResult.cleanedData?.category
    });
    
    if (!aiResult.success) {
      console.log('❌ AI PROCESSING FAILED - returning error response');
      return new Response(JSON.stringify({
        ...aiResult,
        idempotencyKey
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📊 PROCESSING DATA:', {
      category: aiResult.cleanedData.category,
      theme: aiResult.cleanedData.theme,
      postsCount: aiResult.cleanedData.posts?.length || 0,
      hasThemeDescription: !!aiResult.cleanedData.theme_description,
      idempotencyKey,
      timestamp: new Date().toISOString()
    });

    try {
      // Create theme directly in themes table
      console.log('💾 CREATING THEME:', {
        category: aiResult.cleanedData.category,
        theme: aiResult.cleanedData.theme,
        timestamp: new Date().toISOString()
      });

      // Check for duplicate theme
      const { data: existingTheme, error: checkError } = await supabase
        .from('themes')
        .select('id')
        .eq('user_id', user.id)
        .eq('theme_name', aiResult.cleanedData.theme)
        .eq('category', aiResult.cleanedData.category)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // Not a "no rows" error
        console.error('💥 DUPLICATE CHECK ERROR:', checkError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            errors: [checkError.message],
            idempotencyKey 
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      if (existingTheme) {
        console.log('⚠️ DUPLICATE THEME DETECTED');
        return new Response(
          JSON.stringify({ 
            success: false, 
            errors: ['A theme with this category and name already exists.'],
            idempotencyKey
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Create the theme
      const { data: createdTheme, error: themeError } = await supabase
        .from('themes')
        .insert({
          user_id: user.id,
          theme_name: aiResult.cleanedData.theme,
          description: aiResult.cleanedData.theme_description || null,
          category: aiResult.cleanedData.category
        })
        .select('id')
        .single();

      if (themeError) {
        console.error('💥 THEME CREATION ERROR:', themeError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            errors: [themeError.message],
            idempotencyKey 
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Insert posts using existing function
      const { data: insertedCount, error: postsError } = await supabase
        .rpc('insert_category_content', {
          category_name: aiResult.cleanedData.category,
          posts_data: aiResult.cleanedData.posts,
          theme_description_param: aiResult.cleanedData.theme_description || null,
          theme_id_param: createdTheme.id
        });

      if (postsError) {
        console.error('💥 POSTS INSERT ERROR:', postsError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            errors: [postsError.message],
            idempotencyKey 
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log('✅ THEME AND POSTS CREATED:', {
        themeId: createdTheme.id,
        insertedCount: insertedCount,
        idempotencyKey,
        timestamp: new Date().toISOString()
      });

      // Start background tasks after successful import
      console.log('🚀 STARTING BACKGROUND TASKS:', {
        category: aiResult.cleanedData.category,
        themeId: createdTheme.id,
        idempotencyKey,
        timestamp: new Date().toISOString()
      });

      // Generate system prompt in background
      EdgeRuntime.waitUntil(
        generateSystemPromptBackground(supabase, aiResult.cleanedData.category, user.id)
          .then((promptResult) => {
            console.log('📝 SYSTEM PROMPT RESULT:', {
              success: promptResult?.success || false,
              category: aiResult.cleanedData.category,
              themeId: createdTheme.id,
              timestamp: new Date().toISOString()
            });
            
            // Generate theme image after system prompt (regardless of prompt result)
            return generateThemeImageBackground(aiResult.cleanedData.category, user.id);
          })
          .then((imageResult) => {
            console.log('🖼️ THEME IMAGE RESULT:', {
              success: imageResult?.success || false,
              category: aiResult.cleanedData.category,
              themeId: createdTheme.id,
              timestamp: new Date().toISOString()
            });
            
            // Start blog post prompt generation after theme image (regardless of image result)
            console.log('📝 BLOG POST PROMPTS: Starting prompt generation');
            return generateBlogPostPromptsBackground(aiResult.cleanedData.category, user.id);
          })
          .then((promptsResult) => {
            console.log('📝 BLOG POST PROMPTS RESULT:', {
              success: promptsResult?.success || false,
              category: aiResult.cleanedData.category,
              themeId: createdTheme.id,
              timestamp: new Date().toISOString()
            });
          })
          .catch((error) => {
            console.error('💥 BACKGROUND GENERATION ERROR:', error);
          })
      );

      // Return immediate success response
      return new Response(
        JSON.stringify({
          success: true,
          insertedCount: insertedCount,
          data: aiResult.cleanedData,
          idempotencyKey,
          themeId: createdTheme.id,
          message: 'Theme imported successfully. Background processing initiated.'
        }),
        { status: 200, headers: corsHeaders }
      );

    } catch (error) {
      console.error('💥 IMPORT TRANSACTION ERROR:', error);
      return new Response(
        JSON.stringify({
          success: false,
          errors: [error.message || 'Database transaction failed'],
          idempotencyKey
        }),
        { status: 500, headers: corsHeaders }
      );
    }

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
      model: 'gpt-4.1-2025-04-14',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0,
      max_completion_tokens: 2000,
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

async function generateSystemPromptBackground(supabase: any, category: string, userId: string): Promise<{ success: boolean; error?: string }> {
  console.log('🔄 BACKGROUND TASK: Starting system prompt generation check');
  console.log('📋 BACKGROUND PARAMS:', {
    category,
    userId,
    timestamp: new Date().toISOString()
  });
  
  try {
    console.log('🔍 CHECKING: Existing system prompts for category');
    const { data: existingPrompts, error: checkError } = await supabase
      .from('system_prompts')
      .select('id')
      .eq('category', category)
      .eq('user_id', userId)
      .limit(1);

    console.log('📊 EXISTING PROMPTS CHECK:', {
      existingPromptsCount: existingPrompts?.length || 0,
      checkError: checkError?.message,
      needsGeneration: !existingPrompts?.length
    });

    if (checkError) {
      console.error('❌ Error checking existing prompts:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingPrompts?.length > 0) {
      console.log('✅ SYSTEM PROMPT EXISTS: Skipping generation');
      return { success: true };
    }

    console.log('🚀 INVOKING: invoke-system-prompt-agent edge function');
    const invokeResult = await supabase.functions.invoke('invoke-system-prompt-agent', {
      body: { 
        category: 'system_prompt_generation',
        theme: category,
        description: `Generated content for ${category} category`,
        user_id: userId
      }
    });
    
    console.log('📡 INVOKE RESULT:', {
      success: !invokeResult.error,
      error: invokeResult.error?.message,
      data: !!invokeResult.data
    });

    if (invokeResult.error) {
      console.error('❌ SYSTEM PROMPT: Generation failed:', invokeResult.error);
      return { success: false, error: invokeResult.error.message };
    }

    console.log('✅ SYSTEM PROMPT: Generation completed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('💥 BACKGROUND GENERATION ERROR:', {
      error: error.message,
      category,
      userId,
      timestamp: new Date().toISOString()
    });
    return { success: false, error: error.message };
  }
}

// Background function to trigger theme image generation
async function generateThemeImageBackground(category: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🖼️ THEME IMAGE: Starting generation for category: ${category}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration for theme image generation');
      return { success: false, error: 'Missing Supabase configuration' };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the first post from this category for the user
    const { data: firstPost, error: postError } = await supabase
      .from('social_media_posts')
      .select('id, title, description, category, theme')
      .eq('user_id', userId)
      .eq('category', category)
      .order('day', { ascending: true })
      .limit(1)
      .single();

    if (postError || !firstPost) {
      console.error('Failed to get first post for theme image:', postError);
      return { success: false, error: postError?.message || 'No posts found' };
    }

    console.log(`🎯 THEME IMAGE: Found first post: ${firstPost.title}`);

    // Mark as generating
    await supabase
      .from('social_media_posts')
      .update({ theme_image_generation_status: 'generating' })
      .eq('id', firstPost.id);

    // Trigger the streaming image pipeline for 4:3 theme image
    const imageResponse = await fetch(`${supabaseUrl}/functions/v1/streaming-image-pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        postId: firstPost.id,
        title: firstPost.title,
        description: firstPost.description,
        theme: firstPost.theme, // Add the theme parameter here
        category: firstPost.category,
        aspectRatio: '4:3',
        mode: 'theme',
        stream: false // Don't stream for background generation
      }),
    });

    if (imageResponse.ok) {
      const result = await imageResponse.json();
      console.log(`✅ THEME IMAGE: Generated successfully: ${result.imageUrl}`);
      
      // Update the post with theme image URL
      await supabase
        .from('social_media_posts')
        .update({
          theme_image_4_3_url: result.imageUrl,
          theme_image_generation_status: 'complete'
        })
        .eq('id', firstPost.id);

      return { success: true };
    } else {
      const errorText = await imageResponse.text();
      console.error('❌ THEME IMAGE: Generation failed:', errorText);
      
      // Mark as failed
      await supabase
        .from('social_media_posts')
        .update({ theme_image_generation_status: 'failed' })
        .eq('id', firstPost.id);
      
      return { success: false, error: errorText };
    }

  } catch (error) {
    console.error('💥 THEME IMAGE: Error in generation:', error);
    return { success: false, error: error.message };
  }
}

// Background function to generate blog post prompts
async function generateBlogPostPromptsBackground(category: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📝 BLOG POST PROMPTS: Starting generation for category: ${category}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ BLOG POST PROMPTS: Missing Supabase configuration');
      return { success: false, error: 'Missing Supabase configuration' };
    }

    // Call the ensure-post-image-prompts function
    const response = await fetch(`${supabaseUrl}/functions/v1/ensure-post-image-prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        category: category,
        userId: userId
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ BLOG POST PROMPTS: Generation completed successfully:', {
        successCount: result.successCount,
        totalPosts: result.totalPosts,
        category: category
      });
      
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error('❌ BLOG POST PROMPTS: Generation failed:', errorText);
      return { success: false, error: errorText };
    }

  } catch (error) {
    console.error('💥 BLOG POST PROMPTS: Error in generation:', error);
    return { success: false, error: error.message };
  }
}