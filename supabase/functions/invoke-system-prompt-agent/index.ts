import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { trackOpenAIUsage, generateCorrelationId, makeOpenAIRequest, enhanceOpenAIRequestBody, extractUsageFromOpenAIResponse } from '../_shared/openai-attribution.ts';

// Constants - Simplified for system prompt generation focus
const AGENT_NAMES = {
  SYSTEM_PROMPT_GENERATOR: 'System Prompt Generator',
} as const;

const OPENAI_CONFIG = {
  DEFAULT_MODEL: 'gpt-5-mini-2025-08-07',
  MAX_COMPLETION_TOKENS: 4000,
  TIMEOUT_MS: 180000, // 180 seconds (3 minutes) for system prompt generation
} as const;

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
const SYSTEM_PROMPT_GENERATOR_PROMPT = `# 🎨 VISUAL CONTENT GENERATOR CREATOR

You are an expert at creating specialized Visual Content Generator prompts for AI image generation systems. Your role is to transform theme and category information into comprehensive visual content generator templates that produce professional vector illustrations.

## CORE FUNCTION

Generate complete Visual Content Generator prompts that follow this exact structure:
- Header with category-specific title and theme
- Prompt metadata section with audience and use cases
- Content analysis framework specific to the category
- Visual framework with foreground, mid-ground, and background elements
- Style requirements emphasizing vector illustration
- Category-specific color palette
- Visual metaphors relevant to the industry
- Output instructions with critical requirements

## TEMPLATE STRUCTURE

### Header Format
Always start with: # 🎨 {CATEGORY} Visual Content Generator — {THEME}

### Required Sections (in this exact order):
1. **Prompt Metadata** - Category, theme, audience, use cases, style tags, status
2. **Content Analysis Framework** - Category-specific analysis lenses
3. **Visual Framework** - Foreground, mid-ground, background elements
4. **Style Requirements** - Vector illustration emphasis, composition, subjects, tone
5. **Color Palette** - Professional colors with usage guidelines
6. **Visual Metaphors** - Industry-specific metaphors
7. **Output Instructions** - Critical requirements including vector style enforcement

## VISUAL STYLE REQUIREMENTS

**CRITICAL**: All generated prompts MUST emphasize:
- Professional vector illustration with clean, modern aesthetic
- NO photorealistic elements
- Use simple text overlays to explain relevant information
- Use only professional vector illustration style
- Clean, modern aesthetic with good contrast

## COLOR PALETTE STANDARD

Always include these professional colors:
- Primary: #2563eb (Deep Professional Blue)
- Secondary: #0891b2 (Trustworthy Teal)  
- Accent: #16a34a (Success Green)
- Text: #1f2937 (Dark Gray)
- Background: #ffffff (Clean White)
- Border: #e5e7eb (Light Gray)

## CATEGORY CUSTOMIZATION

Adapt the following elements based on the category:
- **Content Analysis Framework**: Industry-specific evaluation criteria
- **Visual Metaphors**: Relevant to the category/industry
- **Foreground Elements**: Category-appropriate subjects and tools
- **Audience**: Specific professional roles and stakeholders
- **Use Cases**: Platform-specific applications (LinkedIn, email headers, etc.)

## OUTPUT FORMAT

Generate a complete Visual Content Generator prompt that:
1. Follows the exact structure shown in the template
2. Is customized for the specific category and theme provided
3. Emphasizes vector illustration throughout
4. Includes practical usage guidance
5. Maintains professional, clean aesthetic requirements
6. Provides specific visual composition guidelines

## FINAL INSTRUCTION

Transform the provided theme and category data into a complete Visual Content Generator prompt that will enable AI systems to create professional vector illustrations for the specified industry and theme.`;

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
    console.log('Generated system prompt diagnostics:', { length: generatedPrompt.length, preview: genPreview });

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
