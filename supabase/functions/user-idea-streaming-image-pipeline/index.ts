import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { UserIdeaRequest, ThemeData, ThemePost, SupabaseClient } from '../_shared/types.ts';
import { streamingCorsHeaders, updateThemeImageStatus, sendStreamEvent } from '../_shared/utils.ts';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const generateTheme = async (description: string): Promise<ThemeData> => {
  console.log('🎯 Generating theme for description:', description);

  const systemPrompt = `You are a professional social media content strategist. Convert user descriptions into structured theme JSON for social media calendar generation.

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no explanations or markdown
- Category must be lowercase, no spaces, use hyphens for separation
- Theme should be title case with proper spacing
- Generate exactly 10 posts with days 1-10
- Each post needs: day (number), title (engaging, professional), description (informative, 2-3 sentences)
- All content should be professional and industry-appropriate

JSON STRUCTURE REQUIRED:
{
  "category": "lowercase-category-name",
  "theme": "Professional Theme Title",
  "theme_description": "Brief description of the theme focus",
  "posts": [
    {
      "day": 1,
      "title": "Engaging Post Title",
      "description": "Professional description explaining the topic clearly and providing value. Keep it informative and actionable."
    }
  ]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a social media theme for: ${description}` }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const generatedContent = data.choices[0].message.content.trim();
  
  return JSON.parse(generatedContent);
};

const importThemeToDatabase = async (supabase: SupabaseClient, themeData: ThemeData, userId: string): Promise<{ insertedCount: number; createdThemeId: string }> => {
  console.log('💾 Importing theme to database:', themeData.category);
  console.log('📋 Theme data:', { theme: themeData.theme, category: themeData.category, userId, postCount: themeData.posts.length });
  
  try {
    // First, create or find the theme
    const { data: existingTheme, error: themeSelectError } = await supabase
      .from('themes')
      .select('id')
      .eq('theme_name', themeData.theme)
      .eq('category', themeData.category)
      .eq('user_id', userId)
      .maybeSingle();

    let themeId: string;

    if (existingTheme) {
      themeId = existingTheme.id;
      console.log('🔍 Found existing theme:', themeId);
    } else {
      // Create new theme
      const { data: newTheme, error: themeInsertError } = await supabase
        .from('themes')
        .insert({
          user_id: userId,
          theme_name: themeData.theme,
          description: themeData.theme_description,
          category: themeData.category
        })
        .select('id')
        .single();

      if (themeInsertError) {
        console.error('❌ Theme creation error:', themeInsertError);
        throw new Error(`Theme creation failed: ${themeInsertError.message}`);
      }

      themeId = newTheme.id;
      console.log('✅ Created new theme:', themeId);
    }

    // Import posts using direct insert instead of RPC to ensure proper authentication context
    const postsToInsert = themeData.posts.map((post: ThemePost) => ({
      day: post.day,
      title: post.title,
      description: post.description,
      theme_id: themeId,
      category: themeData.category,
      user_id: userId,
      status: 'draft',
      theme_image_generation_status: 'pending'
    }));

    console.log(`📊 Inserting ${postsToInsert.length} posts for user ${userId}`);
    console.log('📝 Sample post data:', JSON.stringify(postsToInsert[0], null, 2));

    // Use the service role client to bypass RLS
    const { data, error } = await supabase
      .from('social_media_posts')
      .insert(postsToInsert)
      .select('id, category, theme_id, title');

    if (error) {
      console.error('❌ Database insert error:', JSON.stringify(error, null, 2));
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Database import failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.error('❌ No data returned from insert operation');
      throw new Error('No posts were created - database insert returned empty result');
    }

    console.log(`✅ Successfully imported ${data.length} posts for theme: ${themeData.theme}`);
    console.log('📊 Imported posts:', data.map(p => ({ id: p.id, theme_id: p.theme_id, title: p.title })));
    
    // Verify posts were actually created by querying them back
    const { data: verification, error: verifyError } = await supabase
      .from('social_media_posts')
      .select('id, theme_id, category, title')
      .eq('theme_id', themeId)
      .eq('user_id', userId);
    
    if (verifyError) {
      console.warn('⚠️ Could not verify posts were created:', verifyError);
    } else {
    console.log(`🔍 Verification: Found ${verification?.length || 0} posts in database for theme: ${themeData.theme}`);
    }
    
    return { insertedCount: data.length, createdThemeId: themeId };
    
  } catch (error) {
    console.error('❌ Import theme error:', error);
    console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    throw error;
  }
};

