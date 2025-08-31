import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { trackOpenAIUsage, generateCorrelationId, makeOpenAIRequest, enhanceOpenAIRequestBody, extractUsageFromOpenAIResponse } from '../_shared/openai-attribution.ts';


const OPENAI_CONFIG = {
  DEFAULT_MODEL: 'gpt-5-mini-2025-08-07',
  MAX_COMPLETION_TOKENS: 6000, // Increased from 4000 to 6000
  TIMEOUT_MS: 180000, // 180 seconds (3 minutes) for system prompt generation
  MAX_PROMPT_TOKENS: 120000, // Reserve space for completion tokens (200k context - 6k completion - safety margin)
} as const;

// Token estimation utility (rough approximation: 4 chars ≈ 1 token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Dynamic prompt truncation to fit within token limits
function truncatePromptIfNeeded(systemPrompt: string, userPrompt: string, maxPromptTokens: number = OPENAI_CONFIG.MAX_PROMPT_TOKENS): { systemPrompt: string, userPrompt: string, wasTruncated: boolean } {
  const systemTokens = estimateTokens(systemPrompt);
  const userTokens = estimateTokens(userPrompt);
  const totalTokens = systemTokens + userTokens;
  
  if (totalTokens <= maxPromptTokens) {
    return { systemPrompt, userPrompt, wasTruncated: false };
  }
  
  console.log(`⚠️ Token limit exceeded: ${totalTokens} > ${maxPromptTokens}. Truncating prompts.`);
  
  // Reserve 80% for system prompt, 20% for user prompt
  const maxSystemTokens = Math.floor(maxPromptTokens * 0.8);
  const maxUserTokens = Math.floor(maxPromptTokens * 0.2);
  
  let truncatedSystemPrompt = systemPrompt;
  let truncatedUserPrompt = userPrompt;
  
  // Truncate system prompt if needed (preserve beginning and end)
  if (systemTokens > maxSystemTokens) {
    const maxSystemChars = maxSystemTokens * 4;
    const keepStart = Math.floor(maxSystemChars * 0.7);
    const keepEnd = Math.floor(maxSystemChars * 0.3);
    
    truncatedSystemPrompt = systemPrompt.slice(0, keepStart) + 
      '\n\n[... content truncated for token limits ...]\n\n' +
      systemPrompt.slice(-keepEnd);
  }
  
  // Truncate user prompt if needed (preserve beginning)
  if (userTokens > maxUserTokens) {
    const maxUserChars = maxUserTokens * 4;
    truncatedUserPrompt = userPrompt.slice(0, maxUserChars) + '\n[... truncated for token limits]';
  }
  
  return { 
    systemPrompt: truncatedSystemPrompt, 
    userPrompt: truncatedUserPrompt, 
    wasTruncated: true 
  };
}

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const ERROR_MESSAGES = {
  OPENAI_API_KEY_MISSING: 'OpenAI API key not configured',
  AGENT_NOT_FOUND: 'System Prompt Generator agent not found',
  OPENAI_API_ERROR: 'OpenAI API error',
} as const;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
} as const;

