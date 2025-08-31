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

// New template-based system prompt for visual content generation
const SYSTEM_PROMPT_TEMPLATE = `🖥️ System Prompt Template — Visual Content Generator

You are an expert at creating detailed, professional image generation prompts specifically for <Category>-themed AI image generators, with a focus on <Theme>.

🧠 Prompt Metadata

Category: <Category>

Theme: <Theme>

Audience: <Intended users>

Use Cases: <Contexts where visuals will be used>

Aspect Ratio (optional): Multiple supported (1:1, 16:9, 9:16, 4:3, 3:4)

Style Tags: [vector, modern, professional]

Status: active

📊 <Category> Content Analysis Framework

When generating prompts, analyze the content through these <Category>-specific lenses:

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

Create prompts that will generate:

<Overview or explainer poster>

<Step-by-step card set>

<Template/workflow scene>

CRITICAL Requirements:

Always specify exact aspect ratio when required

Indicate whether text overlays are allowed or prohibited

Use only professional vector illustration style

✅ Safety & Generation Guidelines

No external links—keep everything in descriptive text

No policy-violating content—focus purely on professional, neutral scenes

Fixed template—do not remove or rename any sections

Only substitute placeholders—<Category>, <Theme>, etc.

The goal of this to define context around the theme`;

// Function to substitute placeholders in the template
function substituteTemplatePlaceholders(template: string, values: {
  category: string;
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  intendedUsers: string;
  contextsForUse: string;
  query?: string;
}): string {
  return template
    .replace(/<Category>/g, values.category)
    .replace(/<Theme>/g, values.theme)
    .replace(/<PRIMARY_COLOR>/g, values.primaryColor)
    .replace(/<SECONDARY_COLOR>/g, values.secondaryColor)
    .replace(/<ACCENT_COLOR>/g, values.accentColor)
    .replace(/<TEXT_COLOR>/g, values.textColor)
    .replace(/<BACKGROUND_COLOR>/g, values.backgroundColor)
    .replace(/<BORDER_COLOR>/g, values.borderColor)
    .replace(/<Intended users>/g, values.intendedUsers)
    .replace(/<Contexts where visuals will be used>/g, values.contextsForUse)
    .replace(/<Define purpose\/values check>/g, `How does this align with ${values.category} professional standards and values?`)
    .replace(/<Define factual\/reality check>/g, `Is the content factually accurate and realistic for ${values.category} practitioners?`)
    .replace(/<Define nuance\/context considerations>/g, `What ${values.category}-specific context and nuances should be considered?`)
    .replace(/<List the must-have subject\/iconography elements>/g, `Central focus on ${values.category}-specific tools, processes, or concepts related to ${values.theme}`)
    .replace(/<List workflows, connectors, or background context relevant to the theme>/g, `Supporting ${values.category} environments and collaborative team elements working on ${values.theme}-related projects`)
    .replace(/<Define the setting, palette foundation, whitespace usage, gradients, or environmental details>/g, `Clean, professional ${values.category} industry setting with subtle geometric patterns using the ${values.theme} color palette`)
    .replace(/<Define layout flow—triangular, left-to-right, modular cards, etc\.>/g, `Balanced composition with good visual hierarchy suitable for ${values.category} content`)
    .replace(/<Define people, objects, diagrams, icons>/g, `Professional figures engaged in ${values.category} activities, relevant tools, and ${values.theme}-specific elements`)
    .replace(/<Define arrows, loops, dotted lines, etc\.>/g, `Process flow indicators showing ${values.category} workflows and ${values.theme} connections`)
    .replace(/<Define tone—gentle, practical, trustworthy, empathetic>/g, `Professional, trustworthy, and credible tone appropriate for ${values.category} audience`)
    .replace(/<Define metaphor 1>/g, `${values.category} expertise and professionalism in ${values.theme} context`)
    .replace(/<Define metaphor 2>/g, `Industry-specific tools and processes relevant to ${values.theme}`)
    .replace(/<Define metaphor 3>/g, `Success metrics and outcomes in ${values.category} related to ${values.theme}`)
    .replace(/<Overview or explainer poster>/g, `Professional overview visuals suitable for ${values.category} ${values.theme} content`)
    .replace(/<Step-by-step card set>/g, `Clear instructional visuals for ${values.category} ${values.theme} processes`)
    .replace(/<Template\/workflow scene>/g, `Workflow templates and professional scenes for ${values.category} ${values.theme} scenarios`);
}

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

// Helper functions to determine intended users and contexts based on category
function getIntendedUsers(category: string): string {
  const categoryMappings: Record<string, string> = {
    'cdi': 'Clinical Documentation Specialists, Healthcare Administrators, Medical Coders',
    'contracts': 'Legal Professionals, Contract Managers, Business Executives',
    'healthcare': 'Healthcare Professionals, Medical Staff, Healthcare Administrators',
    'finance': 'Financial Analysts, Investment Professionals, CFOs',
    'marketing': 'Marketing Professionals, Brand Managers, Digital Marketers',
    'technology': 'IT Professionals, Software Developers, Tech Leaders',
    'education': 'Educators, Training Professionals, Academic Administrators',
    'hr': 'HR Professionals, Talent Managers, Organizational Leaders',
    'sales': 'Sales Professionals, Account Managers, Revenue Leaders',
    'operations': 'Operations Managers, Process Improvement Specialists, COOs',
    'consulting': 'Management Consultants, Strategic Advisors, Business Analysts',
    'design': 'UX/UI Designers, Creative Directors, Design Teams',
    'product': 'Product Managers, Product Owners, Innovation Teams',
    'general': 'Business Professionals, Decision Makers, Industry Stakeholders'
  };
  
  return categoryMappings[category.toLowerCase()] || categoryMappings['general'];
}