const generateSystemPrompt = async (supabase: SupabaseClient, themeData: ThemeData, userId: string): Promise<void> => {
  console.log('🤖 Generating system prompt for theme:', themeData.theme);
  
  const { error } = await supabase.functions.invoke('invoke-system-prompt-agent', {
    body: {
      theme: themeData.theme,
      category: themeData.category,
      description: themeData.theme_description,
      sample_posts: themeData.posts.slice(0, 3), // First 3 posts as samples
      user_id: userId
    }
  });

  if (error) {
    console.warn('System prompt generation warning:', error);
    // Non-critical error, continue pipeline
  }
};


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: streamingCorsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authenticated user from the request
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (authError || !user) {
        throw new Error('User not authenticated');
      }
      userId = user.id;
      console.log('🔐 Authenticated user:', userId);
    }

    const { description, stream = true } = await req.json();

    if (!description || !userId) {
      throw new Error('Description and authentication required');
    }

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

console.log(`🚀 Starting user idea pipeline for: ${description.substring(0, 50)}...`);
    console.log('🔧 Using updated pipeline v2.0 with proper theme table integration');

    if (stream) {
      const streamResponse = new ReadableStream({
        async start(controller) {
          let themeId: string;
          try {
            // Step 1: Generate Theme (20% progress)
            sendStreamEvent(controller, {
              type: 'theme_generation_start',
              progress: 10,
              data: { status: 'Generating theme and posts...' }
            });

            const themeData = await generateTheme(description);
            
            sendStreamEvent(controller, {
              type: 'theme_generation_complete',
              progress: 20,
              data: { 
                theme: themeData.theme,
                category: themeData.category,
                postCount: themeData.posts.length
              }
            });

            // Step 2: Import to Database (40% progress)
            sendStreamEvent(controller, {
              type: 'database_import_start',
              progress: 25,
              data: { status: 'Importing posts to database...' }
            });

            const { insertedCount, createdThemeId } = await importThemeToDatabase(supabase, themeData, userId);
            themeId = createdThemeId;
            
            sendStreamEvent(controller, {
              type: 'database_import_complete',
              progress: 40,
              data: { insertedCount }
            });

            // Step 3: Generate System Prompt (60% progress)
            sendStreamEvent(controller, {
              type: 'system_prompt_start',
              progress: 45,
              data: { status: 'Generating AI system prompts...' }
            });

            await generateSystemPrompt(supabase, themeData, userId);
            
            sendStreamEvent(controller, {
              type: 'system_prompt_complete',
              progress: 60,
              data: { promptGenerated: true }
            });

            // Step 4: Set posts to generating status (80% progress)
            sendStreamEvent(controller, {
              type: 'posts_status_update',
              progress: 70,
              data: { status: 'Setting posts to generating status...' }
            });

            // Update posts to generating status (no longer waiting for image)
            const { error: statusError } = await supabase
              .from('social_media_posts')
              .update({ 
                theme_image_generation_status: 'generating',
                updated_at: new Date().toISOString()
              })
              .eq('theme_id', themeId)
              .eq('user_id', userId);

            if (statusError) {
              console.error('❌ Error updating post status:', statusError);
            } else {
              console.log(`✅ Updated posts to status 'generating' for theme: ${themeData.theme}`);
            }

            sendStreamEvent(controller, {
              type: 'posts_status_updated',
              progress: 80,
              data: { status: 'Posts marked as generating' }
            });

            // Step 5: Trigger background image generation (90% progress)
            sendStreamEvent(controller, {
              type: 'background_trigger_start',
              progress: 85,
              data: { status: 'Starting background image generation...' }
            });

            // Trigger background image generation (fire-and-forget)
            try {
              const firstPost = themeData.posts[0];
              const backgroundRequest = {
                theme: themeData.theme,
                category: themeData.category,
                userId: userId,
                firstPostTitle: firstPost.title,
                firstPostDescription: firstPost.description
              };

              // Fire-and-forget background function call
              supabase.functions.invoke('generate-theme-image-background', {
                body: backgroundRequest
              }).then(({ error: bgError }) => {
                if (bgError) {
                  console.error('❌ Background image generation failed to start:', bgError);
                } else {
                  console.log('✅ Background image generation started successfully');
                }
              });

              console.log('🔥 Triggered background image generation for theme:', themeData.theme);
            } catch (bgTriggerError) {
              console.error('❌ Error triggering background function:', bgTriggerError);
              // Don't fail the main pipeline if background trigger fails
            }

            sendStreamEvent(controller, {
              type: 'background_trigger_complete',
              progress: 90,
              data: { status: 'Background generation started' }
            });

            // Step 6: Pipeline Complete (100% progress)
            sendStreamEvent(controller, {
              type: 'pipeline_complete',
              progress: 100,
              data: {
                success: true,
                category: themeData.category,
                theme: themeData.theme,
                postCount: insertedCount,
                message: 'Theme created successfully! Image generation continues in background.',
                backgroundProcessing: true
              }
            });

            controller.close();

          } catch (error) {
            console.error('Pipeline error:', error);
            sendStreamEvent(controller, {
              type: 'pipeline_error',
              progress: 0,
              error: error.message
            });
            controller.close();
          }
        }
      });

      return new Response(streamResponse, {
        headers: {
          ...streamingCorsHeaders,
          'Content-Type': 'text/event-stream',
        },
      });
    } else {
      // Non-streaming response (updated to use background processing)
      const themeData = await generateTheme(description);
      const { insertedCount, createdThemeId } = await importThemeToDatabase(supabase, themeData, userId);
      const themeId = createdThemeId;
      await generateSystemPrompt(supabase, themeData, userId);
      
      // Set posts to generating status
      const { error: statusError } = await supabase
        .from('social_media_posts')
        .update({ 
          theme_image_generation_status: 'generating',
          updated_at: new Date().toISOString()
        })
        .eq('theme_id', themeId)
        .eq('user_id', userId);

      if (statusError) {
        console.error('❌ Error updating post status:', statusError);
      } else {
        console.log(`✅ Updated posts to status 'generating' for theme: ${themeData.theme}`);
      }

      // Trigger background image generation (fire-and-forget)
      try {
        const firstPost = themeData.posts[0];
        const backgroundRequest = {
          theme: themeData.theme,
          category: themeData.category,
          userId: userId,
          firstPostTitle: firstPost.title,
          firstPostDescription: firstPost.description
        };

        // Fire-and-forget background function call
        supabase.functions.invoke('generate-theme-image-background', {
          body: backgroundRequest
        }).then(({ error: bgError }) => {
          if (bgError) {
            console.error('❌ Background image generation failed to start:', bgError);
          } else {
            console.log('✅ Background image generation started successfully');
          }
        });

        console.log('🔥 Triggered background image generation for theme:', themeData.theme);
      } catch (bgTriggerError) {
        console.error('❌ Error triggering background function:', bgTriggerError);
        // Don't fail the main pipeline if background trigger fails
      }

      return new Response(JSON.stringify({
        success: true,
        category: themeData.category,
        theme: themeData.theme,
        postCount: insertedCount,
        message: 'Theme created successfully! Image generation continues in background.',
        backgroundProcessing: true
      }), {
        headers: { ...streamingCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Pipeline error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...streamingCorsHeaders, 'Content-Type': 'application/json' },
    });
  }
});