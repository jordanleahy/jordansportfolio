import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/advanced-logger.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageEnhancementRequest {
  userInput: string;
  sourceContext?: {
    originalPrompt?: string;
    title?: string;
    description?: string;
    aspectRatio?: string;
  };
  referenceImageAnalysis?: {
    artisticStyle?: string;
    overallMood?: string;
    colorPalette?: string[];
    lightingMood?: string;
    complexity?: string;
  };
}

interface EnhancementResponse {
  enhancedPrompt: string;
  confidence: 'high' | 'medium' | 'low';
  clarificationNeeded?: string;
  suggestions?: string[];
  reasoning?: string;
}

serve(async (req) => {
  const logger = createLogger({ 
    functionName: 'image-enhancement-agent',
    correlationId: crypto.randomUUID()
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('🎨 Image Enhancement Agent started');

    if (!openAIApiKey) {
      logger.error('OPENAI_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { userInput, sourceContext, referenceImageAnalysis }: ImageEnhancementRequest = await req.json();

    if (!userInput?.trim()) {
      logger.warn('Empty user input received');
      return new Response(
        JSON.stringify({ error: 'User input is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logger.info('Processing enhancement request', { 
      inputLength: userInput.length,
      hasSourceContext: !!sourceContext,
      hasReferenceAnalysis: !!referenceImageAnalysis
    });

    // Build context for the AI
    let contextPrompt = `You are the Image Enhancement Agent, an expert in transforming basic user requests into detailed, professional image editing prompts.

CURRENT USER REQUEST: "${userInput}"

YOUR TASK:
1. Analyze the user's input for clarity and specificity
2. Transform vague requests into detailed, actionable editing instructions
3. Use professional image editing terminology
4. Consider the source context and reference image analysis if provided
5. Provide confidence level and suggestions

GUIDELINES:
- If the request is vague (like "make it better"), ask for clarification
- Use specific technical terms (lighting, contrast, saturation, composition, etc.)
- Consider color theory, composition principles, and visual hierarchy
- Be concise but comprehensive
- Focus on achievable edits rather than complete redesigns

`;

    // Add source context if available
    if (sourceContext) {
      contextPrompt += `\nSOURCE CONTEXT:`;
      if (sourceContext.title) contextPrompt += `\n- Title: ${sourceContext.title}`;
      if (sourceContext.description) contextPrompt += `\n- Description: ${sourceContext.description}`;
      if (sourceContext.originalPrompt) contextPrompt += `\n- Original Prompt: ${sourceContext.originalPrompt}`;
      if (sourceContext.aspectRatio) contextPrompt += `\n- Aspect Ratio: ${sourceContext.aspectRatio}`;
    }

    // Add reference image analysis if available
    if (referenceImageAnalysis) {
      contextPrompt += `\nREFERENCE IMAGE STYLE:`;
      if (referenceImageAnalysis.artisticStyle) contextPrompt += `\n- Style: ${referenceImageAnalysis.artisticStyle}`;
      if (referenceImageAnalysis.overallMood) contextPrompt += `\n- Mood: ${referenceImageAnalysis.overallMood}`;
      if (referenceImageAnalysis.colorPalette) contextPrompt += `\n- Colors: ${referenceImageAnalysis.colorPalette.join(', ')}`;
      if (referenceImageAnalysis.lightingMood) contextPrompt += `\n- Lighting: ${referenceImageAnalysis.lightingMood}`;
      if (referenceImageAnalysis.complexity) contextPrompt += `\n- Complexity: ${referenceImageAnalysis.complexity}`;
    }

    contextPrompt += `\n
RESPONSE FORMAT (JSON):
{
  "enhancedPrompt": "Detailed, professional editing instruction",
  "confidence": "high|medium|low",
  "clarificationNeeded": "Optional question if input is too vague",
  "suggestions": ["Alternative approach 1", "Alternative approach 2"],
  "reasoning": "Brief explanation of enhancement decisions"
}

EXAMPLES:
- "make it better" → ASK FOR CLARIFICATION
- "remove shadows" → "Remove or significantly reduce all shadow elements, maintaining natural lighting distribution and preserving object depth through subtle gradients instead of harsh shadows"
- "more professional" → "Enhance professional appearance by increasing contrast by 15-20%, applying subtle color grading toward cooler tones, improving sharpness of text elements, and ensuring clean, minimal composition"
- "like the reference image" → Use reference analysis to specify exact style elements

Respond with JSON only:`;

    logger.startTiming('openai_request');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: contextPrompt
          },
          {
            role: 'user',
            content: `Enhance this image editing request: "${userInput}"`
          }
        ],
        max_completion_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    });

    logger.endTiming('openai_request');

    if (!response.ok) {
      const errorData = await response.text();
      logger.error('OpenAI API error', { status: response.status, error: errorData });
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const enhancementResult = JSON.parse(data.choices[0].message.content) as EnhancementResponse;

    logger.success('Enhancement completed', {
      confidence: enhancementResult.confidence,
      promptLength: enhancementResult.enhancedPrompt.length,
      needsClarification: !!enhancementResult.clarificationNeeded
    });

    return new Response(
      JSON.stringify(enhancementResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Image enhancement failed', { error: error.message });
    return new Response(
      JSON.stringify({ 
        error: 'Failed to enhance image prompt',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});