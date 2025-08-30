import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

// HARDCODED TOKEN LIMITS - Safe and independent of config files
const MAX_COMPLETION_TOKENS = 5000; // Increased to prevent JSON parsing errors
const MAX_PROMPT_TOKENS = 1000;
const GPT_MODEL = 'gpt-5-2025-08-07'; // Use latest GPT-5 model

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThemeGenerationRequest {
  idea: string;
  context?: string;
  category?: string;
}

interface ThemeGenerationResponse {
  success: boolean;
  theme?: any;
  error?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

serve(async (req) => {
  console.log('🎯 user-idea-streaming-image-pipeline started', { 
    method: req.method,
    url: req.url,
    hardcodedTokenLimits: { MAX_COMPLETION_TOKENS, MAX_PROMPT_TOKENS }
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ThemeGenerationRequest = await req.json();
    const { idea, context = '', category = 'general' } = body;

    console.log('🎨 Starting theme generation', { 
      ideaLength: idea?.length || 0,
      category,
      contextLength: context.length
    });

    // Generate theme using OpenAI with hardcoded token limits
    const themeResult = await generateTheme(idea, context, category, openaiApiKey);

    if (!themeResult.success) {
      console.error('❌ Theme generation failed:', themeResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: themeResult.error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Theme generation successful', {
      tokenUsage: themeResult.tokenUsage,
      themePreview: JSON.stringify(themeResult.theme).substring(0, 200)
    });

    return new Response(JSON.stringify({
      success: true,
      theme: themeResult.theme,
      tokenUsage: themeResult.tokenUsage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Pipeline fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateTheme(
  idea: string, 
  context: string, 
  category: string, 
  apiKey: string
): Promise<ThemeGenerationResponse> {
  const systemPrompt = `You are a professional theme generator that creates comprehensive content themes for social media and marketing campaigns.

Generate a detailed theme object based on the user's idea that includes:
- A compelling title and description
- Key messaging points
- Visual style guidelines
- Content suggestions
- Target audience insights

Return ONLY valid JSON in this exact format:
{
  "title": "Theme Title",
  "description": "Detailed theme description",
  "category": "${category}",
  "messaging": ["key point 1", "key point 2", "key point 3"],
  "visualStyle": {
    "colors": ["#color1", "#color2"],
    "mood": "professional/creative/energetic",
    "style": "modern/classic/minimalist"
  },
  "contentSuggestions": ["suggestion 1", "suggestion 2"],
  "targetAudience": "audience description"
}`;

  const userPrompt = `Create a comprehensive theme for: "${idea}"${context ? `\n\nAdditional context: ${context}` : ''}`;

  try {
    console.log('🤖 Making OpenAI request with hardcoded limits', {
      model: GPT_MODEL,
      maxCompletionTokens: MAX_COMPLETION_TOKENS,
      promptLength: (systemPrompt + userPrompt).length
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: MAX_COMPLETION_TOKENS, // Hardcoded - no config dependency
        // Note: temperature not supported for GPT-5+ models
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', { status: response.status, error: errorText });
      throw new Error(`OpenAI API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('📦 OpenAI Response data structure:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      hasMessage: !!data.choices?.[0]?.message,
      hasContent: !!data.choices?.[0]?.message?.content,
      usage: data.usage
    });

    const content = data.choices?.[0]?.message?.content;
    const tokenUsage = {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0
    };

    console.log('🎯 Token usage:', {
      ...tokenUsage,
      maxAllowed: MAX_COMPLETION_TOKENS,
      hitLimit: tokenUsage.completionTokens >= MAX_COMPLETION_TOKENS
    });

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    console.log('📝 Generated content length:', content.length);
    console.log('📝 Generated content preview:', content.substring(0, 100) + '...');

    // Enhanced JSON parsing with better error handling
    let theme;
    try {
      theme = JSON.parse(content);
    } catch (parseError) {
      console.error('❌ JSON parsing failed. Content preview:', content.substring(0, 500));
      
      // Try to extract JSON from markdown or other formatting
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          theme = JSON.parse(jsonMatch[0]);
          console.log('✅ Recovered JSON from formatted content');
        } catch (secondParseError) {
          throw new Error(`Failed to parse OpenAI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
        }
      } else {
        throw new Error(`OpenAI response is not valid JSON. Content: ${content.substring(0, 200)}`);
      }
    }

    return {
      success: true,
      theme,
      tokenUsage
    };

  } catch (error) {
    console.error('❌ OpenAI API fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in theme generation'
    };
  }
}