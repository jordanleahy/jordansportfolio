/**
 * EDGE FUNCTION: Generate Image Prompt Dynamic
 * 
 * PURPOSE:
 * Generates category-specific image prompts for social media content using AI and category-specific
 * system prompts. Supports color theme integration and provides comprehensive usage tracking
 * for cost monitoring and optimization.
 * 
 * INPUTS:
 * - postId: string - Social media post ID to fetch content and theme data
 * - themeId: string (optional) - Theme ID for specific theme-based prompt generation
 * - aspectRatio: string (optional) - Desired aspect ratio for the image (defaults to 1:1 for square images)
 * 
 * OUTPUTS:
 * - Success: { generatedPrompt: string, category: string, agent: string, correlationId: string, usage: object }
 * - Error: { error: string }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-4o-mini for prompt generation)
 * - Supabase Database (social_media_posts, system_prompts, cached_prompts tables)
 * - OpenAI Attribution System (usage tracking and cost calculation)
 * 
 * USAGE:
 * Called from: Content creation workflows, image generation pipelines, social media management
 * Authentication: Required - fetches user-specific post data
 * 
 * FLOW:
 * 1. Validate required postId input
 * 2. Fetch post data (title, description, category) and theme data from database
 * 3. Retrieve theme-specific system prompt with category fallback from system_prompts table
 * 4. Integrate color theme instructions if provided for brand consistency
 * 5. Generate detailed image prompt using OpenAI with Visual Prompt Generator
 * 6. Cache generated prompt for future reuse (if user authenticated)
 * 7. Track API usage, costs, and performance metrics
 * 8. Return optimized prompt ready for AI image generation
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

// Helper function to get aspect ratio-specific safe space rules
function getSafeSpaceRule(aspectRatio: string): string {
  switch (aspectRatio) {
    case '16:9':
      return 'CRITICAL SAFE SPACE: Maintain 15-20% margins on left and right sides, 10% margins on top and bottom. Keep all workflow elements well within safe boundaries to prevent edge-touching content.';
    case '9:16':
      return 'CRITICAL SAFE SPACE: Maintain 12-15% margins on top and bottom, 8-10% margins on left and right sides. Ensure vertical breathing room and proper spacing.';
    case '1:1':
      return 'CRITICAL SAFE SPACE: Maintain balanced 18-20% margins on all sides, especially TOP MARGIN for letter-based content. Letters must be centered with generous breathing room from top edge. Keep central composition well-framed with extra vertical spacing.';
    case '4:3':
      return 'CRITICAL SAFE SPACE: Maintain 12% margins on left and right, 10% margins on top and bottom. Ensure proper horizontal spacing and balanced composition.';
    case '3:4':
      return 'CRITICAL SAFE SPACE: Maintain 10-12% margins on top and bottom, 8% margins on left and right sides. Optimize for social media viewing with proper edge spacing.';
    default:
      return 'Maintain 80% safe zone - keep important elements in central 80% of frame';
  }
}

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

  // Function start tracking (essential for debugging)
  console.log('🚀 FUNCTION_START: Request initiated', {
    correlationId,
    timestamp: new Date().toISOString(),
    method: req.method,
    version: 'v2.0.0'
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

    const requestBody = await req.json();
    
    // Validate request structure
    
    let { postId, theme, colorTheme, aspectRatio, aspect_ratio, themeId, systemPromptId, referenceAnalysis, extractedCharacteristics } = requestBody;

    logger.info('Request validation', {
      receivedFields: Object.keys(requestBody),
      postId: postId ? `${String(postId).slice(0, 8)}...` : null,
      themeId: themeId ? `${String(themeId).slice(0, 8)}...` : null,
      hasAspectRatio: !!(aspectRatio || aspect_ratio),
      hasColorTheme: !!colorTheme
    });

    if (!postId || !themeId) {
      const errorDetails = {
        missing: {
          postId: !postId,
          themeId: !themeId
        },
        received: requestBody,
        correlationId
      };
      throw new Error(`Missing required fields: ${!postId ? 'postId' : ''} ${!themeId ? 'themeId' : ''}`.trim());
    }

    // Initialize variables - will be fetched from database
    let title: string = '';
    let description: string = '';
    let category: string | null = null;

    const requestedAspectRatio = aspectRatio || aspect_ratio || null;

    // Store initial request metadata with correlation ID (will be updated after fetching data)
    requestMetadata = { theme, themeId, systemPromptId, postId, title, description, colorTheme, aspectRatio: requestedAspectRatio, correlationId, hasReferenceAnalysis: !!referenceAnalysis };

    logger.info('Request payload received', {
      theme,
      themeId,
      postId: postId ? postId.slice(0, 8) : null,
      systemPromptId: systemPromptId ? `${String(systemPromptId).slice(0,8)}…` : null,
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

    // Fetch post and theme data in single optimized query with JOIN
    logger.startTiming('database_post_fetch');
    const { data: postData, error: postError } = await supabase
      .from('social_media_posts')
      .select(`
        title, 
        description,
        themes!inner(
          visual_prompt_system_prompt_id,
          theme_name,
          category
        )
      `)
      .eq('id', postId)
      .maybeSingle();

    logger.endTiming('database_post_fetch');
    
    if (postError) {
      logger.error('Database error fetching post', { postId, error: postError.message, code: postError.code });
      throw new Error(`Failed to fetch post data: ${postError.message}`);
    }

    if (!postData) {
      logger.error('Post not found', { postId });
      throw new Error(`Post not found with ID: ${postId}`);
    }

    title = postData.title;
    description = postData.description;
    
    // Extract theme data from the JOIN
    const themeData = postData.themes;
    if (themeData) {
      category = themeData.category;
    }

    logger.info('Post data retrieved successfully', { 
      postId: postId.slice(0, 8),
      titleLength: title?.length || 0,
      descriptionLength: description?.length || 0,
      titlePreview: title?.slice(0, 50) || '',
      descriptionPreview: description?.slice(0, 50) || ''
    });

    let systemPromptData: any = null;
    let usedIdentifier: string;
    let usedType: 'systemPromptId' | 'themeId' | 'theme' | 'category' | 'fallback';

    // Highest priority: explicit systemPromptId
    if (!systemPromptData && systemPromptId) {
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
      }
    }

    // Next: Use theme data from JOIN if available, otherwise fetch separately
    if (!systemPromptData && themeId) {
      if (themeData && themeData.visual_prompt_system_prompt_id) {
        // Use theme data from JOIN to avoid extra query
        logger.info('Theme data retrieved from JOIN', {
          themeId: themeId.slice(0, 8),
          themeName: themeData.theme_name,
          category: themeData.category,
          hasSystemPromptId: !!themeData.visual_prompt_system_prompt_id
        });
        
        const { data: spFromTheme, error: spFromThemeErr } = await supabase
          .from('system_prompts')
          .select('prompt_text, theme, id, agent_name, created_at, updated_at')
          .eq('id', themeData.visual_prompt_system_prompt_id)
          .eq('is_active', true)
          .maybeSingle();
        if (spFromTheme && !spFromThemeErr) {
          systemPromptData = spFromTheme;
          usedIdentifier = themeData.theme_name || spFromTheme.theme || String(themeId);
          usedType = 'themeId';
        }
      } else {
        // Fallback: fetch theme data separately if not included in JOIN
        logger.startTiming('database_theme_fetch');
        const { data: themeRow, error: themeRowErr } = await supabase
          .from('themes')
          .select('visual_prompt_system_prompt_id, theme_name, category')
          .eq('id', themeId)
          .maybeSingle();
        logger.endTiming('database_theme_fetch');
        
        if (themeRow && !themeRowErr) {
          category = themeRow.category;
          logger.info('Theme data retrieved', {
            themeId: themeId.slice(0, 8),
            themeName: themeRow.theme_name,
            category: themeRow.category,
            hasSystemPromptId: !!themeRow.visual_prompt_system_prompt_id
          });
          
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
            }
          }
        }
      }
      
      // If still no system prompt, try theme_id lookup
      if (!systemPromptData) {
        const { data: spByThemeId, error: spByThemeIdErr } = await supabase
          .from('system_prompts')
          .select('prompt_text, theme, id, agent_name, created_at, updated_at, theme_id')
          .eq('theme_id', themeId)
          .eq('agent_name', 'Visual Prompt Generator')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (spByThemeId && !spByThemeIdErr) {
          systemPromptData = spByThemeId;
          usedIdentifier = themeData?.theme_name || String(themeId);
          usedType = 'themeId';
        }
      }
    }

    // Theme string search disabled: only themeId or systemPromptId are used.
    // If themeId resolution fails, we rely on the generic fallback below.

    // Finally: generic fallback to any Visual Prompt Generator prompt
    if (!systemPromptData) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('system_prompts')
        .select('prompt_text, theme, id, agent_name, created_at, updated_at, theme_id')
        .eq('agent_name', 'Visual Prompt Generator')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackData && !fallbackError) {
        systemPromptData = fallbackData;
        usedIdentifier = 'fallback';
        usedType = 'fallback';
      }
    }

    if (!systemPromptData) {
      const errorMsg = themeId
        ? `No system prompt found for themeId '${themeId}'${theme ? ` (theme: '${theme}')` : ''}`
        : (theme ? `No system prompt found for theme '${theme}'` : 'No system prompt found');
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
Description: ${description}
Theme: ${systemPromptData.theme || theme || usedIdentifier}

**FRAMEWORK ACTIVATION INSTRUCTIONS:**
- Use the ${systemPromptData.theme || theme || usedIdentifier} Visual Framework specified in your system instructions
- Include the specific foreground elements, subjects, and visual metaphors from your guidelines
- Follow the ${systemPromptData.theme || theme || usedIdentifier}-specific style requirements and composition guidelines
- Reference the detailed content analysis framework provided in your instructions
- Incorporate the specified visual metaphors and color palette from your system prompt

**PREVENT GENERIC DEFAULTS:**
- Do not use generic business illustrations
- Avoid abstract professional scenes without healthcare/theme context
- Do not default to basic vector templates
- Generate specific, detailed prompts based on the comprehensive guidelines in your system instructions`;

    // Add aspect ratio guidance with specific safe space rules
    if (requestedAspectRatio) {
      let orientationHint = 'composition optimized for this orientation';
      let safeSpaceRules = '';
      let negativePrompts = '';
      
      if (requestedAspectRatio === '16:9') {
        orientationHint = 'wide landscape composition';
        safeSpaceRules = 'CRITICAL: Maintain 15-20% margins on left and right sides, 10% margins on top and bottom. Keep all workflow elements well within safe boundaries.';
        negativePrompts = 'No cramped horizontal layouts, no elements touching left/right edges, no edge-to-edge content';
      } else if (requestedAspectRatio === '9:16') {
        orientationHint = 'vertical portrait orientation';
        safeSpaceRules = 'CRITICAL: Maintain 12-15% margins on top and bottom, 8-10% margins on left and right sides. Ensure vertical breathing room.';
        negativePrompts = 'No elements touching top/bottom edges, maintain vertical breathing room, no cramped vertical layouts';
      } else if (requestedAspectRatio === '1:1') {
        orientationHint = 'balanced square format';
        safeSpaceRules = 'CRITICAL: Maintain balanced 18-20% margins on all sides, especially TOP MARGIN for letter-based content. Letters must be centered with generous breathing room from top edge. Keep central composition well-framed with extra vertical spacing.';
        negativePrompts = 'No corner-to-corner compositions, maintain balanced spacing, no edge-hugging elements, NEVER allow letters to touch or get close to the top edge, no cramped letter positioning';
      } else if (requestedAspectRatio === '4:3') {
        orientationHint = 'standard landscape format';
        safeSpaceRules = 'CRITICAL: Maintain 12% margins on left and right, 10% margins on top and bottom. Ensure proper horizontal spacing.';
        negativePrompts = 'No cramped compositions, no elements touching frame borders, maintain horizontal balance';
      } else if (requestedAspectRatio === '3:4') {
        orientationHint = 'social media portrait format';
        safeSpaceRules = 'CRITICAL: Maintain 10-12% margins on top and bottom, 8% margins on left and right sides. Optimize for social media viewing.';
        negativePrompts = 'No elements touching edges, maintain social media safe zones, no cramped vertical content';
      }
      
      userMessage += `\nAspect Ratio: ${requestedAspectRatio} (${orientationHint})
${safeSpaceRules}
NEGATIVE PROMPTS for ${requestedAspectRatio}: ${negativePrompts}`;
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

    // Add reference image analysis if provided
    if (referenceAnalysis && extractedCharacteristics) {
      userMessage += `

Reference Image Analysis (apply these characteristics):`;

      if (extractedCharacteristics.dominantColors?.length > 0) {
        userMessage += `
- Color Palette: Incorporate colors from this palette: ${extractedCharacteristics.dominantColors.join(', ')}
- Color Mood: ${extractedCharacteristics.colorMood}`;
      }

      if (extractedCharacteristics.compositionStyle) {
        userMessage += `
- Composition Style: ${extractedCharacteristics.compositionStyle}`;
      }

      if (extractedCharacteristics.artisticStyle) {
        userMessage += `
- Artistic Style: Adapt elements from this style: ${extractedCharacteristics.artisticStyle}`;
      }

      if (extractedCharacteristics.lightingMood) {
        userMessage += `
- Lighting Mood: ${extractedCharacteristics.lightingMood}`;
      }

      if (extractedCharacteristics.overallMood) {
        userMessage += `
- Overall Mood: ${extractedCharacteristics.overallMood}`;
      }

      userMessage += `

Please integrate these reference characteristics naturally while maintaining the professional vector illustration style and ensuring the content remains relevant to the ${usedType === 'category' ? category : (systemPromptData.theme || theme)} theme.`;
    }

    // Add MANDATORY technical constraints and Private Safe Space guidelines with dynamic safe space rules
    const dynamicSafeSpaceRule = requestedAspectRatio ? 
      getSafeSpaceRule(requestedAspectRatio) : 
      'Maintain 80% safe zone - keep important elements in central 80% of frame';
      
    userMessage += `

**MANDATORY TECHNICAL REQUIREMENTS:**
- Art Style: Vector illustration ONLY, flat design, NO photorealistic elements
- Rendering: Clean, modern vector style with solid colors and minimal gradients
- Composition: ${dynamicSafeSpaceRule}
- Color Palette: Use professional blues (#2563eb, #1e40af), teals (#0891b2, #0e7490), accent greens (#16a34a), highlight orange (#ea580c), and neutral grays (#64748b, #f8fafc)
- Accessibility: High contrast, clear visual hierarchy, readable at various sizes
- Background: Clean, minimal, professional setting appropriate for ${usedType === 'category' ? category : (systemPromptData.theme || theme)}
- NEGATIVE PROMPTS: No photorealistic rendering, no complex gradients, no cluttered compositions, no dark/dramatic lighting, no edge-to-edge content

**COMPOSITION GUIDELINES:**
- Foreground: Main subject focused on ${(usedType === 'category' ? category : (systemPromptData.theme || theme))}-specific elements
- Mid-ground: Supporting professional context and workflow elements  
- Background: Clean, minimal professional environment
- Visual Flow: Clear focal point with logical eye movement through the composition

Private Safe Space Visual Tone:
- Supportive, inclusive, and non-judgmental
- Respect privacy: avoid PII and identifiable individuals; prefer abstract or generic figures
- Avoid fear-based or alarming imagery
- On-image text: allowed sparingly when it adds clarity (e.g., short labels 2–6 words); avoid large headlines; never include watermarks or logos

**OUTPUT FORMAT:**
- DO NOT start with formulaic phrases like "Vector illustration, flat design, 16:9 aspect ratio"
- Begin directly with the specific scene description using the detailed framework from your system instructions
- Focus on the unique elements from your ${systemPromptData.theme || theme || usedIdentifier} guidelines first
- Include technical constraints naturally within the scene description
- Respond with ONLY the final image prompt as plain text, no preface or analysis`;

    // OpenAI request with proper format
    logger.info('Preparing OpenAI request', {
      systemPromptLength: categoryPrompt.prompt?.length || 0,
      userMessageLength: userMessage?.length || 0,
      hasColorTheme: !!colorTheme,
      hasReferenceAnalysis: !!referenceAnalysis,
      aspectRatio: requestedAspectRatio
    });
    
    logger.debug('Prompt previews', {
      systemPreview: (categoryPrompt.prompt || '').slice(0, 400),
      userPreview: (userMessage || '').slice(0, 400)
    });

    const openAIRequestBody = {
      model: 'gpt-4.1-2025-04-14', // Switch to more reliable model
      messages: [
        { role: 'system', content: categoryPrompt.prompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 3000, // Use max_tokens for GPT-4.1
      temperature: 0.7, // GPT-4.1 supports temperature
      user: correlationId // Only include user field for tracking
    };

    logger.startTiming('openai_request');

    logger.info('OpenAI chat request prepared', {
      model: openAIRequestBody.model,
      parameters: {
        has_max_tokens: 'max_tokens' in openAIRequestBody,
        has_max_completion_tokens: 'max_completion_tokens' in openAIRequestBody,
        max_completion_tokens: openAIRequestBody.max_completion_tokens,
        user_set: !!openAIRequestBody.user
      },
      message_summary: {
        system_len: categoryPrompt.prompt?.length || 0,
        user_len: userMessage?.length || 0
      },
      request_keys: Object.keys(openAIRequestBody),
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
      body: JSON.stringify(openAIRequestBody),
      correlationId,
    });
    
    // responseTime and openAIRequestId already from makeOpenAIRequest

    // Response details logged by makeOpenAI function

    // Use openAIRequestId from makeOpenAIRequest

    if (!response.ok) {
      // Get the actual error response body
      let errorBody: any = {};
      try {
        errorBody = await response.json();
      } catch (parseError) {
        try {
          const errorText = await response.text();
        } catch (textError) {
          // Error parsing failed
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
    
    // Enhanced response parsing with fallbacks and detailed logging
    let generatedText = null;
    
    // Log full response structure when debugging
    logger.debug('OpenAI response structure', {
      hasChoices: !!openAIData.choices,
      choicesLength: openAIData.choices?.length || 0,
      firstChoiceKeys: openAIData.choices?.[0] ? Object.keys(openAIData.choices[0]) : [],
      messageKeys: openAIData.choices?.[0]?.message ? Object.keys(openAIData.choices[0].message) : [],
      correlationId
    });
    
    // Try multiple extraction methods
    if (openAIData.choices && openAIData.choices.length > 0) {
      const firstChoice = openAIData.choices[0];
      
      // Method 1: Standard chat completion format
      if (firstChoice.message?.content) {
        generatedText = firstChoice.message.content;
        logger.debug('Extracted using message.content', { correlationId });
      }
      // Method 2: Legacy completion format
      else if (firstChoice.text) {
        generatedText = firstChoice.text;
        logger.debug('Extracted using text field', { correlationId });
      }
      // Method 3: Streaming delta format
      else if (firstChoice.delta?.content) {
        generatedText = firstChoice.delta.content;
        logger.debug('Extracted using delta.content', { correlationId });
      }
      // Method 4: Direct content field
      else if (firstChoice.content) {
        generatedText = firstChoice.content;
        logger.debug('Extracted using direct content', { correlationId });
      }
    }

    if (!generatedText || typeof generatedText !== 'string' || generatedText.trim() === '') {
      logger.error('Missing generated text from OpenAI chat response', {
        error: {},
        responseStructure: {
          hasChoices: !!openAIData.choices,
          choicesCount: openAIData.choices?.length || 0,
          firstChoice: openAIData.choices?.[0] ? {
            keys: Object.keys(openAIData.choices[0]),
            hasMessage: !!openAIData.choices[0].message,
            messageKeys: openAIData.choices[0].message ? Object.keys(openAIData.choices[0].message) : [],
            messageContent: openAIData.choices[0].message?.content,
            hasText: !!openAIData.choices[0].text,
            text: openAIData.choices[0].text,
            hasDelta: !!openAIData.choices[0].delta,
            deltaContent: openAIData.choices[0].delta?.content
          } : null,
          model: openAIData.model,
          usage: openAIData.usage
        },
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
        const identifierSlug = (usedIdentifier || 'theme').toLowerCase().replace(/\s+/g, '_');
        const cacheKey = `image_prompt_${usedType}_${identifierSlug}_${hashHex.slice(0, 20)}`;
        
        await supabase.from('cached_prompts').insert({
          user_id: userId,
          cache_key: cacheKey,
          category: null,
          prompt_text: generatedText,
          metadata: {
            title,
            description,
            theme: (systemPromptData.theme || theme || usedIdentifier),
            category: null,
            usedType,
            agent: 'Visual Prompt Generator',
            model: 'gpt-4.1-2025-04-14',
            generated_at: new Date().toISOString(),
            tokens_used: tokensUsed,
            estimated_cost: estimatedCost
          },
          hit_count: 1,
          version: 1,
          expires_at: null // No expiration for image prompts
        });
      } catch (cacheError) {
        // Don't fail the request if caching fails
      }
    }

    

    // Track API usage with enhanced attribution if we have userId
    if (userId) {
      const responseTime = Date.now() - startTime;
      await trackOpenAIUsage({
        userId,
        functionName: 'generate-image-prompt-dynamic',
        model: 'gpt-4.1-2025-04-14',
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
      theme: usedType === 'fallback' ? undefined : (systemPromptData.theme || theme || usedIdentifier),
      category: undefined,
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
          model: 'gpt-5-nano-2025-08-07',
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