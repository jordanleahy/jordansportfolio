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
    
    // Generate context-aware system prompt
    const systemPrompt = generateContextualSystemPrompt(contentAnalysis);
    
    // Create or update the agent
    const agentResult = await createContextualVisualAgent(userId, contentAnalysis, systemPrompt);

    return new Response(JSON.stringify({
      success: true,
      agent: agentResult,
      analysis: contentAnalysis,
      systemPrompt
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

function generateContextualSystemPrompt(analysis: any): string {
  return `You are an expert at creating detailed, professional image generation prompts for ${analysis.industryContext}-themed AI image generators.

Based on the content analysis:
- Visual Theme: ${analysis.visualTheme}
- Industry Context: ${analysis.industryContext}
- Target Audience: ${analysis.targetAudience}
- Content Tone: ${analysis.contentTone}

Focus on creating clear, specific prompts that will generate high-quality, professional visuals that are:
- ${analysis.imageStyle} style
- ${analysis.colorPalette} color palette
- Suitable for ${analysis.targetAudience}
- Professional and trustworthy
- Clean, modern design
- Include relevant elements: ${analysis.keyElements.join(', ')}
- Consistent with ${analysis.contentTone} tone
- Appropriate for ${analysis.industryContext} industry

Visual Style Guidelines:
- Use ${analysis.imageStyle} as the primary style
- Maintain ${analysis.colorPalette} color scheme
- Focus on ${analysis.visualTheme}
- Ensure professional, clean imagery suitable for business use

Always specify the aspect ratio in your prompt and ensure the generated prompt will create appropriate, professional visuals that match the content theme and industry context.`;
}

async function createContextualVisualAgent(userId: string, analysis: any, systemPrompt: string) {
  const agentName = `${analysis.industryContext} Visual Context Agent`;
  
  // Check if agent already exists
  const { data: existingAgent } = await supabase
    .from('openai_agents')
    .select('id')
    .eq('user_id', userId)
    .eq('name', agentName)
    .single();

  const agentData = {
    user_id: userId,
    name: agentName,
    purpose: `Context-aware visual prompt generator for ${analysis.industryContext} content. Analyzes imported theme data and generates specialized visual prompts that match the content context and industry requirements.`,
    model_version: 'gpt-4o-mini',
    trigger: 'api_call',
    input_source: 'Theme content and context analysis (JSON)',
    output_target: 'Contextual image prompts (JSON)',
    schedule: 'on-demand',
    owner: 'Content Marketing Team',
    status: 'active',
    tags: ['visual-content', 'context-aware', 'theme-analysis', analysis.industryContext.toLowerCase(), 'ai-prompts'],
    notes: `Generated from theme analysis. Visual theme: ${analysis.visualTheme}. Target audience: ${analysis.targetAudience}. Content tone: ${analysis.contentTone}.`,
    system_prompts: [
      {
        category: analysis.industryContext.toLowerCase(),
        prompt: systemPrompt
      }
    ],
    supported_categories: [analysis.industryContext.toLowerCase()]
  };

  if (existingAgent) {
    // Update existing agent
    const { data, error } = await supabase
      .from('openai_agents')
      .update(agentData)
      .eq('id', existingAgent.id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } else {
    // Create new agent
    const { data, error } = await supabase
      .from('openai_agents')
      .insert(agentData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
}