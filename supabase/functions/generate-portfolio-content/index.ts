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

    // Build detailed case study context for accurate matching
    let caseStudyContext = '';
    if (caseStudies && caseStudies.length > 0) {
      caseStudyContext = `
REAL PROJECT PORTFOLIO - USE THESE EXACT PROJECTS:
${caseStudies.map((study, index) => `
Project ${index + 1}: ${study.title}
- Description: ${study.description}
- Problem Solved: ${study.problem_description || 'Not specified'}
- Solution Approach: ${study.solution_title || 'Not specified'}
- Role: ${study.role} ${study.role_details ? `- ${study.role_details}` : ''}
- Timeline: ${study.timeline} ${study.timeline_details ? `- ${study.timeline_details}` : ''}
- Technologies: ${study.tags ? study.tags.join(', ') : 'Not specified'}
- Outcomes: ${study.outcomes_title || 'Not specified'}
`).join('\n')}

IMPORTANT: Only reference these ACTUAL projects. Do not invent or hallucinate any projects, metrics, or achievements not listed above.
`;
    } else {
      caseStudyContext = `
NO CASE STUDIES AVAILABLE - Use only general healthcare technology experience without specific project claims.
Focus on skills and potential rather than fabricated project details.
`;
    }

    // Add blog posts context
    let thoughtLeadershipContext = '';
    if (blogPosts && blogPosts.length > 0) {
      thoughtLeadershipContext = `
ACTUAL THOUGHT LEADERSHIP:
${blogPosts.map(post => `- ${post.meta_title} (${post.category})`).join('\n')}
`;
    }



    // Create enhanced cover letter generation prompt with structured output
    const coverLetterPrompt = `
You are an expert career consultant who writes compelling, SCANNABLE cover letters optimized for 15-second reviews. Create a structured cover letter for Jordan Leahy applying to ${companyName}.

COMPANY: ${companyName}
JOB DESCRIPTION: ${jobDescription}
${jobDescriptionLink ? `JOB POSTING URL: ${jobDescriptionLink}` : ''}

${caseStudyContext}

${thoughtLeadershipContext}

TARGET COMPANY INFORMATION:
${companyInfo ? `
- Company: ${companyName}
- Description: ${companyInfo.description || 'Healthcare technology company'}
- Services: ${companyInfo.services?.join(', ') || 'Not specified'}
- Specialties: ${companyInfo.specialties?.join(', ') || 'Not specified'}
` : `Company: ${companyName} (analyze job description for company details)`}

CRITICAL INSTRUCTIONS - ACCURACY IS PARAMOUNT:
1. ONLY use information from the REAL PROJECT PORTFOLIO above
2. Do NOT fabricate metrics, achievements, or project details
3. Match job requirements to ACTUAL project experience listed
4. If no relevant projects exist, focus on potential and general skills
5. Analyze the job description to identify key requirements and match them to real projects

FORMATTING REQUIREMENTS FOR SCANNABILITY:
- Structure as 4 distinct, visually scannable sections
- Use bullet points, bold text, and specific project names
- Keep sentences under 20 words each
- Reference actual project titles and real technologies used
- Make it scannable in under 15 seconds

MATCHING PROCESS:
1. Extract 3-5 key requirements from the job description
2. Match each requirement to specific projects from the portfolio
3. Use actual project outcomes, not invented metrics
4. If no direct match exists, explain transferable skills

Return ONLY a JSON object with this EXACT structure:
{
  "opening_hook": "One powerful sentence connecting a specific real project to [Company] needs from job description",
  "key_achievements": [
    "• **[Case Study Project Name]**: Brief description of actual project outcome from portfolio above",
    "• **[Case Study Project Name]**: Another specific project result from portfolio above", 
    "• **[Case Study Project Name]**: Third concrete project achievement from portfolio above"
  ],
  "strategic_fit": [
    "Specific connection between [Real Project] and [Company] need from job description",
    "Another concrete match between actual experience and stated requirements"
  ],
  "call_to_action": "Confident, specific next step that references the role or company challenge"
}

CRITICAL FOR KEY ACHIEVEMENTS:
- ONLY use actual case study project names from the REAL PROJECT PORTFOLIO section above
- Each bullet must reference a specific case study title exactly as listed
- Do NOT create generic achievements - only project-specific results
- If fewer than 3 case studies exist, only create bullets for the projects that exist
- Use the actual project outcomes, technologies, and results documented in each case study

ACCURACY REQUIREMENTS:
- Reference actual project titles from the portfolio
- Use real technologies and methodologies listed
- Only mention outcomes that are documented
- If insufficient real data exists, be honest about potential vs. proven results
- Match job keywords to actual project experience where possible
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
