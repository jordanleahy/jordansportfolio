import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeConsistencyRequest {
  themeId?: string;
  postIds?: string[];
}

interface ConsistencyIssue {
  type: 'style' | 'character' | 'setting' | 'color' | 'tone' | 'brand';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedPosts: string[];
  suggestion: string;
}

interface ConsistencyReport {
  totalPosts: number;
  consistencyScore: number; // 0-100
  issues: ConsistencyIssue[];
  summary: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { themeId, postIds }: AnalyzeConsistencyRequest = await req.json();

    if (!themeId && !postIds) {
      throw new Error('Either themeId or postIds must be provided');
    }

    // Fetch prompts from database
    let query = supabase
      .from('social_media_posts')
      .select('id, title, generated_image_prompt')
      .not('generated_image_prompt', 'is', null);

    if (themeId) {
      query = query.eq('theme_id', themeId);
    } else if (postIds) {
      query = query.in('id', postIds);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch posts');
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ 
          totalPosts: 0,
          consistencyScore: 100,
          issues: [],
          summary: 'No posts with image prompts found.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare prompts for analysis
    const promptData = posts.map(post => ({
      postId: post.id,
      title: post.title,
      prompt: post.generated_image_prompt
    }));

    // Analyze consistency using OpenAI
    const systemPrompt = `You are an expert at analyzing image generation prompts for consistency. 

Analyze the following image prompts and identify inconsistencies in:
1. **Style**: Art style, rendering technique, visual aesthetic
2. **Character**: Character descriptions, appearances, clothing
3. **Setting**: Environment, background, scene context  
4. **Color**: Color schemes, palette, lighting
5. **Tone**: Mood, atmosphere, emotional feel
6. **Brand**: Brand consistency, visual identity

For each inconsistency found:
- Classify the type (style/character/setting/color/tone/brand)
- Rate severity (low/medium/high)
- Describe the specific inconsistency
- List affected post IDs
- Suggest how to fix it

Calculate an overall consistency score (0-100) where:
- 90-100: Excellent consistency
- 80-89: Good consistency with minor issues
- 70-79: Moderate consistency with some issues
- 60-69: Poor consistency with major issues
- 0-59: Very poor consistency

Return a JSON object with this exact structure:
{
  "totalPosts": number,
  "consistencyScore": number,
  "issues": [
    {
      "type": "style" | "character" | "setting" | "color" | "tone" | "brand",
      "severity": "low" | "medium" | "high",
      "description": "specific description of the inconsistency",
      "affectedPosts": ["postId1", "postId2"],
      "suggestion": "how to fix this inconsistency"
    }
  ],
  "summary": "brief overall assessment"
}`;

    const userPrompt = `Analyze these ${posts.length} image prompts for consistency:

${promptData.map((item, index) => 
  `**Post ${index + 1} (ID: ${item.postId})**
Title: ${item.title}
Prompt: ${item.prompt}
`).join('\n')}

Please provide a detailed consistency analysis.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('OpenAI API request failed');
    }

    const openAIData = await response.json();
    const analysisResult = openAIData.choices[0].message.content;

    let consistencyReport: ConsistencyReport;
    
    try {
      // Try to parse as JSON first
      consistencyReport = JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Fallback to a basic report
      consistencyReport = {
        totalPosts: posts.length,
        consistencyScore: 75, // Default moderate score
        issues: [{
          type: 'style',
          severity: 'medium',
          description: 'Analysis could not be completed due to parsing error',
          affectedPosts: posts.map(p => p.id),
          suggestion: 'Please try the analysis again or review prompts manually'
        }],
        summary: 'Analysis incomplete due to technical error'
      };
    }

    // Ensure the response has the correct structure
    const validatedReport: ConsistencyReport = {
      totalPosts: consistencyReport.totalPosts || posts.length,
      consistencyScore: Math.max(0, Math.min(100, consistencyReport.consistencyScore || 0)),
      issues: consistencyReport.issues || [],
      summary: consistencyReport.summary || 'Analysis completed'
    };

    return new Response(JSON.stringify(validatedReport), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-prompt-consistency:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        totalPosts: 0,
        consistencyScore: 0,
        issues: [],
        summary: 'Analysis failed due to error'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});