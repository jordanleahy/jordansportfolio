import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const { jobDescription } = await req.json();
    
    if (!jobDescription) {
      throw new Error('Job description is required');
    }

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user portfolio data (case studies, blog posts, etc.)
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .limit(5);

    // Create portfolio content prompt
    const portfolioPrompt = `
You are an expert career consultant and portfolio optimizer. Analyze the following job description and create a tailored portfolio content strategy.

Job Description:
${jobDescription}

Available Portfolio Elements:
${blogPosts?.map(post => `- ${post.hero_headline}: ${post.intro_content.substring(0, 200)}...`).join('\n') || 'No portfolio elements available'}

Generate a JSON response with the following structure:
{
  "hero_section": {
    "headline": "Compelling headline that speaks to the company's needs",
    "subheadline": "Supporting message that highlights your value proposition",
    "value_proposition": "Clear statement of what you bring to this specific role"
  },
  "relevant_projects": [
    {
      "project_id": "blog_post_id_or_case_study_id",
      "relevance_score": 0.9,
      "customized_description": "How this project specifically relates to their needs"
    }
  ],
  "skills_alignment": [
    {
      "skill": "Technical or soft skill mentioned in job",
      "relevance": "Why this skill matters for this role",
      "examples": ["Specific examples from your work"]
    }
  ],
  "company_analysis": {
    "mission_alignment": "How your values align with theirs",
    "culture_fit": "Why you'd thrive in their environment",
    "growth_opportunities": "What you hope to achieve together"
  },
  "cover_letter": "A personalized cover letter that weaves together the above elements in a compelling narrative, addressing the hiring manager directly and demonstrating deep understanding of their needs and how you can solve their problems."
}

Make the content highly specific to this job posting. Reference specific requirements, technologies, or company goals mentioned in the description.
`;

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
            content: 'You are an expert career consultant who creates highly targeted portfolio content. Always respond with valid JSON.' 
          },
          { role: 'user', content: portfolioPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Parse the JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (e) {
      console.error('Failed to parse generated content as JSON:', generatedContent);
      throw new Error('Generated content is not valid JSON');
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-portfolio-content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});