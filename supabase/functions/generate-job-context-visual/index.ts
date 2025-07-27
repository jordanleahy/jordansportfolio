import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobTitle, jobDescription, companyName, userId } = await req.json();
    
    if (!jobTitle || !jobDescription || !companyName || !userId) {
      throw new Error('Job title, description, company name, and user ID are required');
    }

    console.log('Generating context-aware job visual prompt for:', {
      jobTitle,
      companyName,
      userId
    });

    // Analyze the job and company context
    const contextAnalysis = await analyzeJobContext(jobTitle, jobDescription, companyName);
    
    console.log('Job context analysis completed:', {
      industryContext: contextAnalysis.industryContext,
      roleType: contextAnalysis.roleType,
      visualTheme: contextAnalysis.visualTheme
    });

    // Generate specialized system prompt using Context Aware agent
    const generatedSystemPrompt = await generateJobSystemPrompt(userId, contextAnalysis);
    
    console.log('Generated specialized system prompt for job visual');

    // Generate the actual image prompt using the specialized system prompt
    const imagePrompt = await generateImagePrompt(
      jobTitle, 
      jobDescription, 
      companyName, 
      generatedSystemPrompt
    );

    return new Response(JSON.stringify({
      success: true,
      imagePrompt,
      contextAnalysis,
      systemPrompt: generatedSystemPrompt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-job-context-visual:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeJobContext(jobTitle: string, jobDescription: string, companyName: string) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const analysisPrompt = `Analyze this job posting and company to understand the context for generating appropriate visual prompts:

Job Title: ${jobTitle}
Company Name: ${companyName}
Job Description: ${jobDescription}

Please analyze and return a JSON object with:
{
  "industryContext": "The industry this company operates in (healthcare, fintech, tech, retail, etc.)",
  "companySize": "startup, mid-size, enterprise, or unknown",
  "roleType": "The type of role (product_manager, software_engineer, designer, data_scientist, etc.)",
  "visualTheme": "Brief description of visual style that would represent this company/role",
  "colorPalette": "Suggested colors based on industry (medical blues/greens, tech purples/oranges, corporate navy/gray, etc.)",
  "imageStyle": "Recommended style (professional portrait, collaborative team, tech-focused, creative, etc.)",
  "keyElements": ["element1", "element2", "element3"],
  "brandTone": "professional, innovative, trustworthy, creative, etc.",
  "targetMessage": "What message should the visual convey for this specific role/company combination"
}`;

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
          content: 'You are an expert in company branding and job market analysis. Analyze job postings to understand industry context, company culture, and appropriate visual themes for job application materials. Always respond with valid JSON only.' 
        },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.2
    }),
  });

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Failed to analyze job context');
  }

  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (parseError) {
    console.error('Failed to parse job analysis JSON:', data.choices[0].message.content);
    // Fallback analysis
    return {
      industryContext: "technology",
      companySize: "unknown",
      roleType: "product_manager",
      visualTheme: "Professional and modern",
      colorPalette: "professional blues and grays",
      imageStyle: "professional portrait",
      keyElements: ["professional", "technology", "collaboration"],
      brandTone: "professional",
      targetMessage: "Competent professional ready for the role"
    };
  }
}

async function generateJobSystemPrompt(userId: string, analysis: any) {
  // Get the Context Aware Visual Prompt Generator agent
  const { data: contextAgent, error: agentError } = await supabase
    .from('openai_agents')
    .select('*')
    .eq('user_id', userId)
    .eq('name', 'Context Aware Visual Prompt Generator')
    .single();

  if (agentError || !contextAgent) {
    throw new Error('Context Aware Visual Prompt Generator agent not found');
  }

  const systemPrompt = contextAgent.system_prompts?.[0]?.prompt || '';
  
  const userPrompt = `Generate a specialized system prompt for creating job application visual prompts based on this analysis:

Industry Context: ${analysis.industryContext}
Company Size: ${analysis.companySize}
Role Type: ${analysis.roleType}
Visual Theme: ${analysis.visualTheme}
Color Palette: ${analysis.colorPalette}
Image Style: ${analysis.imageStyle}
Key Elements: ${analysis.keyElements.join(', ')}
Brand Tone: ${analysis.brandTone}
Target Message: ${analysis.targetMessage}

The system prompt should guide an AI to create professional job application visuals (9:16 aspect ratio) that:
1. Match the industry aesthetic (${analysis.industryContext})
2. Reflect the company's tone (${analysis.brandTone})
3. Are appropriate for the role type (${analysis.roleType})
4. Use the suggested color palette and visual elements
5. Create a compelling visual for job applications

Generate a complete, detailed system prompt that will produce consistent, professional job application visuals.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: contextAgent.model_version,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2
    }),
  });

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Failed to generate job system prompt');
  }

  return data.choices[0].message.content.trim();
}

async function generateImagePrompt(
  jobTitle: string, 
  jobDescription: string, 
  companyName: string, 
  systemPrompt: string
) {
  const userPrompt = `Generate a professional image prompt for a job application visual with these details:

Job Title: ${jobTitle}
Company: ${companyName}
Job Description: ${jobDescription.substring(0, 500)}...

Create a 9:16 aspect ratio image prompt that would be perfect for a job application or professional portfolio piece related to this specific role and company.`;

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
      temperature: 0.3
    }),
  });

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Failed to generate image prompt');
  }

  return data.choices[0].message.content.trim();
}