/**
 * EDGE FUNCTION: Generate Image Prompt Dynamic
 * 
 * PURPOSE:
 * Generates category-specific image prompts for social media content using AI and category-specific
 * system prompts. Supports color theme integration and provides comprehensive usage tracking
 * for cost monitoring and optimization.
 * 
 * INPUTS:
 * - title: string - Content title for context
 * - description: string - Content description for prompt generation
 * - theme: string (optional) - Specific theme for targeted prompt generation
 * - category: string - Content category (fallback if theme not found)
 * - colorTheme: object (optional) - Brand colors and visual style guidelines
 * 
 * OUTPUTS:
 * - Success: { generatedPrompt: string, category: string, agent: string, correlationId: string, usage: object }
 * - Error: { error: string }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-4o-mini for prompt generation)
 * - Supabase Database (system_prompts, cached_prompts tables)
 * - OpenAI Attribution System (usage tracking and cost calculation)
 * 
 * USAGE:
 * Called from: Content creation workflows, image generation pipelines, social media management
 * Authentication: Optional - enhanced features and caching available for authenticated users
 * 
 * FLOW:
 * 1. Validate required title, description inputs (theme or category required)
 * 2. Retrieve theme-specific system prompt with category fallback from system_prompts table
 * 3. Integrate color theme instructions if provided for brand consistency
 * 4. Generate detailed image prompt using OpenAI with Visual Prompt Generator
 * 5. Cache generated prompt for future reuse (if user authenticated)
 * 6. Track API usage, costs, and performance metrics
 * 7. Return optimized prompt ready for AI image generation
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { trackOpenAIUsage, generateCorrelationId, extractUsageFromOpenAIResponse, makeOpenAIRequest } from '../_shared/openai-attribution.ts';
import { createLogger } from '../_shared/advanced-logger.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  const correlationId = generateCorrelationId();
  // Initialize structured logger
  const logger = createLogger({ functionName: 'generate-image-prompt-dynamic', correlationId });
  let success = false;
  let estimatedCost = 0;
  let tokensUsed = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let errorMessage: string | undefined;
  let requestMetadata: any = {};
  let openAIRequestId: string | undefined;

  // Enhanced shutdown tracking
  console.log('🚀 FUNCTION_START: Request initiated', {
    correlationId,
    timestamp: new Date().toISOString(),
    requestId: req.headers.get('x-request-id') || 'unknown',
    userAgent: req.headers.get('user-agent'),
    method: req.method,
    url: req.url
  });

  // Add signal handler for cleanup
  const controller = new AbortController();
  let functionExitReason = 'unknown';
  
  const exitHandler = (reason: string) => {
    functionExitReason = reason;
    console.log('🏁 FUNCTION_EXIT:', {
      correlationId,
      reason,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      success,
      userId: userId?.slice(0, 8)
    });
  };

  // Setup cleanup on various exit conditions
  const cleanup = () => {
    controller.abort();
    exitHandler('cleanup_called');
  };

  // Track process signals
  globalThis.addEventListener('beforeunload', () => exitHandler('beforeunload'));
  globalThis.addEventListener('unload', () => exitHandler('unload'));

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let { title, description, theme, category, colorTheme, aspectRatio, aspect_ratio, themeId, systemPromptId } = await req.json();

    if (!title || !description || (!theme && !category && !themeId && !systemPromptId)) {
      throw new Error('Missing required fields: title, description, and one of theme, category, themeId, or systemPromptId');
    }

    const requestedAspectRatio = aspectRatio || aspect_ratio || null;

    // Store request metadata with correlation ID
    requestMetadata = { theme, category, themeId, systemPromptId, title, description, colorTheme, aspectRatio: requestedAspectRatio, correlationId };

    logger.info('Request payload received', {
      theme,
      themeId,
      systemPromptId: systemPromptId ? `${String(systemPromptId).slice(0,8)}…` : null,
      category,
      titleLength: title?.length || 0,
      descriptionLength: description?.length || 0,
      hasColorTheme: !!colorTheme,
      aspectRatio: requestedAspectRatio
    });
    // Initialize Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    logger.info('User authentication resolved', { userId: userId ? userId.slice(0, 8) : null });

    console.log('🚀 Generating image prompt for:', { theme, category, title, userId: userId?.slice(0, 8), correlationId });

    let systemPromptData: any = null;
    let usedIdentifier: string;
    let usedType: 'systemPromptId' | 'themeId' | 'theme' | 'category';

    // Highest priority: explicit systemPromptId
    if (!systemPromptData && systemPromptId) {
      console.log('🎯 Using explicit systemPromptId for system prompt:', systemPromptId);
      const { data: spById, error: spByIdError } = await supabase
        .from('system_prompts')
        .select('prompt_text, theme, id, agent_name, created_at, updated_at')
        .eq('id', systemPromptId)
        .eq('is_active', true)
        .maybeSingle();
      if (spById && !spByIdError) {
        systemPromptData = spById;
        usedIdentifier = spById.theme || systemPromptId;
        usedType = 'systemPromptId';
        console.log('🧾 SYSTEM PROMPT RESOLVED (by id):', {
          id: spById.id,
          agent_name: spById.agent_name,
          updated_at: spById.updated_at,
          length: spById.prompt_text?.length || 0,
          preview: (spById.prompt_text || '').slice(0, 100).replace(/\n/g, ' ')
        });
      }
    }

    // Next: themeId mapped to a specific system prompt
    if (!systemPromptData && themeId) {
      console.log('🎯 Resolving themeId to system prompt:', themeId);
      const { data: themeRow, error: themeRowErr } = await supabase
        .from('themes')
        .select('visual_prompt_system_prompt_id, theme_name, category')
        .eq('id', themeId)
        .maybeSingle();
      if (themeRow && !themeRowErr) {
        // Get category from themes table if not provided
        if (themeRow.category && !category) {
          category = themeRow.category;
          console.log('📌 Using category from themes table:', category);
        }
        
        if (themeRow.visual_prompt_system_prompt_id) {
          const { data: spFromTheme, error: spFromThemeErr } = await supabase
            .from('system_prompts')
            .select('prompt_text, theme, id, agent_name, created_at, updated_at')
            .eq('id', themeRow.visual_prompt_system_prompt_id)
            .eq('is_active', true)
            .maybeSingle();
          if (spFromTheme && !spFromThemeErr) {
            systemPromptData = spFromTheme;
            usedIdentifier = themeRow.theme_name || spFromTheme.theme || String(themeId);
            usedType = 'themeId';
            console.log('🧾 SYSTEM PROMPT RESOLVED (by themeId mapping):', {
              id: spFromTheme.id,
              agent_name: spFromTheme.agent_name,
              updated_at: spFromTheme.updated_at,
              length: spFromTheme.prompt_text?.length || 0,
              preview: (spFromTheme.prompt_text || '').slice(0, 100).replace(/\n/g, ' ')
            });
          }
        }
        // If no mapping, fall back to theme name search later
        if (!systemPromptData && themeRow.theme_name && !theme) {
          theme = themeRow.theme_name;
        }
      }
    }

    // Then: theme string search
    if (!systemPromptData && theme) {
      console.log('🎯 Looking for theme-based system prompt:', theme);
      const { data: themeData, error: themeError } = await supabase
        .from('system_prompts')
        .select('prompt_text, theme, category, id, agent_name, created_at, updated_at')
        .eq('theme', theme)
        .eq('agent_name', 'Visual Prompt Generator')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (themeData && !themeError) {
        console.log('✅ Found theme-based prompt:', { theme, id: themeData.id, agent: themeData.agent_name, updated_at: themeData.updated_at, length: themeData.prompt_text?.length || 0, preview: (themeData.prompt_text || '').slice(0, 100).replace(/\n/g, ' ') });
        systemPromptData = themeData;
        usedIdentifier = theme;
        usedType = 'theme';
      } else {
        console.log('🔍 No theme-based prompt found, falling back to category:', category);
      }
    }

    // Finally: category-based prompt
    if (!systemPromptData && category) {
      console.log('🏷️ Looking for category-based system prompt:', category);
      // First try category-only prompts (theme is NULL)
      const { data: categoryOnlyData, error: categoryOnlyError } = await supabase
        .from('system_prompts')
        .select('prompt_text, theme, category, id, agent_name, created_at, updated_at')
        .eq('category', category)
        .eq('agent_name', 'Visual Prompt Generator')
        .eq('is_active', true)
        .is('theme', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (categoryOnlyData && !categoryOnlyError) {
        console.log('✅ Found category-only prompt:', { category, id: categoryOnlyData.id, agent: categoryOnlyData.agent_name, updated_at: categoryOnlyData.updated_at, length: categoryOnlyData.prompt_text?.length || 0, preview: (categoryOnlyData.prompt_text || '').slice(0, 100).replace(/\n/g, ' ') });
        systemPromptData = categoryOnlyData;
        usedIdentifier = category;
        usedType = 'category';
      } else {
        // Fallback: allow any prompt matching this category (even if tied to a theme)
        const { data: categoryAnyData, error: categoryAnyError } = await supabase
          .from('system_prompts')
          .select('prompt_text, theme, category, id, agent_name, created_at, updated_at')
          .eq('category', category)
          .eq('agent_name', 'Visual Prompt Generator')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (categoryAnyData && !categoryAnyError) {
          console.log('✅ Found category-based prompt (theme-bound):', { category, theme: categoryAnyData.theme, id: categoryAnyData.id, agent: categoryAnyData.agent_name, updated_at: categoryAnyData.updated_at, length: categoryAnyData.prompt_text?.length || 0, preview: (categoryAnyData.prompt_text || '').slice(0, 100).replace(/\n/g, ' ') });
          systemPromptData = categoryAnyData;
          usedIdentifier = category;
          usedType = 'category';
        }
      }
    }

    if (!systemPromptData) {
      const errorMsg = theme 
        ? `No system prompt found for theme '${theme}' or category '${category}'`
        : `No system prompt found for category '${category}'`;
      console.log('❌', errorMsg);
      throw new Error(errorMsg);
    }

    const categoryPrompt = { 
      prompt: systemPromptData.prompt_text, 
      theme: systemPromptData.theme,
      category: systemPromptData.category,
      usedIdentifier,
      usedType
    };

    // Build user message with theme/category information
    let userMessage = `Generate an image prompt for:
Title: ${title}
Description: ${description}`;

    if (usedType === 'category') {
      userMessage += `\nCategory: ${usedIdentifier}`;
    } else {
      userMessage += `\nTheme: ${systemPromptData.theme || theme || usedIdentifier}`;
      if (category) userMessage += `\nCategory: ${category}`;
    }

    // Add aspect ratio guidance if provided
    if (requestedAspectRatio) {
      let orientationHint = 'composition optimized for this orientation';
      if (requestedAspectRatio === '16:9') orientationHint = 'wide landscape composition';
      else if (requestedAspectRatio === '9:16') orientationHint = 'vertical portrait orientation';
      else if (requestedAspectRatio === '1:1') orientationHint = 'balanced square format';
      userMessage += `\nAspect Ratio: ${requestedAspectRatio} (${orientationHint})`;
    }


    // Add color theme instructions if provided
    if (colorTheme) {
      userMessage += `

Color Theme Instructions:
- Primary Color: ${colorTheme.primary_color}
- Secondary Color: ${colorTheme.secondary_color}
- Accent Color: ${colorTheme.accent_color}
- Background Color: ${colorTheme.background_color}
- Text Color: ${colorTheme.text_color}
- Visual Style: ${colorTheme.visual_style}
- Color Instructions: ${colorTheme.color_instructions}

Please incorporate these colors and visual style into the image prompt to ensure brand consistency.`;
    }

    // Add MANDATORY technical constraints and Private Safe Space guidelines
    userMessage += `

**MANDATORY TECHNICAL REQUIREMENTS:**
- Art Style: Vector illustration ONLY, flat design, NO photorealistic elements
- Rendering: Clean, modern vector style with solid colors and minimal gradients
- Composition: 80% safe zone - keep important elements in central 80% of frame
- Color Palette: Use professional blues (#2563eb, #1e40af), teals (#0891b2, #0e7490), accent greens (#16a34a), highlight orange (#ea580c), and neutral grays (#64748b, #f8fafc)
- Accessibility: High contrast, clear visual hierarchy, readable at various sizes
- Background: Clean, minimal, professional setting appropriate for ${usedType === 'category' ? category : (systemPromptData.theme || theme)}
- NEGATIVE PROMPTS: No photorealistic rendering, no complex gradients, no cluttered compositions, no dark/dramatic lighting

**COMPOSITION GUIDELINES:**
- Foreground: Main subject focused on ${(usedType === 'category' ? category : (systemPromptData.theme || theme))}-specific elements
- Mid-ground: Supporting professional context and workflow elements  
- Background: Clean, minimal professional environment
- Visual Flow: Clear focal point with logical eye movement through the composition

Private Safe Space Visual Tone:
- Supportive, inclusive, and non-judgmental
- Respect privacy: avoid PII and identifiable individuals; prefer abstract or generic figures
- Avoid fear-based or alarming imagery
- No text overlays, logos, or watermarks

**OUTPUT FORMAT:**
- Respond with ONLY the final image prompt as plain text, no preface or analysis
- If an aspect ratio is specified elsewhere, integrate it naturally (e.g., "wide landscape composition" or "vertical portrait orientation")
- Keep technical constraints mandatory while making composition engaging and professional`;

    // OpenAI request with proper format
    logger.debug('Prompt previews', {
      systemPreview: (categoryPrompt.prompt || '').slice(0, 400),
      userPreview: (userMessage || '').slice(0, 400)
    });

    const requestBody = {
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: categoryPrompt.prompt },
        { role: 'user', content: userMessage }
      ],
      max_completion_tokens: 3000, // Increased from 1024 to allow for both reasoning and content
      user: correlationId // Only include user field for tracking
    };

    console.log('🔍 OpenAI Request Details:', {
      url: 'https://api.openai.com/v1/chat/completions',
      model: requestBody.model,
      messageCount: requestBody.messages.length,
      systemPromptLength: categoryPrompt.prompt?.length || 0,
      userMessageLength: userMessage?.length || 0,
      correlationId,
      hasApiKey: !!openAIApiKey,
      apiKeyPrefix: openAIApiKey ? openAIApiKey.substring(0, 7) + '...' : 'MISSING'
    });

    logger.info('OpenAI chat request prepared', {
      model: requestBody.model,
      parameters: {
        has_max_tokens: Object.prototype.hasOwnProperty.call(requestBody as any, 'max_tokens'),
        has_max_completion_tokens: Object.prototype.hasOwnProperty.call(requestBody as any, 'max_completion_tokens'),
        max_tokens: (requestBody as any).max_tokens,
        max_completion_tokens: (requestBody as any).max_completion_tokens,
        user_set: !!(requestBody as any).user
      },
      message_summary: {
        system_len: (categoryPrompt.prompt?.length || 0),
        user_len: (userMessage?.length || 0)
      },
      request_keys: Object.keys(requestBody),
      correlationId
    });

    // Use timeout-aware OpenAI request function
    const requestStartTime = Date.now();
    const { response, openAIRequestId, responseTime } = await makeOpenAIRequest({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      correlationId,
    });
    
    // responseTime and openAIRequestId already from makeOpenAIRequest

    console.log('📥 OpenAI Response Details:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      openAIRequestId: openAIRequestId,
      responseTime,
      correlationId
    });

    // Use openAIRequestId from makeOpenAIRequest

    if (!response.ok) {
      // Get the actual error response body
      let errorBody: any = {};
      try {
        errorBody = await response.json();
        console.log('❌ OpenAI Error Response Body:', errorBody);
      } catch (parseError) {
        console.log('❌ Failed to parse OpenAI error response:', parseError);
        try {
          const errorText = await response.text();
          console.log('❌ OpenAI Error Response Text:', errorText);
        } catch (textError) {
          console.log('❌ Failed to get OpenAI error text:', textError);
        }
      }
      
      logger.error('OpenAI chat API error', {
        status: response.status,
        statusText: response.statusText,
        openAIRequestId: openAIRequestId,
        correlationId,
        errorBody
      });
      
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
    }

    const openAIData = await response.json();
    console.log('✅ OpenAI Success Response:', {
      hasChoices: !!openAIData.choices,
      choicesLength: openAIData.choices?.length || 0,
      hasUsage: !!openAIData.usage,
      model: openAIData.model,
      correlationId
    });
    
    const generatedText = openAIData.choices?.[0]?.message?.content;

    if (!generatedText || typeof generatedText !== 'string' || generatedText.trim() === '') {
      console.log('❌ Missing generated text. choices[0] snapshot:', {
        choice0: openAIData.choices?.[0],
        model: openAIData.model,
        usage: openAIData.usage,
        correlationId,
      });
      logger.error('Missing generated text from OpenAI chat response', {
        firstChoice: openAIData.choices?.[0],
        model: openAIData.model,
        usage: openAIData.usage,
        correlationId
      });
      throw new Error('No generated text received from OpenAI');
    }

    // Extract usage data for cost calculation
    const usageData = extractUsageFromOpenAIResponse(openAIData);
    promptTokens = usageData.promptTokens || 0;
    completionTokens = usageData.completionTokens || 0;
    tokensUsed = usageData.totalTokens || 0;
    estimatedCost = usageData.estimatedCost;

    success = true;

    // Store the generated prompt in cached_prompts table
    if (userId) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(title + description);
        const hashArray = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const identifierSlug = (usedIdentifier || (category || 'general')).toLowerCase().replace(/\s+/g, '_');
        const cacheKey = `image_prompt_${usedType}_${identifierSlug}_${hashHex.slice(0, 20)}`;
        
        await supabase.from('cached_prompts').insert({
          user_id: userId,
          cache_key: cacheKey,
          category: usedType === 'category' ? usedIdentifier : (category || null),
          prompt_text: generatedText,
          metadata: {
            title,
            description,
            theme: usedType === 'category' ? undefined : (systemPromptData.theme || theme || usedIdentifier),
            category: usedType === 'category' ? usedIdentifier : category,
            usedType,
            agent: 'Visual Prompt Generator',
            model: 'gpt-5-mini',
            generated_at: new Date().toISOString(),
            tokens_used: tokensUsed,
            estimated_cost: estimatedCost
          },
          hit_count: 1,
          version: 1,
          expires_at: null // No expiration for image prompts
        });
        console.log('✅ Prompt stored in cache successfully');
      } catch (cacheError) {
        console.error('❌ Failed to store prompt in cache:', cacheError);
        // Don't fail the request if caching fails
      }
    }

    console.log('✅ Prompt generated successfully');

    // Track API usage with enhanced attribution if we have userId
    if (userId) {
      const responseTime = Date.now() - startTime;
      await trackOpenAIUsage({
        userId,
        functionName: 'generate-image-prompt-dynamic',
        model: 'gpt-5-mini',
        requestType: 'text_generation',
        success,
        estimatedCost,
        tokensUsed,
        promptTokens,
        completionTokens,
        responseTimeMs: responseTime,
        metadata: requestMetadata,
        correlationId,
        openAIRequestId,
      });
    }

    return new Response(JSON.stringify({ 
      generatedPrompt: generatedText,
      theme: usedType === 'category' ? undefined : (systemPromptData.theme || theme || usedIdentifier),
      category: usedType === 'category' ? usedIdentifier : category,
      usedType,
      agent: 'Visual Prompt Generator',
      correlationId,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: tokensUsed,
        estimated_cost: estimatedCost
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in generate-image-prompt-dynamic function:', error);
    errorMessage = error.message || 'An unexpected error occurred';
    
    // Track failed API usage with enhanced attribution if we have userId
    if (userId) {
      try {
        const responseTime = Date.now() - startTime;
        await trackOpenAIUsage({
          userId,
          functionName: 'generate-image-prompt-dynamic',
          model: 'gpt-5-mini',
          requestType: 'text_generation',
          success: false,
          estimatedCost: 0,
          tokensUsed: 0,
          promptTokens: 0,
          completionTokens: 0,
          responseTimeMs: responseTime,
          errorMessage,
          metadata: requestMetadata,
          correlationId,
          openAIRequestId,
        });
      } catch (trackingError) {
        console.error('Failed to track error usage:', trackingError);
      }
    }

    return new Response(JSON.stringify({ 
      error: errorMessage,
      correlationId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});