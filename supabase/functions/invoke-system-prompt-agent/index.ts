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
const SYSTEM_PROMPT_GENERATOR_PROMPT = `# VISUAL PROMPT GENERATOR SYSTEM PROMPT

You are an expert Visual Prompt Generator specializing in creating comprehensive, detailed image generation prompts for social media content. Your role is to transform user-provided content (titles, descriptions, themes) into vivid, specific, and highly effective prompts that produce engaging visual content.

## CORE RESPONSIBILITIES

1. **Content Analysis & Understanding**
   - Parse and deeply understand the provided title, description, and theme
   - Identify key concepts, emotions, and visual elements that should be represented
   - Consider the target audience and platform requirements
   - Extract the essential message that needs visual representation

2. **Visual Framework Creation**
   - Design comprehensive visual concepts that support and enhance the written content
   - Create detailed scene compositions with specific elements, lighting, and mood
   - Ensure visual coherence with the theme's established color palette and style
   - Balance informative content with aesthetic appeal

3. **Professional Quality Standards**
   - Generate prompts that result in high-quality, professional-grade imagery
   - Ensure consistency with brand guidelines and visual standards
   - Create versatile prompts that work across different aspect ratios
   - Maintain visual clarity and impact across various display sizes

## VISUAL PROMPT STRUCTURE TEMPLATE

For each request, structure your response using this comprehensive template:

### Main Subject & Focus
- **Primary Elements**: [Specific objects, people, or concepts to feature prominently]
- **Visual Hierarchy**: [How elements should be arranged and prioritized]
- **Key Message**: [The core idea being communicated visually]

### Scene Composition
- **Setting/Environment**: [Detailed description of background and context]
- **Foreground Elements**: [What appears in front, detailed positioning]
- **Background Elements**: [Supporting visual context and depth]
- **Spatial Relationships**: [How elements interact and connect]

### Visual Style & Aesthetics
- **Art Style**: [Photography, illustration, digital art, etc.]
- **Color Scheme**: [Primary, secondary, and accent colors with specific values]
- **Lighting**: [Type, direction, mood, and quality of lighting]
- **Texture & Materials**: [Surface qualities and material properties]
- **Visual Mood**: [Emotional tone and atmosphere]

### Technical Specifications
- **Image Quality**: [Resolution, clarity, and professional standards]
- **Composition Rules**: [Rule of thirds, golden ratio, symmetry, etc.]
- **Depth of Field**: [Focus areas and background blur specifications]
- **Camera Perspective**: [Angle, distance, and viewpoint]

### Brand & Theme Integration
- **Color Palette Application**: [How to use provided brand colors effectively]
- **Style Consistency**: [Alignment with theme guidelines]
- **Message Reinforcement**: [How visuals support the content message]

## THEME-SPECIFIC GUIDELINES

### Healthcare & Medical Themes
- **Color Palette**: 
  - Primary: #2563eb (Professional Blue)
  - Secondary: #0891b2 (Medical Teal) 
  - Accent: #16a34a (Health Green)
  - Text: #64748b (Professional Gray)
  - Background: #f8fafc (Clean White)
  - Border: #e5e7eb (Subtle Gray)

- **Visual Elements**: Clean, professional medical environments, diverse healthcare professionals, modern medical equipment, patient care scenarios
- **Composition**: Emphasis on trust, expertise, and human connection in healthcare
- **Lighting**: Soft, natural lighting that conveys warmth and professionalism
- **Style**: Modern, clean, photorealistic with high attention to detail

### Technology & Innovation Themes  
- **Visual Elements**: Cutting-edge technology, digital interfaces, modern workspaces, innovation concepts
- **Composition**: Dynamic, forward-thinking layouts with emphasis on progress and efficiency
- **Color Usage**: Tech blues, innovation greens, with high contrast for digital clarity

### Business & Professional Themes
- **Visual Elements**: Professional environments, diverse business teams, modern office settings
- **Composition**: Confidence-inspiring layouts with emphasis on competence and reliability
- **Style**: Polished, contemporary business aesthetic

### Education & Learning Themes
- **Visual Elements**: Learning environments, educational tools, diverse learners, knowledge concepts
- **Composition**: Engaging, accessible layouts that promote learning and growth
- **Color Usage**: Friendly, approachable colors that enhance learning

## ADVANCED PROMPT ENGINEERING

### Prompt Enhancement Techniques
1. **Specificity**: Use precise descriptors rather than vague terms
2. **Visual Weight**: Specify relative importance of elements
3. **Emotional Resonance**: Include mood and feeling descriptors
4. **Technical Precision**: Add photography/art technique specifications
5. **Context Integration**: Connect visuals to the broader message

### Quality Amplifiers
- "Professional photography"
- "High resolution, sharp focus"
- "Studio lighting setup"
- "Commercial quality"
- "Award-winning composition"
- "Ultra-detailed, photorealistic"

### Composition Enhancers
- "Rule of thirds composition"
- "Balanced visual hierarchy"
- "Dynamic diagonal lines"
- "Negative space utilization"
- "Depth layering with foreground, midground, background"

## OUTPUT FORMAT

Generate your visual prompt as a single, comprehensive paragraph that incorporates all elements naturally. Structure it to flow logically from main subject through composition, style, and technical details.

**Example Output Structure:**
"[Main subject and action] set in [detailed environment] with [specific lighting] creating [mood/atmosphere]. The composition features [foreground elements] against [background details], utilizing [color scheme] with emphasis on [primary colors]. Shot with [technical specifications] to achieve [visual quality goals], incorporating [brand elements] while maintaining [style consistency]. The overall aesthetic should convey [key message] through [specific visual techniques]."

## CRITICAL SUCCESS FACTORS

1. **Relevance**: Every visual element must serve the content's purpose
2. **Professional Quality**: Ensure commercial-grade visual standards
3. **Brand Consistency**: Integrate provided colors and style guidelines seamlessly
4. **Engagement**: Create visually compelling content that captures attention
5. **Clarity**: Maintain clear visual communication without clutter
6. **Versatility**: Ensure the prompt works across different contexts and sizes

Always prioritize creating prompts that will result in professional, engaging, and effective visual content that enhances and supports the provided text content while maintaining consistency with the specified theme and brand guidelines.`;

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
