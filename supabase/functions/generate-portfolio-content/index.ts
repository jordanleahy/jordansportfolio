
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

    // Create focused cover letter generation prompt
    const coverLetterPrompt = `
You are an expert career consultant who writes compelling, personalized cover letters. Create a professional cover letter for Jordan Leahy applying to ${companyName}.

Company Name: ${companyName}
Job Description: ${jobDescription}
${jobDescriptionLink ? `Job Posting URL: ${jobDescriptionLink}` : ''}

About Jordan Leahy:
- Senior healthcare technology professional with 10+ years of experience
- Expert in AI/ML applications for clinical workflows and population health
- Strong background in revenue cycle management, clinical documentation integrity, and healthcare data analytics
- Proven track record of implementing technology solutions that improve patient outcomes and operational efficiency
- Experience with EHR systems, healthcare interoperability, and regulatory compliance

Write a compelling cover letter that:
1. Addresses the hiring manager professionally
2. Demonstrates deep understanding of the company's mission and challenges
3. Shows specific alignment between Jordan's experience and the job requirements
4. Highlights quantifiable achievements relevant to this role
5. Expresses genuine enthusiasm for the opportunity
6. Maintains a confident, professional tone throughout

The cover letter should be 500-700 words and feel personal, not templated. Focus on value Jordan can bring to solve their specific problems.

Return ONLY the cover letter text, no JSON formatting or additional structure.
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
            content: 'You are an expert career consultant who creates highly targeted, personalized cover letters. You understand how to analyze job descriptions and create compelling narratives that demonstrate perfect fit. Always respond with just the cover letter text.' 
          },
          { role: 'user', content: coverLetterPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const coverLetter = data.choices[0].message.content;

    return new Response(JSON.stringify({ cover_letter: coverLetter }), {
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
