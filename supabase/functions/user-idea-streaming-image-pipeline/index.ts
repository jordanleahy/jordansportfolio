import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { UserIdeaRequest, ThemeData, ThemePost, SupabaseClient } from '../_shared/types.ts';
import { streamingCorsHeaders, updateThemeImageStatus, sendStreamEvent } from '../_shared/utils.ts';
import { OPENAI_CONFIG } from '../_shared/config.ts';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const generateTheme = async (description: string): Promise<ThemeData> => {
  console.log('🎯 THEME GENERATION START');
  console.log('📝 Raw description received:', JSON.stringify(description));
  console.log('📏 Description length:', description?.length);
  console.log('🔍 Description details:', {
    hasNewlines: description.includes('\n'),
    hasCarriageReturns: description.includes('\r'),
    trimmed: description.trim(),
    firstChar: description.charCodeAt(0),
    lastChar: description.charCodeAt(description.length - 1)
  });

  // Clean and clamp the description
  const cleanDescription = description.trim().replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ');
  const truncatedDescription = cleanDescription.length > 1500 ? cleanDescription.slice(0, 1500) : cleanDescription;
  console.log('🧹 Cleaned description:', cleanDescription);
  if (cleanDescription.length !== truncatedDescription.length) {
    console.log(`✂️ Description truncated from ${cleanDescription.length} to ${truncatedDescription.length} chars`);
  }

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

  console.log('🤖 Calling OpenAI API...');
  console.log('🔑 OpenAI API key available:', !!openaiApiKey);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_CONFIG.DEFAULT_THEME_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a social media theme for: ${truncatedDescription}` }
        ],
        max_completion_tokens: OPENAI_CONFIG.DEFAULT_THEME_MAX_COMPLETION_TOKENS,
        response_format: { type: 'json_object' }
      }),
    });

    console.log('📡 OpenAI Response status:', response.status);
    console.log('📡 OpenAI Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 OpenAI Response data structure:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasMessage: !!data.choices?.[0]?.message,
      hasContent: !!data.choices?.[0]?.message?.content,
      usage: data.usage
    });

    // Log token usage details
    if (data.usage) {
      console.log('🎯 Token usage:', {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        maxAllowed: OPENAI_CONFIG.DEFAULT_THEME_MAX_COMPLETION_TOKENS,
        hitLimit: data.usage.completion_tokens >= OPENAI_CONFIG.DEFAULT_THEME_MAX_COMPLETION_TOKENS
      });
    }

    const generatedContent = data.choices[0].message.content.trim();
    console.log('📝 Generated content length:', generatedContent.length);
    console.log('📝 Generated content preview:', generatedContent.substring(0, 200) + '...');
    
    // Robust JSON parsing with fallbacks
    const stripCodeFences = (text: string) => {
      return text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
    };
    const tryParse = (text: string) => {
      try { return JSON.parse(text); } catch { return null; }
    };

    let parsedData = tryParse(generatedContent);
    if (!parsedData) {
      const unfenced = stripCodeFences(generatedContent);
      parsedData = tryParse(unfenced);
    }
    if (!parsedData) {
      const first = generatedContent.indexOf('{');
      const last = generatedContent.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        parsedData = tryParse(generatedContent.substring(first, last + 1));
      }
    }

    if (!parsedData) {
      console.error('❌ JSON parsing failed. Content preview:', generatedContent.substring(0, 500));
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    console.log('✅ JSON parsing successful');
    console.log('📊 Parsed data structure:', {
      hasCategory: !!parsedData.category,
      hasTheme: !!parsedData.theme,
      hasDescription: !!parsedData.theme_description,
      hasPosts: !!parsedData.posts,
      postsCount: parsedData.posts?.length,
      category: parsedData.category,
      theme: parsedData.theme
    });
    
    return parsedData;

  } catch (fetchError) {
    console.error('❌ OpenAI API fetch error:', fetchError);
    throw new Error(`OpenAI API request failed: ${fetchError.message}`);
  }
};

const importThemeToDatabase = async (supabase: SupabaseClient, themeData: ThemeData, userId: string): Promise<{ insertedCount: number; createdThemeId: string }> => {
  console.log('💾 Importing theme to database:', themeData.category);
  console.log('📋 Theme data:', { theme: themeData.theme, category: themeData.category, userId, postCount: themeData.posts.length });
  console.log('🔍 DETAILED: Database connection info:', {
    supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
    hasServiceKey: !!supabaseServiceKey,
    userIdLength: userId?.length,
    themeDataStructure: {
      hasTheme: !!themeData.theme,
      hasCategory: !!themeData.category,
      hasDescription: !!themeData.theme_description,
      postsCount: themeData.posts?.length || 0,
      firstPostStructure: themeData.posts?.[0] ? Object.keys(themeData.posts[0]) : []
    }
  });
  
  try {
    // First, create or find the theme
    console.log('🔍 Checking for existing theme with:', {
      theme_name: themeData.theme,
      category: themeData.category,
      user_id: userId
    });
    
    const { data: existingTheme, error: themeSelectError } = await supabase
      .from('themes')
      .select('id')
      .eq('theme_name', themeData.theme)
      .eq('category', themeData.category)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (themeSelectError) {
      console.error('❌ Theme selection error:', themeSelectError);
      throw new Error(`Theme selection failed: ${themeSelectError.message}`);
    }

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
      status: 'draft' as const,
      theme_image_generation_status: 'pending' as const
    }));

    console.log(`📊 Inserting ${postsToInsert.length} posts for user ${userId}`);
    console.log('📝 Sample post data:', JSON.stringify(postsToInsert[0], null, 2));
    console.log('🔍 BEFORE INSERT: Supabase client info:', {
      hasClient: !!supabase,
      clientType: typeof supabase,
      isService: !!supabaseServiceKey
    });

    // Use the service role client to bypass RLS
    console.log('🔍 ATTEMPTING INSERT: Starting database insert operation...');
    const { data, error } = await supabase
      .from('social_media_posts')
      .insert(postsToInsert)
      .select('id, category, theme_id, title');
    
    console.log('🔍 AFTER INSERT: Insert operation completed', {
      hasData: !!data,
      hasError: !!error,
      dataLength: data?.length || 0
    });

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
    console.log('🔍 PIPELINE DEBUG: Environment check:', {
      hasOpenAIKey: !!openaiApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      userIdProvided: !!userId,
      descriptionLength: description?.length || 0
    });

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
                themeId: themeId, // Pass the theme ID for more reliable lookup
                firstPostTitle: firstPost.title,
                firstPostDescription: firstPost.description
              };

              // Fire-and-forget background function call
              supabase.functions.invoke('generate-day-1-4-3', {
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
        supabase.functions.invoke('generate-day-1-4-3', {
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
      status: 200,
      headers: { ...streamingCorsHeaders, 'Content-Type': 'application/json' },
    });
  }
});