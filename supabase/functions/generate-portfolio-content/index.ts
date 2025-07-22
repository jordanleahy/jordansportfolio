
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

    // Build OpenAI messages with function calling
    const messages = [
      {
        role: 'system',
        content: 'You are an expert career consultant who writes highly targeted, SCANNABLE cover letters. Always respond with VALID JSON or N/A—never invent metrics or projects.'
      },
      { role: 'system', content: caseStudyContext.trim() },
      {
        role: 'user',
        content: `Create a structured cover letter for Jordan Leahy applying to ${companyName}. Use only information from the REAL PROJECT PORTFOLIO above. If a requirement has no match, use "N/A". Output only JSON matching the schema.

COMPANY: ${companyName}
JOB DESCRIPTION: ${jobDescription}
${jobDescriptionLink ? `JOB POSTING URL: ${jobDescriptionLink}` : ''}

CRITICAL: Only reference actual case studies listed above. Do not fabricate any information.`
      }
    ];

    // Define the function schema for structured output
    const functions = [
      {
        name: 'create_cover_letter',
        description: 'Creates a structured cover letter based on real project portfolio',
        parameters: {
          type: 'object',
          properties: {
            opening_hook: {
              type: 'string',
              description: 'One powerful sentence connecting a specific real project to company needs'
            },
            key_achievements: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of 2-3 bullet points using ONLY actual case study project names and outcomes'
            },
            strategic_fit: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of 2 specific connections between real projects and company needs'
            },
            call_to_action: {
              type: 'string',
              description: 'Confident next step referencing the role or company challenge'
            }
          },
          required: ['opening_hook', 'key_achievements', 'strategic_fit', 'call_to_action']
        }
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        temperature: 0,
        messages,
        functions,
        function_call: { name: 'create_cover_letter' },
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse function call response
    let structuredContent;
    try {
      const functionCall = data.choices[0].message.function_call;
      if (functionCall && functionCall.name === 'create_cover_letter') {
        structuredContent = JSON.parse(functionCall.arguments);
      } else {
        throw new Error('No function call found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse function call response:', parseError);
      console.error('Full response:', JSON.stringify(data, null, 2));
      
      // Fallback to parsing message content if available
      const messageContent = data.choices[0].message.content;
      if (messageContent) {
        try {
          structuredContent = JSON.parse(messageContent);
        } catch (contentParseError) {
          structuredContent = {
            opening_hook: messageContent || "I am excited to apply my healthcare technology experience to this role.",
            key_achievements: ["N/A - No case studies available"],
            strategic_fit: ["N/A - Unable to match requirements"],
            call_to_action: "I would love to discuss how my experience can contribute to your team's success."
          };
        }
      } else {
        structuredContent = {
          opening_hook: "I am excited to apply my healthcare technology experience to this role.",
          key_achievements: ["N/A - No case studies available"],
          strategic_fit: ["N/A - Unable to match requirements"],
          call_to_action: "I would love to discuss how my experience can contribute to your team's success."
        };
      }
    }

    return new Response(JSON.stringify({ 
      cover_letter: structuredContent,
      case_studies_used: caseStudies?.length || 0
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