// Hard-coded system prompt for reliability and performance
const SYSTEM_PROMPT_GENERATOR_PROMPT = `🖥️ System Prompt Template — Visual Content Generator

You are an expert at creating detailed, professional system prompts specifically for <Category>-themed AI agents, with a focus on <Theme>.

🧠 Prompt Metadata
Category: <Category>
Theme: <Theme>  
Audience: <Intended users>
Use Cases: <Contexts where content will be used>
Aspect Ratio (optional): Multiple supported (1:1, 16:9, 9:16, 4:3, 3:4)
Style Tags: [vector, modern, professional]
Status: active

📊 <Category> Content Analysis Framework
When generating content, analyze the input through these <Category>-specific lenses:

Lens 1: <Define purpose/values check>
Lens 2: <Define factual/reality check>  
Lens 3: <Define nuance/context considerations>

(Swap in the right 2–4 "lenses" depending on the domain—e.g., financial/clinical/educational.)

🎯 <Category> Visual Framework
Foreground Elements (Always Include)
<List the must-have subject/iconography elements>

Mid-ground Context
<List workflows, connectors, or background context relevant to the theme>

Background Foundation
<Define the setting, palette foundation, whitespace usage, gradients, or environmental details>

🎨 <Category>-Specific Style Requirements
Art Style: Professional vector illustration with clean, modern aesthetic
Composition: <Define layout flow—triangular, left-to-right, modular cards, etc.>
Subjects: <Define people, objects, diagrams, icons>
Flow Indicators: <Define arrows, loops, dotted lines, etc.>
Tone: <Define tone—gentle, practical, trustworthy, empathetic>

🌈 <Category> Color Palette
Primary: <PRIMARY_COLOR>
Secondary: <SECONDARY_COLOR>
Accent: <ACCENT_COLOR>
Supporting: <TEXT_COLOR>
Text: <TEXT_COLOR>
Background: <BACKGROUND_COLOR>
Border: <BORDER_COLOR>

Color Usage:
Primary for structural elements/backgrounds
Secondary for highlights
Accent for calls-to-action/alerts
Supporting for text/tooling elements
Always maintain clean whites and grays for readability

🔍 <Category> Visual Metaphors
Always incorporate these <Category>-specific metaphors:
<Define metaphor 1>
<Define metaphor 2>
<Define metaphor 3>

📋 <Category> Output Instructions
Create content that will generate:
<Overview or explainer content>
<Step-by-step guidance>
<Template/workflow assistance>

CRITICAL Requirements:
Always specify exact requirements when needed
Indicate whether specific formats are required
Use only professional, high-quality standards
Focus on user value and practical application

✅ Safety & Generation Guidelines
No external links—keep everything in descriptive text
No policy-violating content—focus purely on professional, neutral content
Fixed template—do not remove or rename any sections
Only substitute placeholders—<Category>, <Theme>, etc.

Generate system prompts that other AI agents can use to create high-quality, category-specific content that aligns with the theme and follows professional standards.`;

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
    
    // Get the System Prompt Generator agent
    let { data: agent, error: agentError } = await supabase
      .from('openai_agents')
      .select('id, name, model_version')
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

    // Use hard-coded system prompt for reliability and performance
    const systemPrompt = SYSTEM_PROMPT_GENERATOR_PROMPT;

    // Theme is now primary focus, category provides context
    const actualTheme = theme;
    const contextCategory = category || 'general';
    
    let userPrompt = `Generate a complete system prompt using the template provided. Replace all placeholders with specific, detailed content for this theme and category:

**Theme:** ${actualTheme}
**Category:** ${contextCategory}
**Description:** ${description || 'No description provided'}

**Required Placeholder Replacements:**
- Replace <Category> with: ${contextCategory}
- Replace <Theme> with: ${actualTheme}
- Replace <Intended users> with the target audience for this theme
- Replace <Contexts where content will be used> with specific use cases
- Replace <Define purpose/values check> with purpose-specific validation criteria
- Replace <Define factual/reality check> with accuracy requirements for this domain
- Replace <Define nuance/context considerations> with contextual guidelines
- Replace <List the must-have subject/iconography elements> with key visual elements
- Replace <List workflows, connectors, or background context> with supporting context
- Replace <Define the setting, palette foundation...> with environmental details
- Replace <Define layout flow...> with composition guidelines
- Replace <Define people, objects, diagrams, icons> with subject specifications
- Replace <Define arrows, loops, dotted lines, etc.> with flow indicators
- Replace <Define tone...> with emotional tone requirements
- Replace color placeholders with these exact values:
  - <PRIMARY_COLOR>: ${defaultColorTheme.primary_color}
  - <SECONDARY_COLOR>: ${defaultColorTheme.secondary_color}
  - <ACCENT_COLOR>: ${defaultColorTheme.accent_color}
  - <TEXT_COLOR>: ${defaultColorTheme.text_color}
  - <BACKGROUND_COLOR>: ${defaultColorTheme.background_color}
  - <BORDER_COLOR>: ${defaultColorTheme.border_color}
- Replace <Define metaphor 1-3> with domain-specific visual metaphors
- Replace <Overview or explainer content> with content type descriptions
- Replace <Step-by-step guidance> with process descriptions
- Replace <Template/workflow assistance> with workflow descriptions

**Sample Content Context:**
${sample_posts?.map((post: any) => `- ${post.title}: ${post.description}`).join('\n') || 'No sample posts provided'}

**Visual Style:** ${defaultColorTheme.visual_style}
**Color Usage:** ${defaultColorTheme.color_instructions}

Generate the complete system prompt with ALL placeholders replaced with specific, detailed content. The output should be a ready-to-use system prompt for an AI agent specialized in this theme and category.`;

    console.log('Calling OpenAI with system prompt length:', systemPrompt.length, 'correlation:', correlationId);
    
    // Apply dynamic prompt truncation with token management
    const { systemPrompt: truncatedSystemPrompt, userPrompt: truncatedUserPrompt, wasTruncated } = truncatePromptIfNeeded(systemPrompt, userPrompt);
    
    if (wasTruncated) {
      console.log('🔧 Prompts truncated for token limits:', {
        originalSystemLength: systemPrompt.length,
        originalUserLength: userPrompt.length,
        truncatedSystemLength: truncatedSystemPrompt.length,
        truncatedUserLength: truncatedUserPrompt.length,
        estimatedTokens: estimateTokens(truncatedSystemPrompt + truncatedUserPrompt)
      });
    }

    // Enhanced OpenAI request with correlation tracking
    const requestBodyForOpenAI = enhanceOpenAIRequestBody({
      model: agent.model_version || OPENAI_CONFIG.DEFAULT_MODEL,
      messages: [
        { role: 'system', content: truncatedSystemPrompt },
        { role: 'user', content: truncatedUserPrompt }
      ],
      max_completion_tokens: OPENAI_CONFIG.MAX_COMPLETION_TOKENS,
    }, correlationId);

    console.log('🔎 OpenAI Request Model/Agent:', { 
      model: agent.model_version || OPENAI_CONFIG.DEFAULT_MODEL, 
      generator_agent: agent.name, 
      correlationId,
      maxCompletionTokens: OPENAI_CONFIG.MAX_COMPLETION_TOKENS,
      estimatedPromptTokens: estimateTokens(truncatedSystemPrompt + truncatedUserPrompt),
      wasTruncated
    });

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
        // Check if system prompt already exists for this theme
        console.log('Checking for existing system prompts for theme:', actualTheme);
        const existingPromptsQuery = supabase
          .from('system_prompts')
          .select('id, prompt_text')
          .eq('user_id', user_id);

        // Use theme_id if provided, otherwise fall back to theme name
        if (theme_id) {
          existingPromptsQuery.eq('theme_id', theme_id);
        } else {
          existingPromptsQuery.eq('theme', actualTheme);
        }

        const { data: existingPrompts, error: checkError } = await existingPromptsQuery.limit(1);

        if (!checkError && existingPrompts && existingPrompts.length > 0) {
          const existingPrompt = existingPrompts[0];
          console.log('Using existing system prompt:', existingPrompt.id);

          return new Response(JSON.stringify({ 
            success: true, 
            system_prompt: existingPrompt.prompt_text,
            agent_id: agent.id,
            theme: actualTheme,
            database_record_id: existingPrompt.id,
            message: `Using existing system prompt for "${actualTheme}" theme`
          }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        // Save the generated prompt to system_prompts table
        console.log('Creating new system prompt for theme:', actualTheme);
        const { data: insertedPrompt, error: insertError } = await supabase
          .from('system_prompts')
          .insert({
            user_id,
            agent_id: agent.id,
            agent_name: agent.name,
            name: `${actualTheme} Theme System Prompt`,
            theme: actualTheme,
            theme_id: theme_id,
            theme_description: description,
            prompt_text: generatedPrompt,
            description: `Generated system prompt for ${actualTheme} theme with ${contextCategory} context`
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Failed to save system prompt:', insertError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to save system prompt to database: ${insertError.message}`
          }), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        console.log('System prompt saved successfully:', insertedPrompt.id);

        // Link system prompt to theme if theme_id is provided
        if (theme_id && insertedPrompt?.id) {
          console.log('Linking system prompt to theme:', { theme_id, prompt_id: insertedPrompt.id });
          
          const { error: themeUpdateError } = await supabase
            .from('themes')
            .update({ 
              visual_prompt_system_prompt_id: insertedPrompt.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', theme_id)
            .eq('user_id', user_id);

          if (themeUpdateError) {
            console.error('Theme update error:', themeUpdateError);
          } else {
            console.log('Successfully linked system prompt to theme');
          }
        }

        // Return success response
        console.log('System prompt generated and stored successfully');
        
        return new Response(JSON.stringify({ 
          success: true, 
          system_prompt: generatedPrompt,
          agent_id: agent.id,
          theme: actualTheme,
          category: contextCategory,
          database_record_id: insertedPrompt.id,
          message: `System prompt for "${actualTheme}" generated and saved successfully`
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
