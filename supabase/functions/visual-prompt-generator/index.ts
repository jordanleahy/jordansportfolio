/**
 * EDGE FUNCTION: Visual Prompt Generator
 * 
 * PURPOSE:
 * Specialized function for generating visual image prompts for social media content.
 * Extracted from the monolithic generate-image-prompt-dynamic for better performance
 * and maintainability.
 * 
 * INPUTS:
 * - postId: string - Social media post ID to fetch content
 * - themeId: string (optional) - Theme ID for theme-specific prompts
 * - aspectRatio: string (optional) - Desired aspect ratio (defaults to 1:1)
 * - systemPromptId: string (optional) - Explicit system prompt override
 * - colorTheme: object (optional) - Brand color theme configuration
 * 
 * OUTPUTS:
 * - Success: { generatedPrompt: string, category: string, agent: string, correlationId: string, usage: object }
 * - Error: { error: string }
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

// Safe space rules are now handled by safeSpace.ts in image generation functions

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  const correlationId = generateCorrelationId();
  const logger = createLogger({ functionName: 'visual-prompt-generator', correlationId });
  let success = false;
  let estimatedCost = 0;
  let tokensUsed = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let errorMessage: string | undefined;
  let requestMetadata: any = {};
  let openAIRequestId: string | undefined;

  logger.info('Visual Prompt Generator initiated', {
    correlationId,
    timestamp: new Date().toISOString(),
    method: req.method,
    version: 'v1.0.0'
  });

  const controller = new AbortController();
  let functionExitReason = 'unknown';
  
  const exitHandler = (reason: string) => {
    functionExitReason = reason;
    logger.info('Function exit', {
      correlationId,
      reason,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      success,
      userId: userId?.slice(0, 8)
    });
  };

  const cleanup = () => {
    controller.abort();
    exitHandler('cleanup_called');
  };

  globalThis.addEventListener('beforeunload', () => exitHandler('beforeunload'));
  globalThis.addEventListener('unload', () => exitHandler('unload'));

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = await req.json();
    let { postId, themeId, aspectRatio, aspect_ratio, systemPromptId, colorTheme, referenceAnalysis } = requestBody;

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

    // Initialize variables
    let title: string = '';
    let description: string = '';
    let category: string | null = null;
    const requestedAspectRatio = aspectRatio || aspect_ratio || '1:1';

    requestMetadata = { themeId, systemPromptId, postId, title, description, colorTheme, aspectRatio: requestedAspectRatio, correlationId, hasReferenceAnalysis: !!referenceAnalysis };

    logger.info('Request payload received', {
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

    // Fetch post and theme data in single optimized query with explicit JOIN
    logger.startTiming('database_post_fetch');
    const { data: postData, error: postError } = await supabase
      .from('social_media_posts')
      .select(`
        title, 
        description,
        theme_id,
        themes!social_media_posts_theme_id_fkey(
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
    
    // Extract theme data from the JOIN - handle both single object and array
    const themeData = Array.isArray(postData.themes) ? postData.themes[0] : postData.themes;
    if (themeData) {
      category = themeData.category;
    }
    
    logger.info('Theme data extracted', { 
      hasThemeData: !!themeData,
      themeDataType: themeData ? typeof themeData : 'null',
      themeName: themeData?.theme_name,
      category: themeData?.category,
      hasSystemPromptId: !!themeData?.visual_prompt_system_prompt_id
    });

    logger.info('Post data retrieved successfully', { 
      postId: postId.slice(0, 8),
      titleLength: title?.length || 0,
      descriptionLength: description?.length || 0,
      titlePreview: title?.slice(0, 50) || '',
      descriptionPreview: description?.slice(0, 50) || ''
    });

    // System prompt resolution logic
    let systemPromptData: any = null;
    let usedIdentifier: string;
    let usedType: 'systemPromptId' | 'themeId' | 'fallback';

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

    // Next: Use theme data from JOIN
    if (!systemPromptData && themeData && themeData.visual_prompt_system_prompt_id) {
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
    }

    // Validation: For theme-specific requests, system prompt should exist
    if (!systemPromptData && themeId && themeData) {
      logger.error('Theme system prompt validation failed', {
        themeId: themeId.slice(0, 8),
        themeName: themeData.theme_name,
        hasVisualPromptSystemPromptId: !!themeData.visual_prompt_system_prompt_id,
        errorType: 'system_prompt_not_ready'
      });
      throw new Error('Theme system prompt is not ready yet. Please wait for theme completion before generating individual prompts.');
    }

    // Fallback: generic Visual Prompt Generator prompt (only for non-theme requests)
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
      const errorMsg = `No Visual Prompt Generator system prompt found for themeId '${themeId}'`;
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
Theme: ${systemPromptData.theme || usedIdentifier}

**FRAMEWORK ACTIVATION INSTRUCTIONS:**
- Use the ${systemPromptData.theme || usedIdentifier} Visual Framework specified in your system instructions
- Include the specific foreground elements, subjects, and visual metaphors from your guidelines
- Follow the ${systemPromptData.theme || usedIdentifier}-specific style requirements and composition guidelines
- Reference the detailed content analysis framework provided in your instructions
- Incorporate the specified visual metaphors and color palette from your system prompt

**PREVENT GENERIC DEFAULTS:**
- Do not use generic business illustrations
- Avoid abstract professional scenes without healthcare/theme context
- Do not default to basic vector templates
- Generate specific, detailed prompts based on the comprehensive guidelines in your system instructions`;

    // Aspect ratio will be handled by safeSpace.ts during image generation

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
- Color Instructions: ${colorTheme.color_instructions}`;
    }

    // Add reference image analysis if provided
    if (referenceAnalysis) {
      userMessage += `

Reference Image Analysis:
Apply these visual characteristics from the reference image:
- Color Palette: ${referenceAnalysis.colors?.palette?.join(', ') || 'N/A'}
- Dominant Colors: ${referenceAnalysis.colors?.dominant?.join(', ') || 'N/A'}
- Mood: ${referenceAnalysis.mood?.overall || 'N/A'}
- Composition Style: ${referenceAnalysis.composition?.layout || 'N/A'}
- Artistic Style: ${referenceAnalysis.style?.artistic || 'N/A'}
- Lighting: ${referenceAnalysis.lighting?.quality || 'N/A'}

Incorporate these characteristics naturally into the generated prompt while maintaining the theme requirements.`;
    }

    logger.info('Preparing OpenAI request', {
      systemPromptLength: categoryPrompt.prompt.length,
      userMessageLength: userMessage.length,
      hasColorTheme: !!colorTheme,
      hasReferenceAnalysis: !!referenceAnalysis,
      aspectRatio: requestedAspectRatio
    });

    logger.startTiming('openai_request');

    const openAIRequestBody = {
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: categoryPrompt.prompt },
        { role: 'user', content: userMessage }
      ],
      max_completion_tokens: 3000,
      user: correlationId
    };

    logger.info('OpenAI chat request prepared', {
      model: openAIRequestBody.model,
      parameters: {
        has_max_completion_tokens: !!openAIRequestBody.max_completion_tokens,
        user_set: !!openAIRequestBody.user
      },
      message_summary: {
        system_len: categoryPrompt.prompt.length,
        user_len: userMessage.length
      },
      request_keys: Object.keys(openAIRequestBody),
      correlationId
    });

    logger.debug('Prompt previews', {
      systemPreview: categoryPrompt.prompt.slice(0, 300),
      userPreview: userMessage.slice(0, 300)
    });

    const openAIResponse = await makeOpenAIRequest({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIRequestBody),
      correlationId,
      timeout: 180000,
      operationType: 'content_generation'
    });

    logger.endTiming('openai_request');

    // Parse the response to get the actual OpenAI response data
    const openAIData = await openAIResponse.response.json();
    
    // Extract usage and costs
    const usageData = extractUsageFromOpenAIResponse(openAIData);
    promptTokens = usageData.promptTokens;
    completionTokens = usageData.completionTokens;
    tokensUsed = usageData.totalTokens;
    estimatedCost = usageData.estimatedCost;
    openAIRequestId = usageData.openAIRequestId;

    // Parse response
    let generatedText: string;
    logger.debug('OpenAI response structure', {
      hasChoices: !!openAIData.choices,
      choicesLength: openAIData.choices?.length || 0,
      firstChoiceKeys: openAIData.choices?.[0] ? Object.keys(openAIData.choices[0]) : [],
      messageKeys: openAIData.choices?.[0]?.message ? Object.keys(openAIData.choices[0].message) : [],
      correlationId
    });

    // Handle OpenAI refusals first
    if (openAIData.choices?.[0]?.message?.refusal) {
      logger.error('OpenAI content refusal detected', { 
        refusal: openAIData.choices[0].message.refusal,
        correlationId 
      });
      throw new Error(`Content generation refused: ${openAIData.choices[0].message.refusal}`);
    }

    // Extract content with comprehensive validation
    if (openAIData.choices?.[0]?.message?.content) {
      const rawContent = openAIData.choices[0].message.content;
      
      // Validate content is not just whitespace or minimal
      if (typeof rawContent === 'string' && rawContent.trim().length > 20) {
        generatedText = rawContent.trim();
        logger.debug('Content extracted and validated', { 
          contentLength: generatedText.length,
          correlationId 
        });
      } else {
        logger.error('Content too short or invalid', { 
          rawContent, 
          contentLength: rawContent?.length || 0,
          correlationId 
        });
        throw new Error('Generated content is too short or empty');
      }
    } else {
      // Enhanced error logging for debugging
      logger.error('Missing content in OpenAI response', { 
        fullResponse: {
          hasChoices: !!openAIData.choices,
          choicesCount: openAIData.choices?.length || 0,
          firstChoice: openAIData.choices?.[0] ? {
            hasMessage: !!openAIData.choices[0].message,
            messageKeys: openAIData.choices[0].message ? Object.keys(openAIData.choices[0].message) : [],
            content: openAIData.choices[0].message?.content,
            refusal: openAIData.choices[0].message?.refusal,
            finishReason: openAIData.choices[0].finish_reason
          } : null,
          error: openAIData.error,
          model: openAIData.model,
          usage: openAIData.usage
        },
        correlationId 
      });
      throw new Error('No generated text received from OpenAI - content may have been filtered or refused');
    }

    success = true;

    // Cache the generated prompt if user is authenticated
    if (userId && generatedText) {
      try {
        const cacheKey = `visual_prompt_${postId}_${requestedAspectRatio}`;
        await supabase
          .from('cached_prompts')
          .upsert({
            cache_key: cacheKey,
            prompt_text: generatedText,
            category: category || 'visual_prompt',
            user_id: userId,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            metadata: {
              postId,
              themeId,
              aspectRatio: requestedAspectRatio,
              usedType,
              usedIdentifier,
              systemPromptId: systemPromptData.id
            }
          });
      } catch (cacheError) {
        logger.warn('Failed to cache prompt', { error: cacheError });
      }
    }

    const responseData = {
      generatedPrompt: generatedText,
      theme: systemPromptData.theme || usedIdentifier,
      category: category,
      usedType,
      agent: 'Visual Prompt Generator',
      model: 'gpt-5-mini-2025-08-07',
      generated_at: new Date().toISOString(),
      tokens_used: tokensUsed,
      estimated_cost: estimatedCost,
      correlationId,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: tokensUsed,
        estimatedCost
      }
    };

    // Track usage asynchronously
    if (userId) {
      await trackOpenAIUsage({
        userId,
        functionName: 'visual-prompt-generator',
        model: 'gpt-5-mini-2025-08-07',
        requestType: 'text_generation',
        success,
        estimatedCost,
        tokensUsed,
        promptTokens,
        completionTokens,
        responseTimeMs: Date.now() - startTime,
        requestMetadata,
        openAIRequestId,
        correlationId
      });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in visual-prompt-generator function', error);

    // Track failed usage
    if (userId) {
      await trackOpenAIUsage({
        userId,
        functionName: 'visual-prompt-generator',
        model: 'gpt-5-mini-2025-08-07',
        requestType: 'text_generation',
        success: false,
        estimatedCost: 0,
        tokensUsed: 0,
        promptTokens: 0,
        completionTokens: 0,
        responseTimeMs: Date.now() - startTime,
        requestMetadata,
        openAIRequestId,
        errorMessage,
        correlationId
      });
    }

    return new Response(JSON.stringify({ 
      error: errorMessage,
      correlationId,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    cleanup();
  }
});