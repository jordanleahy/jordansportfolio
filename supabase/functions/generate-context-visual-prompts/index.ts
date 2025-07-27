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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { themeData, userId } = await req.json();
    
    if (!themeData || !userId) {
      throw new Error('Theme data and user ID are required');
    }

    console.log('Analyzing theme data for context-aware visual prompts:', {
      category: themeData.category,
      theme: themeData.theme,
      postsCount: themeData.posts?.length
    });

    // Analyze the content to understand context
    const contentAnalysis = await analyzeThemeContent(themeData);
    
    console.log('Content analysis completed:', {
      industryContext: contentAnalysis.industryContext,
      visualTheme: contentAnalysis.visualTheme
    });

    // Generate context-aware system prompt using the Context Aware agent
    const generatedSystemPrompt = await generateSystemPromptUsingAgent(userId, contentAnalysis);
    
    console.log('Generated system prompt for category:', contentAnalysis.industryContext);

    // Update the Blog Visual Prompt Generator with the new system prompt
    const updateResult = await updateBlogVisualAgent(userId, contentAnalysis, generatedSystemPrompt);

    console.log('Blog Visual Prompt Generator updated:', {
      newCategory: updateResult.newCategory,
      addedNewCategory: updateResult.addedNewCategory
    });

    return new Response(JSON.stringify({
      success: true,
      analysis: contentAnalysis,
      generatedSystemPrompt,
      updatedAgent: updateResult.updatedAgent,
      newCategory: updateResult.newCategory,
      addedNewCategory: updateResult.addedNewCategory
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-context-visual-prompts:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeThemeContent(themeData: any) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const analysisPrompt = `Analyze this imported theme content and provide a structured analysis for generating appropriate visual prompts:

Theme: ${themeData.theme}
Category: ${themeData.category}
Description: ${themeData.description || 'No description provided'}

Posts (first 5 for analysis):
${themeData.posts.slice(0, 5).map((post: any, index: number) => 
  `${index + 1}. ${post.title}\n   ${post.description}`
).join('\n\n')}

Please analyze and return a JSON object with:
{
  "visualTheme": "Brief description of the visual style that would best represent this content",
  "colorPalette": "Suggested color scheme (professional, vibrant, medical, corporate, etc.)",
  "imageStyle": "Recommended image style (vector, photography, illustration, etc.)",
  "keyElements": ["element1", "element2", "element3"],
  "industryContext": "The industry or domain this content relates to",
  "targetAudience": "Who this content is designed for",
  "contentTone": "Professional tone (formal, educational, friendly, etc.)"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert content analyst specializing in visual design and branding. Analyze content and provide structured insights for generating appropriate visual prompts. Always respond with valid JSON only.' 
        },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.3
    }),
  });

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Failed to analyze content');
  }

  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (parseError) {
    console.error('Failed to parse analysis JSON:', data.choices[0].message.content);
    // Fallback analysis
    return {
      visualTheme: `Professional visuals for ${themeData.category} content`,
      colorPalette: "professional",
      imageStyle: "vector illustration",
      keyElements: ["charts", "technology", "professional"],
      industryContext: themeData.category,
      targetAudience: "professionals",
      contentTone: "professional"
    };
  }
}

async function generateSystemPromptUsingAgent(userId: string, analysis: any) {
  // Get the Context Aware Visual Prompt Generator agent
  const { data: contextAgent, error: agentError } = await supabase
    .from('openai_agents')
    .select('*')
    .eq('user_id', userId)
    .eq('name', 'Context Aware Visual Prompt Generator')
    .single();

  if (agentError || !contextAgent) {
    throw new Error('Context Aware Visual Prompt Generator agent not found');
  }

  // Use the agent's system prompt to generate a new system prompt
  const systemPrompt = contextAgent.system_prompts?.[0]?.prompt || '';
  
  const userPrompt = `Based on this content analysis, generate a specialized system prompt for the Blog Visual Prompt Generator agent:

Analysis:
- Visual Theme: ${analysis.visualTheme}
- Industry Context: ${analysis.industryContext}
- Target Audience: ${analysis.targetAudience}
- Content Tone: ${analysis.contentTone}
- Color Palette: ${analysis.colorPalette}
- Image Style: ${analysis.imageStyle}
- Key Elements: ${analysis.keyElements.join(', ')}

Please generate a complete system prompt that follows the template structure shown in your system prompt. The new prompt should be specifically tailored for "${analysis.industryContext}" content.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: contextAgent.model_version,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2
    }),
  });

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Failed to generate system prompt');
  }

  return data.choices[0].message.content.trim();
}

async function updateBlogVisualAgent(userId: string, analysis: any, generatedSystemPrompt: string) {
  // Get the Blog Visual Prompt Generator agent
  const { data: blogAgent, error: agentError } = await supabase
    .from('openai_agents')
    .select('*')
    .eq('user_id', userId)
    .eq('name', 'Blog Visual Prompt Generator')
    .single();

  if (agentError || !blogAgent) {
    throw new Error('Blog Visual Prompt Generator agent not found');
  }

  // Create the new category key from the industry context
  const newCategory = analysis.industryContext.toLowerCase().replace(/\s+/g, '_');
  
  // Get existing system prompts and supported categories
  const existingSystemPrompts = blogAgent.system_prompts || [];
  const existingSupportedCategories = blogAgent.supported_categories || [];

  // Check if this category already exists
  const existingPromptIndex = existingSystemPrompts.findIndex(
    (prompt: any) => prompt.category === newCategory
  );

  let updatedSystemPrompts;
  if (existingPromptIndex >= 0) {
    // Update existing prompt
    updatedSystemPrompts = [...existingSystemPrompts];
    updatedSystemPrompts[existingPromptIndex] = {
      category: newCategory,
      prompt: generatedSystemPrompt
    };
  } else {
    // Add new prompt
    updatedSystemPrompts = [
      ...existingSystemPrompts,
      {
        category: newCategory,
        prompt: generatedSystemPrompt
      }
    ];
  }

  // Update supported categories if not already included
  const updatedSupportedCategories = existingSupportedCategories.includes(newCategory)
    ? existingSupportedCategories
    : [...existingSupportedCategories, newCategory];

  // Update the Blog Visual Prompt Generator agent
  const { data: updatedAgent, error: updateError } = await supabase
    .from('openai_agents')
    .update({
      system_prompts: updatedSystemPrompts,
      supported_categories: updatedSupportedCategories,
      updated_at: new Date().toISOString()
    })
    .eq('id', blogAgent.id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update Blog Visual Prompt Generator: ${updateError.message}`);
  }

  return {
    updatedAgent,
    newCategory,
    addedNewCategory: !existingSupportedCategories.includes(newCategory)
  };
}
