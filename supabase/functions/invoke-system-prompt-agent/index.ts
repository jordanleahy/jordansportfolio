import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { trackOpenAIUsage, generateCorrelationId, makeOpenAIRequest, enhanceOpenAIRequestBody, extractUsageFromOpenAIResponse } from '../_shared/openai-attribution.ts';

// Constants - Centralized to match src/constants/
const AGENT_NAMES = {
  SYSTEM_PROMPT_GENERATOR: 'System Prompt Generator',
  VISUAL_PROMPT_GENERATOR: 'Visual Prompt Generator',
  BLOG_CONTENT_GENERATOR: 'Blog Content Generator',
  COVER_LETTER_GENERATOR: 'Cover Letter Generator',
  CALENDAR_THEME_JSON_PROCESSOR: 'Calendar Theme JSON Processor',
} as const;

const SYSTEM_PROMPT_CATEGORIES = {
  SYSTEM_PROMPT_GENERATION: 'system_prompt_generation',
} as const;

const OPENAI_CONFIG = {
  DEFAULT_MODEL: 'gpt-4.1-2025-04-14',
  MAX_COMPLETION_TOKENS: 4000,
  TIMEOUT_MS: 180000, // 180 seconds (3 minutes) for system prompt generation
  ESCALATION_TIMEOUTS: {
    ATTEMPT_1: 180000,   // 180 seconds for first attempt
    ATTEMPT_2: 240000,   // 240 seconds for second attempt  
    ATTEMPT_3: 300000,   // 300 seconds for final attempt
  },
} as const;

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

const ERROR_MESSAGES = {
  OPENAI_API_KEY_MISSING: 'OpenAI API key not configured',
  AGENT_NOT_FOUND: 'Required agent not found for this user',
  SYSTEM_PROMPT_NOT_FOUND: 'No system prompt found for specified category',
  INVALID_REQUEST_BODY: 'Invalid request body',
  OPENAI_API_ERROR: 'OpenAI API error',
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  NETWORK_ERROR: 'Network error',
} as const;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
} as const;

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper function to get default color theme from database
async function getDefaultColorTheme(supabase: any): Promise<any> {
  const { data, error } = await supabase
    .from('color_themes')
    .select('*')
    .eq('is_default', true)
    .eq('is_system', true)
    .single();

  if (error) {
    console.log('No default color theme found, using fallback colors');
    // Return fallback default colors
    return {
      name: 'Professional Blue',
      primary_color: '#2563eb',
      secondary_color: '#0891b2',
      accent_color: '#16a34a',
      text_color: '#64748b',
      background_color: '#f8fafc',
      border_color: '#e5e7eb',
      visual_style: 'Clean, modern professional design',
      color_instructions: 'Use primary colors for main subjects, secondary for supporting elements, accent for highlights'
    };
  }

  return data;
}


