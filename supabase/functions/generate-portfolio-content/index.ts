
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
    const { jobDescription, companyName, jobDescriptionLink } = await req.json();
    
    if (!jobDescription || !companyName) {
      throw new Error('Job description and company name are required');
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

    // Create enhanced portfolio content prompt
    const portfolioPrompt = `
You are an expert career consultant and portfolio optimizer. Create a highly personalized landing page for a job application that will impress the hiring manager.

Company Name: ${companyName}
Job Description: ${jobDescription}
${jobDescriptionLink ? `Job Posting URL: ${jobDescriptionLink}` : ''}

Available Portfolio Elements:
${blogPosts?.map(post => `- ${post.hero_headline}: ${post.intro_content?.substring(0, 200)}...`).join('\n') || 'No portfolio elements available'}

Create a compelling, personalized landing page that demonstrates deep understanding of the company's needs and how the candidate can solve their problems. Generate a JSON response with the following structure:

{
  "hero_section": {
    "headline": "Compelling, punchy headline that speaks directly to the company's needs (max 60 characters)",
    "subheadline": "Supporting message that highlights unique value proposition (max 120 characters)",
    "value_proposition": "Clear, compelling statement of what you bring to this specific role and company (200-300 words)"
  },
  "relevant_projects": [
    {
      "project_id": "blog_post_id_or_case_study_id",
      "relevance_score": 0.95,
      "customized_description": "Detailed explanation of how this project/experience specifically relates to their needs and demonstrates the skills they're looking for (150-200 words)"
    }
  ],
  "skills_alignment": [
    {
      "skill": "Technical or soft skill mentioned in job posting",
      "relevance": "Why this skill matters for this specific role at this company",
      "examples": ["Specific, quantifiable examples from your experience demonstrating this skill"]
    }
  ],
  "company_analysis": {
    "mission_alignment": "How your personal values and career goals align with their company mission and culture (100-150 words)",
    "culture_fit": "Why you'd thrive in their specific work environment based on what you know about the company (100-150 words)",
    "growth_opportunities": "What you hope to achieve and contribute in this role, showing long-term thinking (100-150 words)"
  },
  "cover_letter": "A personalized, compelling cover letter that weaves together all the above elements in a natural, engaging narrative. Address the hiring manager directly, demonstrate deep research and understanding of their challenges, and show exactly how you can solve their problems. Make it feel personal and authentic, not templated. (500-700 words)"
}

Guidelines:
- Make the content highly specific to this job posting and company
- Reference specific requirements, technologies, or company goals mentioned in the description
- Use confident, professional language that shows expertise
- Include quantifiable achievements and specific examples where possible
- Show genuine enthusiasm for the company and role
- Demonstrate understanding of industry trends and challenges
- Make the cover letter feel personal and conversational, not robotic
- Focus on value you can bring, not just what you want to get from the role
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
            content: 'You are an expert career consultant who creates highly targeted, personalized portfolio content for job applications. You understand how to analyze job descriptions and create compelling narratives that demonstrate perfect fit. Always respond with valid JSON.' 
          },
          { role: 'user', content: portfolioPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
