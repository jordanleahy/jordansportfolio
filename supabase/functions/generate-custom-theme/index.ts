/**
 * EDGE FUNCTION: Generate Custom Theme
 * 
 * PURPOSE:
 * Creates complete social media content themes from user descriptions using AI.
 * Generates structured theme data including category classification, theme naming,
 * and AI-determined optimal number of posts (1-100) with professional content for social media calendars.
 * 
 * INPUTS:
 * - description: string - User's theme description or content idea
 * 
 * OUTPUTS:
 * - Success: { success: true, themeData: object, message: string }
 * - Error: { success: false, error: string }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-5 for theme and content generation)
 * - Supabase (optional database persistence for authenticated users)
 * - OpenAI model shared configuration (_shared/config.ts)
 * 
 * USAGE:
 * Called from: Theme creation workflows, content planning tools, social media calendar generation
 * Authentication: Optional - supports both public generation and authenticated database persistence
 * 
 * CONFIGURATION:
 * Uses shared configuration constants for:
 * - OpenAI model: OPENAI_CONFIG.DEFAULT_THEME_MODEL (gpt-5-mini-2025-08-07)
 * - Token limit: OPENAI_CONFIG.DEFAULT_THEME_MAX_COMPLETION_TOKENS (7000)
 * - API endpoints: API_ENDPOINTS.OPENAI.CHAT_COMPLETIONS
 * - Error messages: ERROR_MESSAGES constants
 * 
 * IMPORTANT: OpenAI API Guidelines for this function
 * 
 * ✅ REQUIRED MODELS: Use GPT-5 family only (configured via shared config)
 * - gpt-5-2025-08-07 (flagship)
 * - gpt-5-mini-2025-08-07 (default for themes)  
 * - gpt-5-nano-2025-08-07 (fastest)
 * 
 * ❌ NEVER USE: GPT-4 models (gpt-4, gpt-4o, gpt-4.1, etc.)
 * ❌ NEVER USE: temperature parameter (not supported in GPT-5)
 * ❌ NEVER USE: max_tokens parameter (use max_completion_tokens instead)
 * 
 * FLOW:
 * 1. Validate environment variables (OpenAI API key, optional Supabase config)
 * 2. Parse request body and validate description input
 * 3. Extract optional user authentication from JWT token
 * 4. Apply detailed system prompt allowing AI to determine optimal post count (1-100)
 * 5. Generate complete theme using OpenAI with configured model and token limits
 * 6. Parse and validate generated JSON for required fields and post structure
 * 7. Verify each post has day, title, and description fields
 * 8. If user is authenticated, persist theme and posts to Supabase database
 * 9. Return structured theme data ready for import into content management systems
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  OPENAI_CONFIG, 
  API_ENDPOINTS, 
  ERROR_MESSAGES, 
  HTTP_CONFIG 
} from '../_shared/config.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [generate-custom-theme] Function started');
    
    // DETAILED ENVIRONMENT DEBUGGING
    console.log('🔍 [DEBUG] Environment variable check:');
    const envKeys = [
      'OPENAI_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_ANON_KEY'
    ];
    
    envKeys.forEach(key => {
      const value = Deno.env.get(key);
      if (value) {
        console.log(`✅ [DEBUG] ${key}: EXISTS (length: ${value.length}, starts with: ${value.substring(0, 8)}...)`);
      } else {
        console.log(`❌ [DEBUG] ${key}: NOT FOUND or EMPTY`);
      }
    });

    // List all available environment variables (keys only for security)
    console.log('🔍 [DEBUG] Available environment variables:');
    const allEnvKeys = Object.keys(Deno.env.toObject());
    console.log('Available env keys:', allEnvKeys.sort());
    
    // Detailed OpenAI API key check
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('🔑 [DEBUG] OpenAI API Key detailed analysis:');
    console.log(`- Value type: ${typeof openAIApiKey}`);
    console.log(`- Is null: ${openAIApiKey === null}`);
    console.log(`- Is undefined: ${openAIApiKey === undefined}`);
    console.log(`- Is empty string: ${openAIApiKey === ''}`);
    console.log(`- Truthiness: ${!!openAIApiKey}`);
    
    if (openAIApiKey) {
      console.log(`- Length: ${openAIApiKey.length}`);
      console.log(`- Starts with 'sk-': ${openAIApiKey.startsWith('sk-')}`);
      console.log(`- First 10 chars: ${openAIApiKey.substring(0, 10)}...`);
    }
    
    if (!openAIApiKey) {
      console.log('❌ [generate-custom-theme] OpenAI API key not configured');
      console.log('❌ [DEBUG] Terminating due to missing OpenAI API key');
      throw new Error(ERROR_MESSAGES.OPENAI_API_KEY_MISSING);
    }

    console.log('✅ [DEBUG] OpenAI API key validation passed');

    // Initialize Supabase client with proper validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔍 [DEBUG] Supabase configuration:');
    console.log(`- URL exists: ${!!supabaseUrl}`);
    console.log(`- Service key exists: ${!!supabaseKey}`);
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ [generate-custom-theme] Supabase configuration missing');
      throw new Error('Supabase configuration not found');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT if provided (optional for this function)
    const authHeader = req.headers.get('Authorization');
    let user = null;
    if (authHeader) {
      const { data: { user: authUser } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      user = authUser;
    }

    const { description, provider = 'openai', theme_id } = await req.json();
    console.log('📝 [generate-custom-theme] Received description:', description);
    console.log('🎯 [generate-custom-theme] Using provider:', provider);
    if (theme_id) {
      console.log('🆔 [generate-custom-theme] Updating existing theme ID:', theme_id);
    }

    if (!description || description.trim().length === 0) {
      console.log('❌ [generate-custom-theme] No description provided');
      throw new Error('Theme description is required');
    }

    console.log('🎯 [generate-custom-theme] Generating custom theme for description:', description);

    const systemPrompt = `You are a professional social media content strategist. Convert user descriptions into structured theme JSON for social media calendar generation.

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no explanations or markdown
- Category must be lowercase, no spaces, use hyphens for separation
- Theme should be title case with proper spacing
- Generate optimal number of posts (1-100) based on content complexity and user needs
- Each post needs: day (number), title (engaging, professional), description (informative, 2-3 sentences)
- All content should be professional and industry-appropriate

POST COUNT GUIDELINES - Let AI determine the best number:
- Simple topics or quick tips: 3-5 posts
- Standard educational content: 5-10 posts
- Comprehensive guides: 10-20 posts
- In-depth series or complex topics: 20+ posts (up to 100)
- Consider natural content breaking points and audience engagement patterns

JSON STRUCTURE REQUIRED:
{
  "category": "lowercase-category-name",
  "theme": "Professional Theme Title",
  "description": "Brief description of the theme focus",
  "posts": [
    {
      "day": 1,
      "title": "Engaging Post Title",
      "description": "Professional description explaining the topic clearly and providing value. Keep it informative and actionable."
    }
  ]
}

EXAMPLES:
User: "AI in healthcare for doctors"
Output: {"category": "ai-healthcare", "theme": "AI in Healthcare", "description": "Comprehensive guide to AI applications transforming healthcare delivery and patient outcomes", "posts": [...15-20 posts for comprehensive coverage...]}

User: "Marketing tips for small business"
Output: {"category": "small-business-marketing", "theme": "Small Business Marketing", "description": "Essential marketing strategies and tactics for growing small businesses", "posts": [...8-12 posts for practical coverage...]}`;

    console.log('🤖 [generate-custom-theme] Calling OpenAI API');
    console.log('🔍 [DEBUG] OpenAI API call details:');
    console.log(`- Endpoint: ${API_ENDPOINTS.OPENAI.CHAT_COMPLETIONS}`);
    console.log(`- Model: ${OPENAI_CONFIG.DEFAULT_THEME_MODEL}`);
    console.log(`- Max completion tokens: ${OPENAI_CONFIG.DEFAULT_THEME_MAX_COMPLETION_TOKENS}`);
    console.log(`- API key starts with: ${openAIApiKey.substring(0, 15)}...`);
    console.log(`- Request payload preview: description="${description.substring(0, 50)}..."`);
    
    const requestBody = {
      model: OPENAI_CONFIG.DEFAULT_THEME_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a social media theme for: ${description}` }
      ],
      max_completion_tokens: OPENAI_CONFIG.DEFAULT_THEME_MAX_COMPLETION_TOKENS,
    };
    
    console.log('🔍 [DEBUG] Full request body (without system prompt):');
    console.log(JSON.stringify({ 
      ...requestBody, 
      messages: [
        { role: 'system', content: '[SYSTEM PROMPT HIDDEN FOR BREVITY]' },
        requestBody.messages[1]
      ]
    }, null, 2));

    const response = await fetch(API_ENDPOINTS.OPENAI.CHAT_COMPLETIONS, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 [generate-custom-theme] OpenAI response status:', response.status);
    console.log('🔍 [DEBUG] Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [generate-custom-theme] OpenAI API error details:');
      console.error('- Status:', response.status);
      console.error('- Status text:', response.statusText);
      console.error('- Error body:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    console.log('✅ [DEBUG] OpenAI API response successful, parsing JSON...');
    const data = await response.json();
    console.log('🔍 [DEBUG] OpenAI response structure:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      firstChoiceHasMessage: !!data.choices?.[0]?.message,
      firstChoiceHasContent: !!data.choices?.[0]?.message?.content,
      usage: data.usage
    });
    
    const generatedContent = data.choices[0].message.content.trim();

    console.log('📄 [generate-custom-theme] Generated content:', generatedContent);

    // Parse and validate the JSON
    console.log('🔍 [generate-custom-theme] Parsing generated JSON');
    let themeData;
    try {
      themeData = JSON.parse(generatedContent);
      console.log('✅ [generate-custom-theme] JSON parsed successfully:', themeData);
    } catch (parseError) {
      console.error('❌ [generate-custom-theme] Failed to parse generated JSON:', parseError);
      throw new Error('Generated content is not valid JSON');
    }

    // Basic validation
    console.log('🔍 [generate-custom-theme] Validating theme data structure');
    if (!themeData.category || !themeData.theme || !themeData.posts || !Array.isArray(themeData.posts)) {
      console.log('❌ [generate-custom-theme] Missing required fields:', {
        hasCategory: !!themeData.category,
        hasTheme: !!themeData.theme,
        hasPosts: !!themeData.posts,
        isPostsArray: Array.isArray(themeData.posts)
      });
      throw new Error('Generated theme data is missing required fields');
    }

    if (!themeData.posts.length || themeData.posts.length < 1 || themeData.posts.length > 100) {
      console.log('❌ [generate-custom-theme] Invalid number of posts:', themeData.posts.length);
      throw new Error('Theme must contain between 1 and 100 posts');
    }

    // Validate each post
    console.log('🔍 [generate-custom-theme] Validating individual posts');
    for (const post of themeData.posts) {
      if (!post.day || !post.title || !post.description) {
        console.log('❌ [generate-custom-theme] Invalid post:', post);
        throw new Error('Each post must have day, title, and description');
      }
    }

    console.log('✅ [generate-custom-theme] Theme generation successful:', themeData.category);

    // Save theme to database if user is authenticated
    let savedThemeId = theme_id; // Use provided theme_id if it exists
    if (user) {
      if (theme_id) {
        // Update existing theme record
        console.log('🔄 [generate-custom-theme] Updating existing theme for user:', user.id);
        
        const { error: updateError } = await supabase
          .from('themes')
          .update({
            theme_name: themeData.theme,
            description: themeData.description || description,
            category: themeData.category,
            lifecycle_status: 'generating',
            prompt_generation_status: 'in_progress'
          })
          .eq('id', theme_id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('❌ [generate-custom-theme] Failed to update theme:', updateError);
          throw new Error('Failed to update theme in database');
        }

        console.log('✅ [generate-custom-theme] Theme updated with ID:', theme_id);
      } else {
        // Create new theme record (legacy path)
        console.log('💾 [generate-custom-theme] Creating new theme for user:', user.id);
        
        const { data: savedTheme, error: saveError } = await supabase
          .from('themes')
          .insert({
            user_id: user.id,
            theme_name: themeData.theme,
            description: themeData.description || description,
            category: themeData.category,
            lifecycle_status: 'generating',
            user_interaction_required: true,
            background_processing_complete: false
          })
          .select('id')
          .single();

        if (saveError) {
          console.error('❌ [generate-custom-theme] Failed to save theme:', saveError);
          throw new Error('Failed to save theme to database');
        }

        savedThemeId = savedTheme.id;
        console.log('✅ [generate-custom-theme] Theme created with ID:', savedThemeId);
      }

      // Save posts to database
      console.log('💾 [generate-custom-theme] Saving posts to database');
      const postsToInsert = themeData.posts.map((post: any) => ({
        user_id: user.id,
        theme_id: savedThemeId,
        day: post.day,
        title: post.title,
        description: post.description,
        category: themeData.category,
        status: 'draft'
      }));

      const { error: postsError } = await supabase
        .from('social_media_posts')
        .insert(postsToInsert);

      if (postsError) {
        console.error('❌ [generate-custom-theme] Failed to save posts:', postsError);
        // Don't throw error here as theme was saved successfully
      } else {
        console.log('✅ [generate-custom-theme] Posts saved successfully');
      }

      // Trigger system prompt generation for the theme
      console.log('🔄 [generate-custom-theme] Triggering system prompt generation');
      try {
        const { data: promptData, error: promptError } = await supabase.functions.invoke(
          'invoke-system-prompt-agent',
          {
            body: {
              category: themeData.category,
              theme: themeData.theme,
              theme_id: savedThemeId,
              description: themeData.description || description,
              sample_posts: themeData.posts.slice(0, 3), // Send first 3 posts as samples
              user_id: user.id
            },
            headers: {
              Authorization: authHeader,
            }
          }
        );

        if (promptError) {
          console.error('❌ [generate-custom-theme] System prompt generation failed:', promptError);
          // Don't throw error here as theme was created successfully
        } else {
          console.log('✅ [generate-custom-theme] System prompt generation triggered successfully');
        }
      } catch (promptGenError) {
        console.error('❌ [generate-custom-theme] Error triggering system prompt:', promptGenError);
        // Don't throw error here as theme was created successfully
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      theme_id: savedThemeId,
      themeData,
      message: 'Theme generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 [generate-custom-theme] Error in function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});