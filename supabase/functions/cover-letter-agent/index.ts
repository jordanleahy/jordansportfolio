/**
 * EDGE FUNCTION: Cover Letter Agent
 * 
 * PURPOSE:
 * Generates personalized cover letters for job applications using AI, specifically designed
 * for Product Manager and Product Designer roles. Leverages user's resume data and case studies
 * to create compelling, data-accurate cover letters with role-specific messaging.
 * 
 * INPUTS:
 * - jobDescription: string - Full job posting description
 * - companyName: string - Target company name
 * - roleType: string ('product_manager' | 'product_designer') - Position type for prompt selection
 * - userId: string - User identifier for data retrieval
 * - additionalContext: string (optional) - Extra context or requirements
 * 
 * OUTPUTS:
 * - Success: { success: true, coverLetter: object, caseStudiesUsed: number, correlationId: string, usage: object }
 * - Error: { success: false, error: string }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-4o-mini for text generation)
 * - Supabase Database (user_roles, job_applications, case_studies, openai_agents, system_prompts tables)
 * - OpenAI Attribution System (usage tracking and cost calculation)
 * 
 * USAGE:
 * Called from: Job application components and portfolio generation workflows
 * Authentication: Required - Admin role verification enforced
 * 
 * FLOW:
 * 1. Verify user has admin privileges for cover letter generation
 * 2. Retrieve user's latest resume and published case studies
 * 3. Get appropriate system prompt based on role type (Product Manager vs Product Designer)
 * 4. Call OpenAI API with strict data accuracy instructions
 * 5. Parse response into structured JSON format (opening_hook, key_achievements, etc.)
 * 6. Track API usage and costs for monitoring
 * 7. Return structured cover letter data for frontend rendering
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { trackOpenAIUsage, generateCorrelationId, makeOpenAIRequest, enhanceOpenAIRequestBody, extractUsageFromOpenAIResponse } from '../_shared/openai-attribution.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  const correlationId = generateCorrelationId();
  let success = false;
  let estimatedCost = 0;
  let tokensUsed = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let errorMessage: string | undefined;
  let requestMetadata: any = {};
  let openAIRequestId: string | undefined;

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
      userId: requestUserId,
      additionalContext = ''
    } = await req.json();

    userId = requestUserId;
    requestMetadata = { companyName, roleType, correlationId };

    console.log('Generating cover letter for:', { companyName, roleType, userId: userId?.slice(0, 8), correlationId });

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

      // Get the Cover Letter Generator agent
      supabase
        .from('openai_agents')
        .select('id')
        .eq('user_id', userId)
        .eq('name', 'Cover Letter Generator')
        .single()
    ]);

    const resumeText = resumeResult.data?.[0]?.resume_text || '';
    const caseStudies = caseStudiesResult.data || [];
    const agent = agentResult.data;

    if (!agent) {
      throw new Error('Cover Letter Generator agent not found');
    }

    // Get the system prompt for the role type from the system_prompts table
    const { data: systemPromptData, error: promptError } = await supabase
      .from('system_prompts')
      .select('prompt_text')
      .eq('agent_id', agent.id)
      .eq('category', roleType)
      .eq('is_active', true)
      .single();
    
    if (promptError || !systemPromptData) {
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

    // Enhanced OpenAI request with correlation tracking
    const requestBody = enhanceOpenAIRequestBody({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: systemPromptData.prompt_text },
        { role: 'user', content: userPrompt }
      ],
      temperature: 1,
      max_tokens: 2000,
    }, correlationId);

    const { response: openaiResponse, openAIRequestId: responseOpenAIRequestId, responseTime } = await makeOpenAIRequest({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      correlationId,
    });

    openAIRequestId = responseOpenAIRequestId;

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedContent = openaiData.choices[0].message.content;

    // Extract usage data for cost calculation
    const usageData = extractUsageFromOpenAIResponse(openaiData);
    promptTokens = usageData.promptTokens || 0;
    completionTokens = usageData.completionTokens || 0;
    tokensUsed = usageData.totalTokens || 0;
    estimatedCost = usageData.estimatedCost;

    success = true;

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

    // Track API usage with enhanced attribution
    const responseTime = Date.now() - startTime;
    await trackOpenAIUsage({
      userId,
      functionName: 'cover-letter-agent',
       model: 'gpt-5-mini',
      requestType: 'text_generation',
      success,
      estimatedCost,
      tokensUsed,
      promptTokens,
      completionTokens,
      responseTimeMs: responseTime,
      metadata: requestMetadata,
      correlationId,
      openAIRequestId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        coverLetter: coverLetterData,
        caseStudiesUsed: caseStudies.length,
        correlationId,
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: tokensUsed,
          estimated_cost: estimatedCost
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in cover-letter-agent function:', error);
    errorMessage = error.message || 'An unexpected error occurred';
    
    // Track failed API usage with enhanced attribution
    if (userId) {
      try {
        const responseTime = Date.now() - startTime;
        await trackOpenAIUsage({
          userId,
          functionName: 'cover-letter-agent',
          model: 'gpt-5-mini',
          requestType: 'text_generation',
          success: false,
          estimatedCost: 0,
          tokensUsed: 0,
          promptTokens: 0,
          completionTokens: 0,
          responseTimeMs: responseTime,
          errorMessage,
          metadata: requestMetadata,
          correlationId,
          openAIRequestId,
        });
      } catch (trackingError) {
        console.error('Failed to track error usage:', trackingError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});