serve(async (req) => {
  console.log('invoke-system-prompt-agent function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  let userId: string | null = null;
  let openAIRequestId: string | undefined;

  try {
    const requestBody = await req.json();
    const { category, theme, description, sample_posts, user_id, skip_ensure, theme_id } = requestBody;
    userId = user_id;
    const skipEnsure = !!skip_ensure;
    
    // Input validation - theme is now primary, category secondary
    if (!theme || !user_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: theme and user_id are required' 
      }), {
        status: HTTP_STATUS.BAD_REQUEST,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Allow any category for system prompt generation
    // Categories like 'cdi', 'contracts', 'forms', etc. are allowed
    
    console.log('Processing request for theme:', theme, 'category:', category, 'user_id:', user_id, 'correlation:', correlationId);

    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: ERROR_MESSAGES.OPENAI_API_KEY_MISSING 
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get default color theme to include in prompt generation
    console.log('🎨 FETCHING DEFAULT COLOR THEME: For enhanced prompt generation');
    const defaultColorTheme = await getDefaultColorTheme(supabase);
    console.log('✅ DEFAULT COLORS LOADED:', {
      theme_name: defaultColorTheme.name,
      primary: defaultColorTheme.primary_color,
      secondary: defaultColorTheme.secondary_color,
      accent: defaultColorTheme.accent_color
    });

    console.log('🤖 AI GENERATION MODE: Using OpenAI with default color theme integration');
    
    // Get the System Prompt Generator agent (look for system/shared agents first, then user-specific)
    let { data: agent, error: agentError } = await supabase
      .from('openai_agents')
      .select('*')
      .eq('name', AGENT_NAMES.SYSTEM_PROMPT_GENERATOR)
      .single();

    if (agentError || !agent) {
      console.error('System Prompt Generator agent not found:', agentError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: ERROR_MESSAGES.AGENT_NOT_FOUND 
      }), {
        status: HTTP_STATUS.NOT_FOUND,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found System Prompt Generator agent:', agent.id);

    // Get the system prompt for this agent from the system_prompts table
    // Use order by to get the most recent one and handle multiple records gracefully
    const { data: systemPromptData, error: systemPromptError } = await supabase
      .from('system_prompts')
      .select('prompt_text')
      .eq('agent_id', agent.id)
      .eq('category', SYSTEM_PROMPT_CATEGORIES.SYSTEM_PROMPT_GENERATION)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (systemPromptError || !systemPromptData) {
      console.error('❌ SYSTEM PROMPT NOT FOUND:', {
        agent_id: agent.id,
        category: SYSTEM_PROMPT_CATEGORIES.SYSTEM_PROMPT_GENERATION,
        error: systemPromptError
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: ERROR_MESSAGES.SYSTEM_PROMPT_NOT_FOUND 
      }), {
        status: HTTP_STATUS.NOT_FOUND,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = systemPromptData.prompt_text;

    // Theme is now primary focus, category provides context
    const actualTheme = theme;
    const contextCategory = category || 'general';
    
    let userPrompt = `Create a comprehensive system prompt for the "${actualTheme}" theme with "${contextCategory}" category context.

Primary Theme: ${actualTheme}
Category Context: ${contextCategory}
Description: ${description || 'No description provided'}

Default Color Palette to Include:
- Primary: ${defaultColorTheme.primary_color} (${defaultColorTheme.name} theme)
- Secondary: ${defaultColorTheme.secondary_color}
- Accent: ${defaultColorTheme.accent_color}
- Text: ${defaultColorTheme.text_color}
- Background: ${defaultColorTheme.background_color}
- Border: ${defaultColorTheme.border_color}

Visual Style: ${defaultColorTheme.visual_style}
Color Usage: ${defaultColorTheme.color_instructions}

Sample content from this theme:
${sample_posts?.map((post: any) => `- ${post.title}: ${post.description}`).join('\n') || 'No sample posts provided'}

Please generate a detailed, professional system prompt following the established template format with theme-specific visual frameworks, the provided color palette, and content analysis guidelines. Focus primarily on "${actualTheme}" with "${contextCategory}" context. Include the color palette in the standard format with the exact hex values provided above.`;

    console.log('Calling OpenAI with system prompt length:', systemPrompt.length, 'correlation:', correlationId);

    // Enhanced OpenAI request with correlation tracking
    const requestBodyForOpenAI = enhanceOpenAIRequestBody({
      model: agent.model_version || OPENAI_CONFIG.DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: OPENAI_CONFIG.MAX_COMPLETION_TOKENS,
    }, correlationId);

    console.log('🔎 OpenAI Request Model/Agent:', { model: agent.model_version || OPENAI_CONFIG.DEFAULT_MODEL, generator_agent: agent.name, correlationId });

    const { response, openAIRequestId: responseOpenAIRequestId, responseTime } = await makeOpenAIRequest({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBodyForOpenAI),
      correlationId,
      timeout: OPENAI_CONFIG.TIMEOUT_MS,
      maxRetries: 3,
      operationType: 'system_prompt',
    });

    openAIRequestId = responseOpenAIRequestId;

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `${ERROR_MESSAGES.OPENAI_API_ERROR}: ${response.status}` 
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    // Validate OpenAI response structure before accessing content
    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('❌ INVALID OPENAI RESPONSE STRUCTURE:', {
        hasData: !!data,
        hasChoices: !!data?.choices,
        isChoicesArray: Array.isArray(data?.choices),
        choicesLength: data?.choices?.length,
        fullResponse: JSON.stringify(data, null, 2)
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid OpenAI response: missing choices array or empty response',
        openai_response: data
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const choice = data.choices[0];
    if (!choice || !choice.message || typeof choice.message.content !== 'string') {
      console.error('❌ INVALID OPENAI CHOICE STRUCTURE:', {
        hasChoice: !!choice,
        hasMessage: !!choice?.message,
        hasContent: !!choice?.message?.content,
        contentType: typeof choice?.message?.content,
        choice: JSON.stringify(choice, null, 2)
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid OpenAI response: missing or invalid message content',
        openai_choice: choice
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const generatedPrompt = choice.message.content.trim();
    
    // Validate that we actually got content
    if (!generatedPrompt || generatedPrompt.length === 0) {
      console.error('❌ EMPTY OPENAI CONTENT:', {
        originalContent: choice.message.content,
        trimmedLength: generatedPrompt.length,
        fullChoice: JSON.stringify(choice, null, 2)
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'OpenAI returned empty content',
        openai_choice: choice
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const genPreview = generatedPrompt.slice(0, 140).replace(/\n/g, ' ');
    const formatHint = genPreview.startsWith('#') || genPreview.includes('VISUAL PROMPT GENERATOR') ? 'visual_template' : (genPreview.toLowerCase().startsWith('header') ? 'header_template' : 'unknown');
    console.log('Generated system prompt diagnostics:', { length: generatedPrompt.length, preview: genPreview, formatHint });

    // 🔍 ENHANCED LOGGING: Starting database operations
    console.log('📊 DATABASE OPERATIONS: Starting system prompt storage');
    console.log('🎯 TARGET DATA:', {
      user_id,
      agent_id: agent.id,
      agent_name: agent.name,
      theme: actualTheme,
      category: contextCategory,
      prompt_length: generatedPrompt.length,
      timestamp: new Date().toISOString()
    });

    try {
      // 🔍 Step 0: Check if system prompt already exists for this theme_id
      console.log('🔍 STEP 0: Checking for existing system prompts for theme_id:', theme_id);
      const existingPromptsQuery = supabase
        .from('system_prompts')
        .select('id, category, created_at, theme')
        .eq('user_id', user_id);

      // Use theme_id if provided, otherwise fall back to theme name
      if (theme_id) {
        existingPromptsQuery.eq('theme_id', theme_id);
      } else {
        existingPromptsQuery.eq('theme', actualTheme);
      }

      const { data: existingPrompts, error: checkError } = await existingPromptsQuery
        .order('created_at', { ascending: false });

      if (checkError) {
        console.error('❌ ERROR CHECKING EXISTING PROMPTS:', checkError);
      } else {
        console.log('📊 EXISTING PROMPTS FOUND:', {
          count: existingPrompts?.length || 0,
          prompts: existingPrompts?.map(p => ({ id: p.id, category: p.category, created_at: p.created_at }))
        });

        // If a prompt already exists for this theme, return the existing one
        if (existingPrompts && existingPrompts.length > 0) {
          const existingPrompt = existingPrompts[0];
          console.log('♻️ USING EXISTING SYSTEM PROMPT:', {
            existing_prompt_id: existingPrompt.id,
            theme: actualTheme,
            category: existingPrompt.category,
            message: 'System prompt already exists for this theme'
          });

          return new Response(JSON.stringify({ 
            success: true, 
            system_prompt: generatedPrompt,
            agent_id: agent.id,
            theme: actualTheme,
            category: contextCategory,
            database_record_id: existingPrompt.id,
            message: `Using existing system prompt for "${actualTheme}" theme (found ${existingPrompts.length} existing prompts)`
          }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }
      }

      // 📝 Step 1: Save the generated prompt to system_prompts table (only if none exists)
      console.log('💾 STEP 1: Creating new system prompt (none found for theme)');
      const { data: insertedPrompt, error: insertError } = await supabase
        .from('system_prompts')
        .insert({
          user_id,
          agent_id: agent.id,
          agent_name: agent.name,
          agent_purpose: agent.purpose,
          agent_owner: agent.owner,
          name: `${actualTheme} Theme System Prompt`,
          category: contextCategory,
          theme: actualTheme,
          theme_id: theme_id,
          theme_description: description,
          prompt_text: generatedPrompt,
          description: `Generated system prompt for ${actualTheme} theme with ${contextCategory} context`
        })
        .select();

      if (insertError) {
        console.error('❌ SYSTEM_PROMPTS INSERT ERROR:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Failed to save system prompt to database: ${insertError.message}`,
          details: insertError
        }), {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ SYSTEM_PROMPTS INSERT SUCCESS:', {
        inserted_records: insertedPrompt?.length || 0,
        first_record_id: insertedPrompt?.[0]?.id,
        category: insertedPrompt?.[0]?.category,
        agent_name: insertedPrompt?.[0]?.agent_name,
        updated_at: insertedPrompt?.[0]?.updated_at
      });

      // Update the themes table with the generated system prompt ID if theme_id is provided
      if (theme_id && insertedPrompt?.[0]?.id) {
        console.log('🔗 LINKING SYSTEM PROMPT TO THEME:', { theme_id, prompt_id: insertedPrompt[0].id });
        
        const { error: themeUpdateError } = await supabase
          .from('themes')
          .update({ 
            visual_prompt_system_prompt_id: insertedPrompt[0].id,
            updated_at: new Date().toISOString()
          })
          .eq('id', theme_id)
          .eq('user_id', user_id); // Ensure user owns the theme

        if (themeUpdateError) {
          console.error('❌ THEME UPDATE ERROR:', themeUpdateError);
        } else {
          console.log('✅ THEME UPDATED: Successfully linked system prompt to theme');
        }
      }

    // 🎯 Step 2: Determine target agent based on prompt type
      let targetAgentName = null;
      
      // Route based on theme first, then category context
      if (actualTheme?.toLowerCase().includes('visual') || 
          ['healthcare', 'contracts', 'design', 'coding ai', 'cdi', 'ai agents', 'product_manager', 'product_designer'].includes(actualTheme) ||
          ['healthcare', 'contracts', 'design', 'coding ai', 'cdi', 'ai agents', 'product_manager', 'product_designer'].includes(contextCategory) ||
          description?.toLowerCase().includes('visual') || 
          description?.toLowerCase().includes('image')) {
        targetAgentName = AGENT_NAMES.VISUAL_PROMPT_GENERATOR;
      }
      // Route to other agents based on theme or category patterns
      else if (actualTheme?.includes('blog') || actualTheme?.includes('content') ||
               contextCategory?.includes('blog') || contextCategory?.includes('content')) {
        targetAgentName = AGENT_NAMES.BLOG_CONTENT_GENERATOR;
      }
      else if (actualTheme?.includes('cover_letter') || contextCategory?.includes('cover_letter')) {
        targetAgentName = AGENT_NAMES.COVER_LETTER_GENERATOR;
      }
      else if (actualTheme?.includes('calendar') || actualTheme?.includes('json') ||
               contextCategory?.includes('calendar') || contextCategory?.includes('theme') || contextCategory?.includes('json')) {
        targetAgentName = AGENT_NAMES.CALENDAR_THEME_JSON_PROCESSOR;
      }
      else {
        // Default to Visual Prompt Generator for unknown themes
        targetAgentName = AGENT_NAMES.VISUAL_PROMPT_GENERATOR;
      }
      
      if (targetAgentName) {
        console.log(`🔍 STEP 2: Finding target agent "${targetAgentName}" for theme "${actualTheme}" with category context "${contextCategory}"`);
        
        const { data: targetAgent, error: targetAgentError } = await supabase
          .from('openai_agents')
          .select('*')
          .eq('name', targetAgentName)
          .single();

        if (targetAgentError || !targetAgent) {
          console.error('❌ TARGET AGENT NOT FOUND:', {
            target_agent_name: targetAgentName,
            category: contextCategory,
            error: targetAgentError
          });
        } else {
          console.log('✅ TARGET AGENT FOUND:', {
            agent_name: targetAgent.name,
            agent_id: targetAgent.id,
            theme: actualTheme,
            category: contextCategory,
            routing_logic: 'theme_based'
          });

          // Update the target agent's last_run timestamp only
          const currentTimestamp = new Date().toISOString();
          const { error: targetUpdateError } = await supabase
            .from('openai_agents')
            .update({ 
              last_run: currentTimestamp,
              updated_at: currentTimestamp
            })
            .eq('id', targetAgent.id);

          if (targetUpdateError) {
            console.error('❌ TARGET AGENT UPDATE ERROR:', targetUpdateError);
          } else {
            console.log('✅ TARGET AGENT UPDATED: Successfully updated target agent timestamps');
          }

          // Update the system_prompts table record to reflect the correct target agent
          const { error: promptUpdateError } = await supabase
            .from('system_prompts')
            .update({
              agent_id: targetAgent.id,
              agent_name: targetAgent.name,
              agent_purpose: targetAgent.purpose,
              agent_owner: targetAgent.owner
            })
            .eq('id', insertedPrompt[0].id);

          if (promptUpdateError) {
            console.error('❌ PROMPT RECORD UPDATE ERROR:', promptUpdateError);
          } else {
            console.log('✅ PROMPT RECORD UPDATED: System prompt attribution updated', { id: insertedPrompt[0].id, agent_name: targetAgent.name });
          }
        }
      } else {
        console.log(`⚠️  NO TARGET AGENT: Failed to determine target agent for category "${contextCategory}"`);
      }

      // 🔄 Step 3: Update the generator agent's last_run timestamp
      console.log('⏰ STEP 3: Updating generator agent last_run timestamp');
      const currentTimestamp = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('openai_agents')
        .update({ 
          last_run: currentTimestamp,
          updated_at: currentTimestamp
        })
        .eq('id', agent.id);

      if (updateError) {
        console.error('⚠️  AGENT UPDATE WARNING:', {
          error: updateError,
          message: updateError.message,
          agent_id: agent.id
        });
        // Non-critical error, continue
      } else {
        console.log('✅ AGENT UPDATE SUCCESS: Updated last_run timestamp');
      }

      // 🎨 Step 4: Ensure all posts have image prompts
      console.log('🎨 STEP 4: Ensuring posts have image prompts');
      if (skipEnsure) {
        console.log('⏭️ Skipping ensure-post-image-prompts per request flag');
      } else {
        try {
          // Run ensure in the background to avoid blocking the main response
          EdgeRuntime.waitUntil((async () => {
            const imagePromptResponse = await supabase.functions.invoke('ensure-post-image-prompts', {
              body: { 
                category: contextCategory,
                theme: actualTheme,
                userId: user_id 
              }
            });

            if (imagePromptResponse.error) {
              console.error('⚠️  IMAGE PROMPT GENERATION WARNING:', imagePromptResponse.error);
            } else {
              const promptResults = imagePromptResponse.data;
              console.log('✅ IMAGE PROMPT GENERATION SUCCESS:', {
                theme: actualTheme,
                category: contextCategory,
                totalPosts: promptResults?.totalPosts || 0,
                successCount: promptResults?.successCount || 0,
                errorCount: promptResults?.errorCount || 0
              });
            }
          })());
        } catch (promptError) {
          console.error('⚠️  IMAGE PROMPT GENERATION ERROR (non-critical):', promptError);
          // Continue with success response even if prompt generation fails
        }
      }

      // 🎉 Final success response
      console.log('🎉 OPERATION COMPLETE: System prompt generated and stored successfully');
      console.log('📈 FINAL STATS:', {
        operation: 'system_prompt_generation',
        user_id,
        theme: actualTheme,
        category: contextCategory,
        agent_id: agent.id,
        prompt_length: generatedPrompt.length,
        database_records_created: insertedPrompt?.length || 0,
        success: true,
        timestamp: currentTimestamp
      });

      return new Response(JSON.stringify({ 
        success: true, 
        system_prompt: generatedPrompt,
        agent_id: agent.id,
        theme: actualTheme,
        category: contextCategory,
        database_record_id: insertedPrompt?.[0]?.id,
        message: `Theme-based system prompt for "${actualTheme}" generated and saved successfully`
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });

    } catch (dbError) {
      console.error('💥 DATABASE OPERATION FAILED:', {
        error: dbError,
        message: dbError.message,
        stack: dbError.stack,
        user_id,
        theme: actualTheme,
        category: contextCategory,
        agent_id: agent.id
      });

      return new Response(JSON.stringify({ 
        success: false, 
        error: `Database operation failed: ${dbError.message}`,
        theme: actualTheme,
        category: contextCategory,
        agent_id: agent.id
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in invoke-system-prompt-agent function:', error);
    
    // Check if this is a timeout error and provide user-friendly message
    const isTimeoutError = error?.timeout || error?.userFriendlyMessage || error?.error?.message?.includes('timeout');
    const userMessage = isTimeoutError 
      ? (error?.userFriendlyMessage || "Trying to generate some prompts, your internet connection good?")
      : error?.error?.message || error?.message || 'Unknown error occurred';
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: userMessage,
      isTimeout: !!isTimeoutError,
      correlationId: error?.correlationId || correlationId,
    }), {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});