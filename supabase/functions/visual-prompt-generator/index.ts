import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VisualPromptRequest {
  context: string;
  themeId: string;
  theme?: string;
  description: string;
  aspect_ratio?: string;
  aspectRatio?: string; // Support both parameter names for compatibility
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎨 Starting visual prompt generation...');
    
    const { context, theme, themeId, description, aspect_ratio, aspectRatio }: VisualPromptRequest = await req.json();
    
    // Validate required parameters
    if (!themeId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required field: themeId is required',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate themeId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(themeId)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid themeId: must be a valid UUID',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Use theme or themeId, preferring theme if both are provided
    const themeValue = theme || themeId || 'default';
    // Support both aspect_ratio parameter names for compatibility
    const aspectRatioValue = aspect_ratio || aspectRatio || '1:1';
    // Use provided context or fallback to description
    const contextValue = context || description || 'Generate professional visual content';

    // Direct lookup of system prompt by theme_id (no category lookup needed)
    console.log(`🔍 Looking up system prompt for theme_id: ${themeId}`);

    // Retrieve system prompt from database
    let systemPrompt = '';
    
    try {
      // Query system prompts by theme_id using standardized pattern
      const { data: systemPromptData, error: promptError } = await supabase
        .from('system_prompts')
        .select('id, prompt_text, agent_name, theme_id')
        .eq('theme_id', themeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (promptError) {
        console.error('❌ SYSTEM PROMPT QUERY ERROR:', promptError);
      }
      
      if (systemPromptData) {
        systemPrompt = systemPromptData.prompt_text;
        console.log(`✅ Retrieved system prompt from database for theme_id: ${themeId}`);
      } else {
        console.log(`⚠️ No system prompt found for theme_id: ${themeId}, using fallback`);
      }
    } catch (dbError) {
      console.warn('⚠️ Database error retrieving system prompt:', dbError);
    }
    
    // Fallback system prompt if none found in database
    if (!systemPrompt) {
      console.log('🔄 Using generic fallback system prompt');
      
      // Generic visual prompt agent for all themes
      systemPrompt = `You are a Visual Prompt Generator Agent. Create detailed, professional image generation prompts that will produce high-quality visual content suitable for social media and marketing materials.

Focus on:
- Clean, modern design aesthetics
- Professional color schemes
- Clear hierarchy and composition
- Brand-appropriate styling
- High visual impact and shareability`;
    }

    const promptRequest = `${systemPrompt}

Theme: ${themeValue}
Context: ${contextValue}
Description: ${description || 'Professional content creation'}
Aspect Ratio: ${aspectRatioValue}

Generate a detailed visual prompt that will create an engaging, professional image.`;

    console.log('🤖 Calling OpenAI for visual prompt generation...');
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: 'You are a professional visual prompt generator. Create detailed, specific prompts for image generation.' },
          { role: 'user', content: promptRequest }
        ],
        max_completion_tokens: 1000,
      }),
    });

    const openAIData = await openAIResponse.json();
    console.log('✅ OpenAI visual prompt generation completed');

    if (!openAIData.choices?.[0]?.message?.content) {
      throw new Error('No visual prompt generated from OpenAI');
    }

    const imagePrompt = openAIData.choices[0].message.content;

    return new Response(JSON.stringify({
      success: true,
      generatedPrompt: imagePrompt,
      image_prompt: imagePrompt, // Backward compatibility
      theme: themeValue,
      aspect_ratio: aspectRatioValue
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in visual-prompt-generator:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});