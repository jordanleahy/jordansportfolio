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
    const { jobDescription, companyName, jobDescriptionLink, userId, companyInfo } = await req.json();
    
    if (!jobDescription || !companyName || !userId) {
      throw new Error('Job description, company name, and user ID are required');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's case studies for real project data
    const { data: caseStudies, error: caseStudiesError } = await supabase
      .from('case_studies')
      .select(`
        title,
        description,
        problem_title,
        problem_description,
        solution_title,
        outcomes_title,
        role,
        role_details,
        timeline,
        timeline_details,
        tags
      `)
      .eq('user_id', userId)
      .eq('status', 'published')
      .limit(5);

    if (caseStudiesError) {
      console.log('Case studies fetch error:', caseStudiesError);
    }


    // Fetch recent blog posts for thought leadership
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select(`
        meta_title,
        meta_description,
        category,
        tags
      `)
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(3);

    if (blogError) {
      console.log('Blog posts fetch error:', blogError);
    }

    // Build dynamic profile based on real data
    let personalizedProfile = `
About Jordan Leahy:
- Senior healthcare technology professional with extensive experience in digital health innovation
- Expert in AI/ML applications for clinical workflows, population health, and healthcare operations
- Strong background in revenue cycle management, clinical documentation integrity, and healthcare data analytics
- Proven track record of implementing technology solutions that improve patient outcomes and operational efficiency
`;

    // Add case study highlights
    if (caseStudies && caseStudies.length > 0) {
      personalizedProfile += `\nKey Project Experience:\n`;
      caseStudies.forEach((study, index) => {
        personalizedProfile += `- ${study.title}: ${study.description}\n`;
        if (study.role_details) {
          personalizedProfile += `  Role: ${study.role_details}\n`;
        }
        if (study.tags && study.tags.length > 0) {
          personalizedProfile += `  Technologies: ${study.tags.join(', ')}\n`;
        }
      });
    }


    // Add target company information if provided
    if (companyInfo) {
      personalizedProfile += `\nTarget Company Research:\n`;
      personalizedProfile += `- ${companyName}: ${companyInfo.description}\n`;
      if (companyInfo.services && companyInfo.services.length > 0) {
        personalizedProfile += `  Services: ${companyInfo.services.join(', ')}\n`;
      }
      if (companyInfo.specialties && companyInfo.specialties.length > 0) {
        personalizedProfile += `  Specialties: ${companyInfo.specialties.join(', ')}\n`;
      }
      if (companyInfo.website) {
        personalizedProfile += `  Website: ${companyInfo.website}\n`;
      }
    }

    // Add thought leadership
    if (blogPosts && blogPosts.length > 0) {
      personalizedProfile += `\nThought Leadership:\n`;
      blogPosts.forEach((post, index) => {
        personalizedProfile += `- Published content on: ${post.category} - ${post.meta_title}\n`;
      });
    }

    // Create enhanced cover letter generation prompt with structured output
    const coverLetterPrompt = `
You are an expert career consultant who writes compelling, SCANNABLE cover letters optimized for 15-second reviews. Create a structured cover letter for Jordan Leahy applying to ${companyName}.

Company Name: ${companyName}
Job Description: ${jobDescription}
${jobDescriptionLink ? `Job Posting URL: ${jobDescriptionLink}` : ''}

${personalizedProfile}

CRITICAL FORMATTING REQUIREMENTS FOR SCANNABILITY:
- Structure as 4 distinct, visually scannable sections
- Use bullet points, bold text, and numbers for key metrics
- Keep sentences under 20 words each
- Include specific metrics and achievements that pop visually
- Make it scannable in under 15 seconds

Return ONLY a JSON object with this EXACT structure:
{
  "opening_hook": "One powerful sentence showing immediate value Jordan brings to [Company]. Include a key metric or achievement.",
  "key_achievements": [
    "• **[Metric/Number]**: Specific achievement with measurable impact",
    "• **[Technology/Skill]**: Brief description of relevant expertise", 
    "• **[Result/Outcome]**: Quantified success story"
  ],
  "strategic_fit": [
    "Perfect alignment point #1 between Jordan's experience and company needs",
    "Key connection #2 that shows deep understanding of their challenges"
  ],
  "call_to_action": "Confident, action-oriented closing that proposes specific next steps"
}

Requirements:
- Each achievement bullet must include a bold metric/keyword
- Use specific numbers, percentages, and concrete results
- Keep strategic_fit items under 25 words each
- Make opening_hook attention-grabbing with immediate value
- Ensure call_to_action is confident and specific

Focus on healthcare technology expertise, AI/ML applications, revenue cycle management, and measurable business impact.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert career consultant who creates highly targeted, SCANNABLE cover letters optimized for quick review. Always respond with valid JSON only.' 
          },
          { role: 'user', content: coverLetterPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let coverLetterContent = data.choices[0].message.content;

    // Parse the JSON response
    let structuredContent;
    try {
      structuredContent = JSON.parse(coverLetterContent);
    } catch (parseError) {
      console.error('Failed to parse JSON response, using fallback format');
      structuredContent = {
        opening_hook: coverLetterContent,
        key_achievements: [],
        strategic_fit: [],
        call_to_action: "I would love to discuss how my experience can contribute to your team's success."
      };
    }

    return new Response(JSON.stringify({ 
      cover_letter: structuredContent,
      case_studies_used: caseStudies?.length || 0,
      blog_posts_used: blogPosts?.length || 0
    }), {
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
