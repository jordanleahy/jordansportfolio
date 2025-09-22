import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StoryConfig {
  style: 'narrative' | 'analytical' | 'educational' | 'tutorial';
  tone: 'professional' | 'casual' | 'technical';
  length: 'quick' | 'deep' | 'comprehensive';
  audience: 'general' | 'professional' | 'technical' | 'executive';
}

interface ThemeData {
  id: string;
  theme_name: string;
  category: string;
  posts: Array<{
    title: string;
    description: string;
    day?: number;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { themeData, storyConfig } = await req.json();
    
    if (!themeData || !storyConfig) {
      throw new Error('Theme data and story configuration are required');
    }

    console.log('Generating story blog with config:', storyConfig);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate dynamic prompt based on configuration
    const systemPrompt = generateSystemPrompt(storyConfig);
    const contentPrompt = generateContentPrompt(themeData, storyConfig);

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: contentPrompt
          }
        ],
        max_completion_tokens: getTokenLimit(storyConfig.length),
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const openAIResponse = await response.json();
    const generatedContent = openAIResponse.choices[0].message.content;

    console.log('Story blog generated successfully');

    return new Response(JSON.stringify({
      success: true,
      content: generatedContent,
      config: storyConfig
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-story-blog:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSystemPrompt(config: StoryConfig): string {
  let basePrompt = "You are an expert content writer specializing in creating engaging, comprehensive blog posts.";
  
  // Style-specific instructions
  switch (config.style) {
    case 'narrative':
      basePrompt += " Write in a story-driven style with smooth flow between concepts, using anecdotes and examples to illustrate points.";
      break;
    case 'analytical':
      basePrompt += " Write in a data-driven analytical style with clear insights, statistics, and logical breakdowns of complex topics.";
      break;
    case 'educational':
      basePrompt += " Write in a teaching-focused style with clear explanations, learning objectives, and step-by-step guidance.";
      break;
    case 'tutorial':
      basePrompt += " Write as a step-by-step actionable guide with practical instructions and clear implementation steps.";
      break;
  }

  // Tone-specific instructions
  switch (config.tone) {
    case 'professional':
      basePrompt += " Use professional, authoritative language suitable for business contexts.";
      break;
    case 'casual':
      basePrompt += " Use conversational, approachable language that feels friendly and accessible.";
      break;
    case 'technical':
      basePrompt += " Use precise technical language with industry-specific terminology and detailed explanations.";
      break;
  }

  // Audience-specific instructions
  switch (config.audience) {
    case 'general':
      basePrompt += " Write for a general audience, avoiding jargon and explaining complex concepts in simple terms.";
      break;
    case 'professional':
      basePrompt += " Write for industry professionals who understand the business context and challenges.";
      break;
    case 'technical':
      basePrompt += " Write for technical experts who want detailed implementation details and advanced concepts.";
      break;
    case 'executive':
      basePrompt += " Write for executives and decision-makers, focusing on strategic implications and business impact.";
      break;
  }

  basePrompt += " Always write with variety in sentence length and rhythm, avoiding clichés and generic phrases. Keep the content natural and engaging.";

  return basePrompt;
}

function generateContentPrompt(themeData: ThemeData, config: StoryConfig): string {
  const wordTargets = {
    quick: '800-1,200 words',
    deep: '1,500-2,500 words', 
    comprehensive: '3,000-5,000 words'
  };

  const postsSummary = themeData.posts.map(post => 
    `Day ${post.day || 'N/A'}: ${post.title} - ${post.description}`
  ).join('\n');

  return `Create a comprehensive blog post based on this theme and its posts:

THEME: ${themeData.theme_name}
CATEGORY: ${themeData.category}
TOTAL POSTS: ${themeData.posts.length}

POSTS IN THIS THEME:
${postsSummary}

TARGET LENGTH: ${wordTargets[config.length]}
WRITING STYLE: ${config.style}
TONE: ${config.tone}
TARGET AUDIENCE: ${config.audience}

REQUIREMENTS:
1. Create a compelling headline that captures the essence of the entire theme
2. Write an engaging introduction that sets up the comprehensive guide
3. Organize the content logically, weaving together insights from all posts
4. ${config.style === 'tutorial' ? 'Structure as actionable steps' : 
     config.style === 'analytical' ? 'Include data-driven insights and analysis' :
     config.style === 'educational' ? 'Include clear learning objectives and key takeaways' :
     'Tell a cohesive story that flows naturally between concepts'}
5. Include specific examples and practical applications
6. End with a strong conclusion that ties everything together
7. Make it valuable for ${config.audience === 'executive' ? 'decision-makers' : 
                          config.audience === 'technical' ? 'technical implementers' :
                          config.audience === 'professional' ? 'industry professionals' :
                          'readers at all levels'}

Generate the complete blog post content in markdown format.`;
}

function getTokenLimit(length: string): number {
  switch (length) {
    case 'quick': return 2000;
    case 'deep': return 4000;
    case 'comprehensive': return 6000;
    default: return 4000;
  }
}