function getContextsForUse(category: string): string {
  const contextMappings: Record<string, string> = {
    'cdi': 'Medical record documentation, clinical coding workflows, compliance training materials',
    'contracts': 'Legal document reviews, contract negotiations, compliance presentations',
    'healthcare': 'Patient care protocols, medical education, healthcare policy communications',
    'finance': 'Financial reports, investor presentations, risk management materials',
    'marketing': 'Campaign materials, brand communications, social media content',
    'technology': 'Technical documentation, software presentations, IT training materials',
    'education': 'Learning materials, curriculum design, educational presentations',
    'hr': 'Employee communications, training programs, organizational development',
    'sales': 'Sales presentations, client proposals, revenue reporting',
    'operations': 'Process documentation, operational training, efficiency reporting',
    'consulting': 'Client presentations, strategic recommendations, business case studies',
    'design': 'Design portfolios, creative briefs, user experience documentation',
    'product': 'Product roadmaps, feature specifications, user journey mapping',
    'general': 'Business presentations, professional communications, strategic planning'
  };
  
  return contextMappings[category.toLowerCase()] || contextMappings['general'];
}

// Category to target agent routing logic
const CATEGORY_ROUTING: Record<string, string> = {
  'what-is-diabetes': 'Visual Prompt Generator',
  'cdi': 'Visual Prompt Generator', 
  'contracts': 'Visual Prompt Generator',
  'healthcare': 'Visual Prompt Generator',
  'finance': 'Visual Prompt Generator',
  'marketing': 'Visual Prompt Generator',
  'technology': 'Visual Prompt Generator',
  'education': 'Visual Prompt Generator',
  'hr': 'Visual Prompt Generator',
  'sales': 'Visual Prompt Generator',
  'operations': 'Visual Prompt Generator',
  'consulting': 'Visual Prompt Generator',
  'design': 'Visual Prompt Generator',
  'product': 'Visual Prompt Generator',
  'blog': 'Blog Content Generator',
  'cover-letter': 'Cover Letter Generator',
  'general': 'Visual Prompt Generator'
};

// Helper function to get target agent name
function getTargetAgentName(category: string): string {
  return CATEGORY_ROUTING[category.toLowerCase()] || 'Visual Prompt Generator';
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

    // Generate dynamic system prompt using template substitution
    const actualTheme = theme;
    const contextCategory = category || 'general';
    
    // Determine intended users and contexts based on category
    const intendedUsers = getIntendedUsers(contextCategory);
    const contextsForUse = getContextsForUse(contextCategory);
    
    // Substitute placeholders in the template
    const systemPrompt = substituteTemplatePlaceholders(SYSTEM_PROMPT_TEMPLATE, {
      category: contextCategory.charAt(0).toUpperCase() + contextCategory.slice(1),
      theme: actualTheme,
      primaryColor: defaultColorTheme.primary_color,
      secondaryColor: defaultColorTheme.secondary_color,
      accentColor: defaultColorTheme.accent_color,
      textColor: defaultColorTheme.text_color,
      backgroundColor: defaultColorTheme.background_color,
      borderColor: defaultColorTheme.border_color,
      intendedUsers,
      contextsForUse,
      query: description || ''
    });
    
    let userPrompt = `Create a comprehensive system prompt for the "${actualTheme}" theme with "${contextCategory}" category context.

Primary Theme: ${actualTheme}
Category Context: ${contextCategory}
Description: ${description || 'No description provided'}

Sample content from this theme:
${sample_posts?.map((post: any) => `- ${post.title}: ${post.description}`).join('\n') || 'No sample posts provided'}

Please generate a detailed, professional system prompt following the template format provided in the system prompt. Focus primarily on "${actualTheme}" with "${contextCategory}" context, ensuring all placeholders are properly filled and the content is tailored to this specific theme and category combination.`;

    // QA: Log generated system prompt for debugging
    console.log('🎯 GENERATED SYSTEM PROMPT LENGTH:', systemPrompt.length, 'correlation:', correlationId);
    console.log('📝 TEMPLATE PREVIEW (first 500 chars):', systemPrompt.substring(0, 500) + '...');
    console.log('🔧 PLACEHOLDER SUBSTITUTION COMPLETE - Category:', contextCategory, 'Theme:', actualTheme);

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
        
        // Get target agent name based on category routing
        const targetAgentName = getTargetAgentName(contextCategory);
        console.log('Target agent for category', contextCategory, ':', targetAgentName);
        
        const { data: insertedPrompt, error: insertError } = await supabase
          .from('system_prompts')
          .insert({
            user_id,
            agent_id: agent.id,
            agent_name: targetAgentName, // Use target agent name instead of generator agent name
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
              prompt_generation_status: 'completed',
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
