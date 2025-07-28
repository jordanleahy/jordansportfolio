import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      jobDescription,
      companyName,
      roleType, // 'product_manager' or 'product_designer'
      userId,
      additionalContext = ''
    } = await req.json();

    console.log('Generating cover letter for:', { companyName, roleType, userId });

    // Verify user has admin role (frontend authentication ensures userId is valid)

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError || userRole?.role !== 'admin') {
      throw new Error('Admin privileges required for cover letter generation');
    }

    // Get user's resume text and case studies
    const [resumeResult, caseStudiesResult, agentResult] = await Promise.all([
      // Get latest resume text
      supabase
        .from('job_applications')
        .select('resume_text')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1),
      
      // Get published case studies
      supabase
        .from('case_studies')
        .select('title, summary, technologies, outcomes')
        .eq('user_id', userId)
        .eq('status', 'published'),

      // Get the Cover Letter Generator agent for system prompts
      supabase
        .from('openai_agents')
        .select('system_prompts')
        .eq('user_id', userId)
        .eq('name', 'Cover Letter Generator')
        .single()
    ]);

    const resumeText = resumeResult.data?.[0]?.resume_text || '';
    const caseStudies = caseStudiesResult.data || [];
    const agent = agentResult.data;

    if (!agent?.system_prompts) {
      throw new Error('Cover Letter Generator agent not found or missing system prompts');
    }

    // Find the appropriate system prompt for the role type
    const systemPrompt = agent.system_prompts.find((prompt: any) => prompt.category === roleType);
    
    if (!systemPrompt) {
      throw new Error(`System prompt not found for role type: ${roleType}`);
    }

    // Prepare context for OpenAI
    const userPrompt = `
Generate a personalized cover letter for a ${roleType.replace('_', ' ')} position at ${companyName}.

CRITICAL INSTRUCTIONS - DATA ACCURACY:
- ONLY use information explicitly provided in the candidate's resume and case studies below
- NEVER fabricate achievements, metrics, percentages, or specific outcomes
- If no specific metrics are provided in the source materials, do NOT invent them
- Every achievement mentioned must be traceable to the provided resume or case study content
- When referencing experience, use phrases like "As demonstrated in my work on..." or "Based on my experience with..." to ground claims in actual documented work
- Focus on translating existing experience into Product Manager relevant skills rather than creating new achievements

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

CASE STUDIES:
${caseStudies.map(study => `
Title: ${study.title}
Summary: ${study.summary}
Technologies: ${study.technologies?.join(', ') || 'N/A'}
Outcomes: ${study.outcomes || 'N/A'}
`).join('\n')}

ADDITIONAL CONTEXT:
${additionalContext}

Please analyze the job description and create a compelling cover letter that:
1. STRICTLY uses only information from the provided resume and case studies above
2. Translates the candidate's actual Senior Product Designer experience into Product Manager relevant skills
3. References specific projects from the case studies (sepsis detection system, healthcare UX work, etc.)
4. Shows understanding of the company and role requirements based on actual domain expertise
5. Follows the structure outlined in the system prompt
6. If limited data is available, focus on quality over quantity - better to have fewer, authentic achievements than fabricated ones

FORBIDDEN: Do NOT include any achievements, metrics, or outcomes that are not explicitly mentioned in the resume or case studies provided above.

Return the response as a JSON object with this structure:
{
  "opening_hook": "Engaging opening paragraph that references actual background",
  "key_achievements": ["Real achievement from resume/case studies", "Another documented achievement", "Third authentic achievement"],
  "strategic_fit": ["Actual fit based on documented experience", "Real connection to provided background"],
  "call_to_action": "Closing paragraph with next steps"
}
`;

    console.log('Making OpenAI API call...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt.prompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedContent = openaiData.choices[0].message.content;

    console.log('Generated content:', generatedContent);

    // Try to parse as JSON, fallback to text format
    let coverLetterData;
    try {
      // Remove markdown code block formatting if present
      let cleanContent = generatedContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      coverLetterData = JSON.parse(cleanContent);
    } catch (e) {
      console.log('Failed to parse as JSON, creating structured format from text');
      coverLetterData = {
        opening_hook: generatedContent.split('\n')[0] || generatedContent.substring(0, 200),
        key_achievements: ["Generated from AI response"],
        strategic_fit: ["AI-generated fit analysis"],
        call_to_action: "I would welcome the opportunity to discuss how my experience can contribute to your team."
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        coverLetter: coverLetterData,
        caseStudiesUsed: caseStudies.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in cover-letter-agent function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});