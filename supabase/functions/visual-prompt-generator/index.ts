/**
 * EDGE FUNCTION: Visual Prompt Generator
 * 
 * PURPOSE:
 * Specialized function for generating visual image prompts for each post item.
 * Provides optimized prompt generation with automatic safe space rule application.
 * 
 * INPUTS:
 * - postId: string - Social media post ID to fetch content
 * - themeId: string - Theme ID for theme-specific prompts
 * - systemPromptId: string (optional) - Explicit system prompt override
 * - colorTheme: object (optional) - Brand color theme configuration with colors and styling
 * - aspectRatio: string (optional) - Desired aspect ratio (e.g., "16:9", "9:16", "1:1") - defaults to "1:1"
 * - aspect_ratio: string (optional) - Alternative naming for aspectRatio parameter
 * - referenceAnalysis: object (optional) - Reference image analysis data for visual characteristics matching
 * 
 * NOTE: Aspect ratio and safe space composition rules are automatically applied via appendSafeSpaceRules().
 * System prompts should focus on content and style only, not aspect ratio specifications.
 * 
 * OUTPUTS:
 * - Success: { generatedPrompt: string, category: string, agent: string, correlationId: string, usage: object }
 * - Error: { error: string }
 */


import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { trackOpenAIUsage, generateCorrelationId, extractUsageFromOpenAIResponse, makeOpenAIRequest } from '../_shared/openai-attribution.ts';
import { createLogger } from '../_shared/advanced-logger.ts';
import { appendSafeSpaceRules } from '../_shared/safeSpace.ts';

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
  const logger = createLogger({ functionName: 'visual-prompt-generator', correlationId });
  let success = false;
  let estimatedCost = 0;
  let tokensUsed = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let errorMessage: string | undefined;
  let requestMetadata: any = {};
  let openAIRequestId: string | undefined;

  console.log('🚀 FUNCTION_START: Visual Prompt Generator initiated', {
    correlationId,
    timestamp: new Date().toISOString(),
    method: req.method,
    version: 'v1.0.0'
  });

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

    // Pre-request validation and logging
    logger.info('Pre-request validation', {
      systemPromptLength: categoryPrompt.prompt.length,
      userMessageLength: userMessage.length,
      hasColorTheme: !!colorTheme,
      hasReferenceAnalysis: !!referenceAnalysis,
      aspectRatio: requestedAspectRatio,
      tokenEstimate: Math.ceil((categoryPrompt.prompt.length + userMessage.length) / 4),
      maxTokensAllowed: 3000
    });

    // Estimate input tokens (rough approximation: 1 token ≈ 4 characters)
    const inputTokensEstimate = Math.ceil((categoryPrompt.prompt.length + userMessage.length) / 4);
    
    // Model fallback configuration with conservative token limits
    const modelConfigs = [
      {
        name: 'gpt-5-mini-2025-08-07',
        maxTokens: Math.max(500, Math.min(1500, 8000 - inputTokensEstimate)), // Leave room for input tokens
        maxInputTokens: 8000,
        description: 'Primary GPT-5 Mini model'
      },
      {
        name: 'gpt-4.1-2025-04-14',
        maxTokens: Math.max(500, Math.min(2000, 12000 - inputTokensEstimate)),
        maxInputTokens: 12000,
        description: 'Fallback GPT-4.1 model'
      },
      {
        name: 'gpt-4o-mini',
        maxTokens: Math.max(500, Math.min(2000, 12000 - inputTokensEstimate)),
        maxInputTokens: 12000,
        description: 'Legacy fallback model'
      }
    ];

    let generatedText: string | null = null;
    let lastError: Error | null = null;
    let usedModel: string | null = null;

    // Try each model in sequence until one succeeds
    for (let attemptIndex = 0; attemptIndex < modelConfigs.length && !generatedText; attemptIndex++) {
      const modelConfig = modelConfigs[attemptIndex];
      
      try {
        // Pre-flight token validation
        if (inputTokensEstimate > modelConfig.maxInputTokens) {
          logger.warn('Input tokens exceed model limit, skipping', {
            model: modelConfig.name,
            inputTokensEstimate,
            maxInputTokens: modelConfig.maxInputTokens,
            correlationId
          });
          throw new Error(`Input too long for ${modelConfig.name} (${inputTokensEstimate} tokens > ${modelConfig.maxInputTokens} limit)`);
        }

        logger.info('Model attempt', {
          attemptNumber: attemptIndex + 1,
          totalAttempts: modelConfigs.length,
          selectedModel: modelConfig.name,
          description: modelConfig.description,
          inputTokensEstimate,
          maxCompletionTokens: modelConfig.maxTokens,
          correlationId
        });

        logger.startTiming(`openai_request_attempt_${attemptIndex + 1}`);

        const openAIRequestBody = {
          model: modelConfig.name,
          messages: [
            { role: 'system', content: categoryPrompt.prompt },
            { role: 'user', content: userMessage }
          ],
          max_completion_tokens: modelConfig.maxTokens,
          user: correlationId
        };

        // Enhanced request logging
        logger.info('OpenAI request body prepared', {
          model: openAIRequestBody.model,
          messagesCount: openAIRequestBody.messages.length,
          parameters: {
            max_completion_tokens: openAIRequestBody.max_completion_tokens,
            user_id_set: !!openAIRequestBody.user,
            is_legacy_model: modelConfig.name.includes('gpt-4o')
          },
          message_details: {
            system_length: categoryPrompt.prompt.length,
            user_length: userMessage.length,
            total_input_chars: categoryPrompt.prompt.length + userMessage.length
          },
          request_structure: Object.keys(openAIRequestBody),
          correlationId
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

        logger.endTiming(`openai_request_attempt_${attemptIndex + 1}`);

        // Parse the response to get the actual OpenAI response data
        const openAIData = await openAIResponse.response.json();
        
        // Comprehensive response logging
        logger.info('OpenAI response received', {
          attempt: attemptIndex + 1,
          model: modelConfig.name,
          httpStatus: openAIResponse.response.status,
          httpStatusText: openAIResponse.response.statusText,
          responseOk: openAIResponse.response.ok,
          hasData: !!openAIData,
          responseSize: JSON.stringify(openAIData).length,
          correlationId
        });

        // Check for OpenAI API errors first
        if (openAIData.error) {
          logger.error('OpenAI API returned error', {
            attempt: attemptIndex + 1,
            model: modelConfig.name,
            errorType: openAIData.error.type,
            errorCode: openAIData.error.code,
            errorMessage: openAIData.error.message,
            errorParam: openAIData.error.param,
            correlationId
          });
          throw new Error(`OpenAI API Error (${modelConfig.name}): ${openAIData.error.message}`);
        }

        // Extract usage and costs
        const usageData = extractUsageFromOpenAIResponse(openAIData);
        promptTokens = usageData.promptTokens;
        completionTokens = usageData.completionTokens;
        tokensUsed = usageData.totalTokens;
        estimatedCost = usageData.estimatedCost;
        openAIRequestId = usageData.openAIRequestId;

        // Detailed choice analysis
        if (!openAIData.choices || openAIData.choices.length === 0) {
          throw new Error(`No choices in OpenAI response from ${modelConfig.name}`);
        }

        const choice = openAIData.choices[0];
        
        // Check for refusal (new OpenAI safety feature)
        if (choice.message?.refusal) {
          logger.warn('OpenAI refused content generation', {
            attempt: attemptIndex + 1,
            model: modelConfig.name,
            refusalReason: choice.message.refusal,
            correlationId
          });
          throw new Error(`OpenAI refused request: ${choice.message.refusal}`);
        }

        // Parse response content
        const messageContent = choice.message?.content;

        if (messageContent && messageContent.trim().length > 0) {
          const trimmedContent = messageContent.trim();
          
          logger.info('Content successfully generated', {
            attempt: attemptIndex + 1,
            model: modelConfig.name,
            contentLength: trimmedContent.length,
            finishReason: choice.finish_reason,
            correlationId
          });

          // Apply safe space rules to the generated prompt
          const originalLength = trimmedContent.length;
          generatedText = appendSafeSpaceRules(trimmedContent, requestedAspectRatio);
          usedModel = modelConfig.name;
          
          logger.info('Safe space rules applied', { 
            aspectRatio: requestedAspectRatio,
            originalLength,
            finalPromptLength: generatedText.length,
            lengthIncrease: generatedText.length - originalLength,
            usedModel,
            correlationId 
          });

          // Success! Break out of the model attempt loop
          break;
        } else {
          // Log the failure and continue to next model
          const isTokenLimit = choice.finish_reason === 'length';
          logger.warn('Model returned empty content, trying next model', {
            attempt: attemptIndex + 1,
            model: modelConfig.name,
            hasContent: !!messageContent,
            contentLength: messageContent?.length || 0,
            finishReason: choice.finish_reason,
            isTokenLimit,
            inputTokensEstimate,
            maxCompletionTokens: modelConfig.maxTokens,
            correlationId
          });
          
          const errorMsg = isTokenLimit 
            ? `Token limit exceeded for ${modelConfig.name} (estimated ${inputTokensEstimate} input + ${modelConfig.maxTokens} completion tokens)`
            : `Empty content from ${modelConfig.name}`;
          throw new Error(errorMsg);
        }

      } catch (error) {
        lastError = error as Error;
        logger.error('Model attempt failed', {
          attempt: attemptIndex + 1,
          model: modelConfig.name,
          error: lastError.message,
          willRetry: attemptIndex < modelConfigs.length - 1,
          correlationId
        });
        
        // If this was the last attempt, don't continue the loop
        if (attemptIndex === modelConfigs.length - 1) {
          break;
        }
        
        // Small delay before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Check if we successfully generated content
    if (!generatedText) {
      logger.error('All models failed to generate content', {
        totalAttempts: modelConfigs.length,
        lastError: lastError?.message,
        correlationId
      });
      throw new Error(`All models failed to generate content. Last error: ${lastError?.message || 'Unknown error'}`);
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
      model: usedModel || 'unknown',
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
        model: usedModel || 'unknown',
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
    console.error('❌ Error in visual-prompt-generator function:', error);

    // Track failed usage
    if (userId) {
      await trackOpenAIUsage({
        userId,
        functionName: 'visual-prompt-generator',
        model: usedModel || 'unknown',
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
