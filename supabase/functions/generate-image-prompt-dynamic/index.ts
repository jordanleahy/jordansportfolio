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
import { trackOpenAIUsage, generateCorrelationId, makeOpenAIRequest, enhanceOpenAIRequestBody, extractUsageFromOpenAIResponse } from '../_shared/openai-attribution.ts';
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

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { title, description, theme, category, colorTheme } = await req.json();

    if (!title || !description || (!theme && !category)) {
      throw new Error('Missing required fields: title, description, and either theme or category are required');
    }

    // Store request metadata with correlation ID
    requestMetadata = { theme, category, title, description, colorTheme, correlationId };

    logger.info('Request payload received', {
      theme,
      category,
      titleLength: title?.length || 0,
      descriptionLength: description?.length || 0,
      hasColorTheme: !!colorTheme
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
    let usedType: 'theme' | 'category';

    // First, try to get theme-specific prompt if theme is provided
    if (theme) {
      console.log('🎯 Looking for theme-based system prompt:', theme);
      const { data: themeData, error: themeError } = await supabase
        .from('system_prompts')
        .select('prompt_text, theme, category')
        .eq('theme', theme)
        .eq('agent_name', 'Visual Prompt Generator')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (themeData && !themeError) {
        console.log('✅ Found theme-based prompt:', theme);
        systemPromptData = themeData;
        usedIdentifier = theme;
        usedType = 'theme';
      } else {
        console.log('🔍 No theme-based prompt found, falling back to category:', category);
      }
    }

    // If no theme prompt found, fall back to category-based prompt
    if (!systemPromptData && category) {
      console.log('🏷️ Looking for category-based system prompt:', category);
      const { data: categoryData, error: categoryError } = await supabase
        .from('system_prompts')
        .select('prompt_text, theme, category')
        .eq('category', category)
        .eq('agent_name', 'Visual Prompt Generator')
        .eq('is_active', true)
        .is('theme', null) // Prefer category-only prompts over theme-specific ones
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (categoryData && !categoryError) {
        console.log('✅ Found category-based prompt:', category);
        systemPromptData = categoryData;
        usedIdentifier = category;
        usedType = 'category';
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

    if (usedType === 'theme') {
      userMessage += `\nTheme: ${usedIdentifier}`;
      if (category) userMessage += `\nCategory: ${category}`;
    } else {
      userMessage += `\nCategory: ${usedIdentifier}`;
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
- Background: Clean, minimal, professional setting appropriate for ${usedType === 'theme' ? theme : category}
- NEGATIVE PROMPTS: No photorealistic rendering, no complex gradients, no cluttered compositions, no dark/dramatic lighting

**COMPOSITION GUIDELINES:**
- Foreground: Main subject focused on ${usedType === 'theme' ? theme : category}-specific elements
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
      model: 'gpt-5-mini',
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

    // Make direct fetch call to avoid any potential issues with makeOpenAIRequest
    const requestStartTime = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-Request-Source': 'supabase-edge-function',
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseTime = Date.now() - requestStartTime;
    const responseOpenAIRequestId = response.headers.get('x-request-id') || 
                                   response.headers.get('request-id') || 
                                   correlationId;

    console.log('📥 OpenAI Response Details:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      openAIRequestId: responseOpenAIRequestId,
      responseTime,
      correlationId
    });

    openAIRequestId = responseOpenAIRequestId;

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
        openAIRequestId: responseOpenAIRequestId,
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
            theme: usedType === 'theme' ? usedIdentifier : undefined,
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
      theme: usedType === 'theme' ? usedIdentifier : undefined,
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