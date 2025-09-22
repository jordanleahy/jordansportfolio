/**
 * EDGE FUNCTION: Generate Content
 * 
 * PURPOSE:
 * General-purpose content generation using OpenAI's GPT models with type-specific system prompts.
 * Supports various content types including image prompts and important content.
 * 
 * INPUTS:
 * - prompt: string - Content generation request or prompt text
 * - type: string (optional, default: 'general') - Content type ('image_prompt', 'important', 'general')
 * 
 * OUTPUTS:
 * - Success: { generatedText: string }
 * - Error: { error: string, details: string }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-4o-mini for content generation)
 * - Supabase Database
 * 
 * USAGE:
 * Called from: Legacy content workflows, general-purpose content tools, multi-type generation
 * Authentication: Optional
 * 
 * FLOW:
 * 1. Parse prompt and optional content type from request
 * 2. Select appropriate system prompt based on type (image_prompt gets specialized prompt)
 * 3. Generate content using OpenAI with type-specific context
 * 4. Return generated text ready for immediate use or further processing
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

  try {
    const { prompt, type = 'general', templateType, textPolicy } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Initialize Supabase client for user authentication
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    console.log(`Generating content for type: ${type}, templateType: ${templateType}, textPolicy: ${textPolicy}`);

    let systemContent;
    let finalPrompt = prompt;

    if (type === 'image_prompt') {
      // Determine system prompt based on template type
      if (templateType === 'text-free' || textPolicy === 'none') {
        systemContent = 'You are an expert at creating detailed, professional image generation prompts that produce purely visual content without any text, words, letters, or written elements. You specialize in visual metaphors, abstract representations, and symbolic imagery that communicates concepts through pure visual language. Focus on creating prompts that result in images with NO TEXT whatsoever - only colors, shapes, forms, lighting, and composition.';
      } else if (templateType === 'minimal-text' || textPolicy === 'minimal') {
        systemContent = 'You are an expert at creating clean, minimal image generation prompts that use text sparingly and strategically. When text is included, it should be minimal, purposeful, and integrated as a design element rather than informational content. Prioritize visual communication over textual elements.';
      } else {
        systemContent = 'You are an expert at creating detailed, professional image generation prompts for AI image generators. Focus on creating clear, specific prompts that will generate high-quality, professional visuals.';
      }
    } else {
      systemContent = 'You are a helpful assistant that generates high-quality content based on user prompts.';
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: finalPrompt }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const generatedText = data.choices[0].message.content;

    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate content. Please check your request and try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});