import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { UserIdeaRequest, ThemeData, ThemePost, SupabaseClient } from '../_shared/types.ts';
import { streamingCorsHeaders, updateThemeImageStatus, sendStreamEvent } from '../_shared/utils.ts';
import { OPENAI_CONFIG } from '../_shared/config.ts';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Generate correlation ID for request tracking
const generateCorrelationId = (): string => {
  return `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Structured logger with correlation context
class RequestLogger {
  private correlationId: string;
  private userId: string | null;
  private startTime: number;
  private context: Record<string, any>;

  constructor(correlationId: string, userId: string | null = null) {
    this.correlationId = correlationId;
    this.userId = userId;
    this.startTime = Date.now();
    this.context = {
      correlationId,
      userId,
      timestamp: new Date().toISOString(),
      function: 'user-idea-streaming-image-pipeline'
    };
  }

  log(level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG', message: string, data?: any) {
    const logEntry = {
      ...this.context,
      level,
      message,
      data,
      elapsedMs: Date.now() - this.startTime
    };
    
    const prefix = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : level === 'DEBUG' ? '🔍' : '✅';
    console.log(`${prefix} [${this.correlationId}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  error(message: string, error: any, context?: any) {
    this.log('ERROR', message, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      requestDuration: Date.now() - this.startTime
    });
  }

  performance(operation: string, duration: number, metadata?: any) {
    this.log('INFO', `Performance: ${operation}`, {
      operation,
      durationMs: duration,
      metadata
    });
  }
}

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

  const systemPrompt = `You are a supportive content strategist. Convert the user's description into a clean JSON theme plan.

Private Safe Space principles:
- Write with empathy, encouragement, and zero judgment
- Respect privacy: do not include names, locations, or any personally identifying details
- Keep language inclusive, trauma-informed, and stigma-free

Guidelines:
- Return ONLY valid JSON (no markdown, no commentary)
- category must be lowercase-kebab-case (e.g., "type-1-diabetes")
- theme should be title case
- Generate optimal number of posts (1-100) based on content depth and user needs
- Each post: day (number), title (engaging, supportive), description (2–3 concise, helpful sentences)
- Keep content practical and approachable

POST COUNT STRATEGY - Choose what serves the user best:
- Quick guidance or simple topics: 3-5 posts
- Standard educational series: 5-10 posts
- Comprehensive support guides: 10-20 posts
- Deep-dive or complex topics: 20+ posts (up to 100)
- Consider natural content flow and user engagement patterns

JSON STRUCTURE:
{
  "category": "lowercase-category-name",
  "theme": "Professional Theme Title",
  "theme_description": "Brief description of the theme focus (1–2 sentences, supportive tone)",
  "posts": [
    {
      "day": 1,
      "title": "Supportive Post Title",
      "description": "Helpful, compassionate guidance. Avoid directives that feel clinical."
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
        const code = (themeInsertError as any)?.code;
        if (code === '23505' || (themeInsertError as any)?.message?.includes('duplicate key value')) {
          throw {
            type: 'duplicate_theme',
            code: '23505',
            message: 'A theme with this category already exists for your account.',
            details: themeInsertError,
            category: themeData.category,
            theme: themeData.theme
          } as const;
        }
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
      status: 'draft' as const
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
    
    return { insertedCount: data.length, createdThemeId: themeId };
    
  } catch (error) {
    console.error('❌ Import theme error:', error);
    console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    throw error;
  }
};

const generateSystemPrompt = async (supabase: SupabaseClient, themeData: ThemeData, userId: string, themeId: string): Promise<void> => {
  console.log('🤖 Generating system prompt for theme:', themeData.theme);

  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 240000; // Increased to 240 seconds (4 minutes) to match invoke-system-prompt-agent timeout
  const SLEEP = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const invokeOnce = async () => {
    return await supabase.functions.invoke('invoke-system-prompt-agent', {
      body: {
        theme: themeData.theme,
        category: themeData.category,
        description: themeData.theme_description,
        sample_posts: themeData.posts.slice(0, 3), // First 3 posts as samples
        user_id: userId,
        theme_id: themeId, // Pass theme_id for proper linking
        skip_ensure: true, // decouple follow-up work from this call
      },
    });
  };

  let attempt = 0;
  let succeeded = false;
  let lastError: any = null;

  while (attempt <= MAX_RETRIES && !succeeded) {
    attempt++;
    const start = Date.now();
    console.log(`🏁 System prompt attempt ${attempt}/${MAX_RETRIES + 1}`);

    const resultOrTimeout = await Promise.race([
      invokeOnce().then((res) => ({ kind: 'result' as const, res })),
      SLEEP(TIMEOUT_MS).then(() => ({ kind: 'timeout' as const })),
    ]);

    if (resultOrTimeout.kind === 'timeout') {
      console.warn('⏱️ invoke-system-prompt-agent timed out (soft timeout)');
      lastError = new Error('timeout');
    } else {
      const { res } = resultOrTimeout;
      if (!res.error) {
        console.log('✅ System prompt function returned 2xx');
        succeeded = true;
        break;
      }
      console.warn('⚠️ System prompt function error:', res.error);
      lastError = res.error;
    }

    // Exponential backoff before retrying
    const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
    console.log(`🔁 Retrying after ${backoff}ms`);
    await SLEEP(backoff);
  }

  // If still not succeeded, poll DB to see if the prompt actually got created
  if (!succeeded) {
    console.log('🔎 Falling back to DB poll for newly created system prompt');
    const maxPolls = 3; // Reduced polling attempts
    for (let i = 0; i < maxPolls; i++) {
      const { data, error } = await supabase
        .from('system_prompts')
        .select('id, created_at, theme_id')
        .eq('user_id', userId)
        .eq('category', themeData.category)
        .or(`theme.eq.${themeData.theme},theme_id.eq.${themeId}`) // Check both theme name and theme_id
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ DB poll error while checking system_prompts:', error);
      }
      if (data?.id) {
        console.log('✅ Found system prompt via DB poll:', data.id);
        succeeded = true;
        break;
      }

      await SLEEP(1500); // Reduced poll delay
    }
  }

  if (!succeeded) {
    console.warn('⚠️ System prompt generation did not confirm; continuing pipeline gracefully', {
      lastError: lastError?.message || String(lastError),
    });
    // Still continue to trigger background image generation
  }

  // Trigger ensure-post-image-prompts in the background with proper error handling
  console.log('🎨 Triggering ensure-post-image-prompts in background');
  
  EdgeRuntime.waitUntil((async () => {
    try {
      const ensureRes = await supabase.functions.invoke('ensure-post-image-prompts', {
        body: {
          category: themeData.category,
          userId,
        },
      });
      if (ensureRes.error) {
        console.warn('⚠️ ensure-post-image-prompts warning:', ensureRes.error);
      } else {
        console.log('✅ ensure-post-image-prompts queued/success:', ensureRes.data);
      }
    } catch (e) {
      console.error('⚠️ Background ensure task failed:', e);
    }
  })());
};


serve(async (req) => {
  // Generate correlation ID for request tracking
  const correlationId = generateCorrelationId();
  const requestStart = Date.now();
  
  // Extract user agent and IP for debugging context
  const userAgent = req.headers.get('User-Agent') || 'unknown';
  const clientIP = req.headers.get('CF-Connecting-IP') || 
                   req.headers.get('X-Forwarded-For') || 
                   req.headers.get('X-Real-IP') || 'unknown';
  
  // Initialize logger without userId first
  let logger = new RequestLogger(correlationId);
  
  logger.log('INFO', 'Request received', {
    method: req.method,
    userAgent,
    clientIP,
    timestamp: new Date().toISOString()
  });
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logger.log('INFO', 'CORS preflight request handled');
    return new Response(null, { headers: streamingCorsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body first for proper validation
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      logger.error('JSON parsing failed', parseError, { requestSize: req.headers.get('Content-Length') });
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
        correlationId
      }), {
        status: 400,
        headers: { ...streamingCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { description, stream = true, overrideCategory } = requestBody;

    // Validate required fields
    if (!description || typeof description !== 'string' || !description.trim()) {
      logger.error('Validation failed: Invalid description', null, { 
        description: description?.substring(0, 100),
        type: typeof description 
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Description is required and must be a non-empty string',
        correlationId
      }), {
        status: 400,
        headers: { ...streamingCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get authenticated user from the request
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const authStart = Date.now();
      const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      logger.performance('Authentication', Date.now() - authStart);
      
      if (authError || !user) {
        logger.error('Authentication failed', authError, { hasAuthHeader: !!authHeader });
        return new Response(JSON.stringify({
          success: false,
          error: 'User not authenticated',
          correlationId
        }), {
          status: 401,
          headers: { ...streamingCorsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
      
      // Update logger with user context
      logger = new RequestLogger(correlationId, userId);
      logger.log('INFO', 'User authenticated successfully', { userId });
    } else {
      logger.error('Missing authorization header', null);
      return new Response(JSON.stringify({
        success: false,
        error: 'Authorization header required',
        correlationId
      }), {
        status: 401,
        headers: { ...streamingCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openaiApiKey) {
      logger.error('OpenAI API key not configured', null);
      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API key not configured',
        correlationId
      }), {
        status: 500,
        headers: { ...streamingCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logger.log('INFO', 'Pipeline initialization complete', {
      descriptionLength: description.length,
      streamMode: stream,
      environment: {
        hasOpenAIKey: !!openaiApiKey,
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }
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

            // Use EdgeRuntime.waitUntil to run system prompt generation in background
            EdgeRuntime.waitUntil(generateSystemPrompt(supabase, themeData, userId, createdThemeId));
            
            sendStreamEvent(controller, {
              type: 'system_prompt_complete',
              progress: 60,
              data: { promptGenerated: true }
            });

            // Step 4: Set posts to generating status (80% progress)
            sendStreamEvent(controller, {
              type: 'posts_status_update',
              progress: 70,
              data: { status: 'Posts created successfully' }
            });

            // Step 5: Trigger background image generation (85% progress)

            // Step 6: Pipeline Complete (100% progress)
            sendStreamEvent(controller, {
              type: 'pipeline_complete',
              progress: 100,
              data: {
                success: true,
                category: themeData.category,
                theme: themeData.theme,
                postCount: insertedCount,
                message: 'Theme created successfully!'
              }
            });

            controller.close();

          } catch (error) {
            logger.error('Pipeline streaming error', error, {
              step: 'streaming_pipeline',
              themeId: themeId || 'unknown'
            });
            sendStreamEvent(controller, {
              type: 'pipeline_error',
              progress: 0,
              error: error.message,
              correlationId
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
      // Apply overrideCategory if provided
      if (overrideCategory && typeof overrideCategory === 'string') {
        const slug = overrideCategory.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (slug) {
          themeData.category = slug;
        }
      }
      const { insertedCount, createdThemeId } = await importThemeToDatabase(supabase, themeData, userId);
      const themeId = createdThemeId;
      // Use EdgeRuntime.waitUntil to run system prompt generation in background
      EdgeRuntime.waitUntil(generateSystemPrompt(supabase, themeData, userId, themeId));

      logger.performance('Total request', Date.now() - requestStart, {
        theme: themeData.theme,
        category: themeData.category,
        postCount: insertedCount
      });

      return new Response(JSON.stringify({
        success: true,
        theme_id: themeId,
        category: themeData.category,
        theme: themeData.theme,
        postCount: insertedCount,
        message: 'Theme created successfully!'
      }), {
        headers: { ...streamingCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    logger.error('Pipeline fatal error', error, {
      step: 'main_pipeline',
      requestDuration: Date.now() - requestStart
    });

    const isDuplicate = error?.code === '23505' || error?.type === 'duplicate_theme' || (error?.message || '').includes('duplicate key value');

    const responseBody: Record<string, any> = {
      success: false,
      error: isDuplicate ? 'A theme with this category already exists.' : (error?.message || 'Unexpected error'),
      type: isDuplicate ? 'duplicate_theme' : 'unknown_error',
      category: error?.category,
      theme: error?.theme,
      details: isDuplicate ? error?.details : undefined,
      correlationId
    };

    return new Response(JSON.stringify(responseBody), {
      status: isDuplicate ? 409 : 500,
      headers: { ...streamingCorsHeaders, 'Content-Type': 'application/json' },
    });
  }
});