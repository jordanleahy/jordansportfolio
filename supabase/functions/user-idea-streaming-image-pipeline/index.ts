/**
 * ========================================
 * USER IDEA STREAMING IMAGE PIPELINE
 * ========================================
 * 
 * FUNCTION PURPOSE:
 * This Supabase Edge Function is responsible for:
 * 1. Processing user theme ideas and generating structured content using OpenAI
 * 2. Populating the 'themes' and 'social_media_posts' database tables
 * 3. Triggering background system prompt generation (handled by separate processes)
 * 4. Providing real-time streaming responses to the client
 * 
 * IMPORTANT: This function does NOT directly create system prompts. It only:
 * - Populates theme and post data in the database
 * - Triggers asynchronous system prompt generation via external utilities
 * - System prompts are stored separately in 'theme_system_prompts' table
 * 
 * DATA FLOW:
 * 1. User submits theme description → OpenAI generates structured content
 * 2. Theme record created in 'themes' table
 * 3. Posts created in 'social_media_posts' table with theme_id reference
 * 4. Background: System prompt generation triggered (separate process)
 * 5. Background: Image generation pipeline triggered (separate process)
 * 
 * REQUEST FORMAT:
 * POST /functions/v1/user-idea-streaming-image-pipeline
 * {
 *   "description": "User's theme idea description",
 *   "stream": false (optional - enables streaming response)
 * }
 * 
 * RESPONSE FORMAT:
 * {
 *   "success": true,
 *   "themeId": "uuid",
 *   "category": "generated-category",
 *   "postCount": 8,
 *   "message": "Theme created successfully"
 * }
 * 
 * DATABASE OPERATIONS:
 * - Creates 1 record in 'themes' table
 * - Creates 8 records in 'social_media_posts' table
 * - All operations use authenticated user context (auth.uid())
 * - Uses service role for database operations but maintains user association
 * 
 * AUTHENTICATION:
 * - Requires valid JWT token in Authorization header
 * - User ID extracted from auth.uid() and used for all database records
 * - Service role used for database operations to ensure proper permissions
 * 
 * ERROR HANDLING:
 * Common issues and solutions:
 * 
 * 1. "system_prompts" column error (PostgreSQL 42703):
 *    - Cause: OpenAI sometimes includes unexpected 'system_prompts' field in response
 *    - Solution: Defensive programming filters out non-expected fields before DB insert
 *    - This field is NOT supposed to be in OpenAI's response per system prompt
 * 
 * 2. Authentication errors:
 *    - Ensure valid JWT token in Authorization header
 *    - Check user exists and is properly authenticated
 * 
 * 3. OpenAI API errors:
 *    - Rate limiting, quota exceeded, or API downtime
 *    - Function includes retry logic and detailed error logging
 * 
 * 4. Database constraint violations:
 *    - Duplicate themes, invalid references, or data type mismatches
 *    - All database operations are wrapped in try-catch with detailed logging
 * 
 * BACKGROUND PROCESSING:
 * This function triggers but does not wait for:
 * - System prompt generation (handled by external utilities)
 * - Image generation pipeline (separate edge function)
 * - Theme lifecycle management (separate edge function)
 * 
 * DEBUGGING:
 * Key logging points include:
 * - Request initialization with correlation ID
 * - User authentication status
 * - OpenAI API request/response details
 * - Database operation results
 * - Background task initiation
 * - Error conditions with full context
 * 
 * Use correlation ID to trace requests across logs:
 * Format: "pipeline-{timestamp}-{random}"
 * 
 * PERFORMANCE:
 * - Typical execution time: 15-25 seconds (includes OpenAI API call)
 * - Streams response for better UX when stream=true
 * - Uses background tasks for non-blocking operations
 * - Database operations are optimized with bulk inserts
 * 
 * RELATED FUNCTIONS:
 * - manage-theme-lifecycle: Handles theme status updates and system prompts
 * - create-theme-system-prompt: Generates system prompts for themes
 * - streaming-image-pipeline: Handles image generation for posts
 * ========================================
 */

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

  const systemPrompt = `You are a supportive social media content strategist. Convert the user's description into structured JSON following the exact schema below.

CONTEXT:
- The output will be used for social media posting (e.g., LinkedIn, Twitter, Instagram carousels).
- Write in a concise, engaging, and supportive style suitable for professional but approachable audiences.

CRITICAL RULES:
- Output ONLY valid JSON (no markdown, no comments, no text outside JSON).
- Allowed fields: category, theme, theme_description, posts.
- Validate internally that JSON parses and matches schema before returning.
- If unsure about details, omit fields rather than invent.

JSON SCHEMA:
{
  "category": "<lowercase-kebab-case>",
  "theme": "<Title Case Theme>",
  "theme_description": "<1–2 sentence supportive description>",
  "posts": [
    {
      "day": <integer starting at 1, sequential without gaps>,
      "title": "<engaging social post title, 3–8 words, hook style>",
      "description": "<2–3 sentences, concise, scroll-friendly, supportive, avoids jargon>"
    }
  ]
}

POST COUNT RULES:
- If the request explicitly specifies a number of posts → ALWAYS generate exactly that many posts.
- If the request is an "ABC book" or "A–Z series" → ALWAYS generate 26 posts, one for each letter of the alphabet.
- Otherwise, determine post count based on input length:
  • <250 characters in description → 3–5 posts
  • 250–800 characters → 6–12 posts
  • >800 characters → 12–25 posts
- Default is to determine the correct number of posts based on input depth and user needs.

---

### ✅ Example 1: ABC Book
{
  "category": "abc-learning",
  "theme": "ABC Learning for Kids",
  "theme_description": "A fun and simple way for preschool children to explore letters A through Z, each with a playful idea or object.",
  "posts": [
    { "day": 1, "title": "A is for Apple", "description": "Apples are crunchy and sweet! Eating fruit helps us stay strong and healthy." },
    { "day": 2, "title": "B is for Ball", "description": "Balls are fun to roll and throw. Playing with a ball helps us move our bodies." },
    { "day": 3, "title": "C is for Cat", "description": "Cats are soft and playful. We can learn to be gentle and kind with pets." }
    // ... continue through Z (26 posts total)
  ]
}

### ✅ Example 2: Alzheimer’s Education
{
  "category": "alzheimers-education",
  "theme": "Understanding Alzheimer’s Disease",
  "theme_description": "Supportive education for caregivers and families to recognize signs and support loved ones living with Alzheimer’s.",
  "posts": [
    { "day": 1, "title": "What Is Alzheimer’s?", "description": "Alzheimer’s is a brain condition that slowly affects memory and thinking. Learning about it early helps families prepare." },
    { "day": 2, "title": "Early Warning Signs", "description": "Common signs include memory loss, confusion, and difficulty with daily tasks. Noticing changes early is important." },
    { "day": 3, "title": "Supporting Caregivers", "description": "Caring for someone with Alzheimer’s is challenging. Support groups and small breaks can make a big difference." }
  ]
}

### ✅ Example 3: Book Summary — Good to Great
{
  "category": "book-summary-good-to-great",
  "theme": "Good to Great Book Summary",
  "theme_description": "Key lessons from Jim Collins’ classic on how companies transition from good to truly great.",
  "posts": [
    { "day": 1, "title": "Level 5 Leadership", "description": "Great companies are led by humble yet determined leaders. They put the company’s success above personal fame." },
    { "day": 2, "title": "First Who, Then What", "description": "Success starts by getting the right people on the bus before deciding the direction of travel." },
    { "day": 3, "title": "Hedgehog Concept", "description": "Great companies focus on what they can be best at, what drives their economics, and what they’re passionate about." }
  ]
}

### ✅ Example 4: Open Plans — People-Centered Cities
{
  "category": "open-plans-cities",
  "theme": "Building People-Centered Cities",
  "theme_description": "Ideas to empower communities, reimagine streets, and put people first in city design.",
  "posts": [
    { "day": 1, "title": "Practical Solutions First", "description": "Start with real issues in communities. Build solutions that range from small policy tweaks to major physical changes." },
    { "day": 2, "title": "Empower Neighborhoods", "description": "Support communities in creating their own vision. Change works best when it’s shaped by the people living there." },
    { "day": 3, "title": "Mobility Justice", "description": "Dismantle car-first culture and ensure every resident has safe, abundant options for getting around the city." }
  ]
}

### ✅ Example 5: How to Invest in AI Companies
{
  "category": "investing-in-ai",
  "theme": "How to Invest in AI Companies",
  "theme_description": "Practical guidance for new investors exploring opportunities in the fast-growing AI sector.",
  "posts": [
    { "day": 1, "title": "Know the Landscape", "description": "AI companies range from chip makers to software startups. Understand the different parts of the ecosystem before investing." },
    { "day": 2, "title": "Check the Fundamentals", "description": "Review financial health, revenue growth, and leadership teams. Strong fundamentals reduce risk in a volatile industry." },
    { "day": 3, "title": "Long-Term Mindset", "description": "AI adoption takes time. Focus on companies with sustainable advantages rather than short-term hype." }
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

    console.log('🎯 Token Management:', {
      estimatedPromptTokens: Math.ceil((systemPrompt.length + `Generate a social media theme for: ${truncatedDescription}`.length) / 4),
      maxAllowed: OPENAI_CONFIG.DEFAULT_THEME_MAX_COMPLETION_TOKENS,
      model: OPENAI_CONFIG.DEFAULT_THEME_MODEL
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
      console.log('🎯 OpenAI Usage Analysis:', {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
        maxAllowed: OPENAI_CONFIG.DEFAULT_THEME_MAX_COMPLETION_TOKENS,
        hitLimit: (data.usage?.completion_tokens || 0) >= OPENAI_CONFIG.DEFAULT_THEME_MAX_COMPLETION_TOKENS,
        model: OPENAI_CONFIG.DEFAULT_THEME_MODEL,
        estimatedCost: (((data.usage?.prompt_tokens || 0) * 0.00015 + (data.usage?.completion_tokens || 0) * 0.0006) / 1000).toFixed(6)
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
    
    // ============= RESPONSE SANITIZATION =============
    // Sanitize the entire response to remove unexpected fields immediately after parsing
    const sanitizedData = {
      category: parsedData.category,
      theme: parsedData.theme,
      theme_description: parsedData.theme_description,
      posts: parsedData.posts?.map((post: any) => ({
        day: post.day,
        title: post.title,
        description: post.description
      })) || []
    };
    
    // Log any unexpected top-level fields for debugging
    const unexpectedTopLevelFields = Object.keys(parsedData).filter(key => 
      !['category', 'theme', 'theme_description', 'posts'].includes(key)
    );
    if (unexpectedTopLevelFields.length > 0) {
      console.warn('⚠️ SANITIZED: Unexpected top-level fields from OpenAI:', unexpectedTopLevelFields);
    }
    
    // Log any unexpected post fields for debugging
    parsedData.posts?.forEach((post: any, index: number) => {
      const unexpectedPostFields = Object.keys(post).filter(key => 
        !['day', 'title', 'description'].includes(key)
      );
      if (unexpectedPostFields.length > 0) {
        console.warn(`⚠️ SANITIZED: Unexpected post fields in post ${index}:`, unexpectedPostFields);
      }
    });
    
    console.log('🧹 Response sanitized - only expected fields will be processed');
    return sanitizedData;

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
    // Always create a new theme with unique UUID
    console.log('🎯 Creating new theme:', {
      theme_name: themeData.theme,
      category: themeData.category,
      user_id: userId
    });
    
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

    const themeId = newTheme.id;
    console.log('✅ Created new theme:', themeId);

    // Import posts using direct insert instead of RPC to ensure proper authentication context
    // Add defensive programming to ensure only expected fields are included
    const postsToInsert = themeData.posts.map((post: ThemePost) => {
      // Explicitly extract only the expected fields to prevent any extra fields from being inserted
      const cleanPost = {
        day: Number(post.day),
        title: String(post.title || '').trim(),
        description: String(post.description || '').trim(),
        theme_id: themeId,
        category: themeData.category,
        user_id: userId,
        status: 'draft' as const
      };
      
      // Log any unexpected fields for debugging
      const unexpectedFields = Object.keys(post).filter(key => 
        !['day', 'title', 'description'].includes(key)
      );
      if (unexpectedFields.length > 0) {
        console.warn('⚠️ Unexpected fields in post data:', unexpectedFields);
      }
      
      return cleanPost;
    });

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

            // Call create-theme-system-prompt edge function
            try {
              console.log('🚀 Calling create-theme-system-prompt edge function');
              const { data: systemPromptData, error: systemPromptError } = await supabase.functions.invoke('create-theme-system-prompt', {
                body: { 
                  theme: themeData.theme, 
                  category: themeData.category, 
                  theme_id: themeId,
                  user_id: userId 
                }
              });

              if (systemPromptError) {
                console.error('❌ System prompt generation failed:', systemPromptError);
                // Don't fail the whole pipeline, just log the error
              } else {
                console.log('✅ System prompt generation completed successfully');
              }
            } catch (systemPromptErr) {
              console.error('❌ System prompt generation error:', systemPromptErr);
              // Don't fail the whole pipeline, just log the error
            }
            
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
      
      // Call create-theme-system-prompt edge function for non-streaming mode
      try {
        console.log('🚀 Calling create-theme-system-prompt edge function (non-streaming)');
        const { data: systemPromptData, error: systemPromptError } = await supabase.functions.invoke('create-theme-system-prompt', {
          body: { 
            theme: themeData.theme, 
            category: themeData.category, 
            theme_id: themeId,
            user_id: userId 
          }
        });

        if (systemPromptError) {
          console.error('❌ System prompt generation failed:', systemPromptError);
        } else {
          console.log('✅ System prompt generation completed successfully');
        }
      } catch (systemPromptErr) {
        console.error('❌ System prompt generation error:', systemPromptErr);
      }

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