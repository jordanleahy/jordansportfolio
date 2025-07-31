import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SystemPromptRequest {
  category: string;
  theme?: string;
  description?: string;
  sample_posts?: Array<{title: string; description: string}>;
  existing_prompts?: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: SystemPromptRequest = await req.json();
    console.log('System Prompt Generation Request:', request);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build context for the AI
    const contextData = {
      category: request.category,
      theme: request.theme || 'General',
      description: request.description || '',
      sample_content: request.sample_posts?.slice(0, 3).map(post => 
        `Title: ${post.title}\nDescription: ${post.description}`
      ).join('\n\n') || '',
      existing_prompt_count: request.existing_prompts?.length || 0
    };

    const systemPrompt = `You are an expert system prompt architect specializing in creating comprehensive, industry-specific visual content generation prompts.

Your task is to analyze the provided category context and generate a complete, professional system prompt for a visual content generator following the proven CDI template structure.

CONTEXT ANALYSIS:
- Category: ${contextData.category}
- Theme: ${contextData.theme}
- Description: ${contextData.description}
- Sample Content: ${contextData.sample_content}

REQUIREMENTS:
1. Create a comprehensive system prompt that follows this exact structure:
   - Title with emoji (# 🎨 [CATEGORY] Visual Content Generator)
   - Content Analysis Framework (📊)
   - Visual Framework with Foreground/Mid-ground/Background (🎯)
   - Style & Rendering Requirements (🎨)
   - Color Palette table with HSL values (🌈)
   - Visual Metaphors section (🔍)
   - Output Instructions (📋)

2. The color palette MUST:
   - Use HSL format: hsl(hue, saturation%, lightness%)
   - Be appropriate for the industry/category
   - Include Primary, Secondary, Accent, and Neutral colors
   - Have specific usage guidelines

3. Industry-specific customization:
   - Analyze the category and sample content to understand the industry
   - Include relevant terminology and visual elements
   - Define appropriate professional contexts
   - Create meaningful visual metaphors

4. Professional output format:
   - Use emojis in section headers
   - Include detailed tables and structured content
   - End with the critical instruction about aspect ratios
   - Maintain professional, authoritative tone

Generate a complete system prompt that will enable high-quality, contextually-appropriate visual content generation for this specific category.`;

    const userPrompt = `Generate a comprehensive system prompt for visual content generation in the "${request.category}" category. Use the provided context to create industry-specific guidance, appropriate color palettes, and detailed visual frameworks.`;

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content;

    console.log('Generated system prompt length:', generatedPrompt.length);

    return new Response(JSON.stringify({ 
      success: true, 
      system_prompt: generatedPrompt,
      category: request.category,
      context_used: contextData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-system-prompt function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});