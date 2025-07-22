
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

    // Fetch user's vendor work for additional context
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select(`
        company_name,
        description,
        core_services,
        specialties,
        key_features,
        competitive_advantages,
        notable_customers
      `)
      .eq('user_id', userId)
      .eq('status', 'published')
      .limit(3);

    if (vendorsError) {
      console.log('Vendors fetch error:', vendorsError);
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

    // Add vendor/company work highlights
    if (vendors && vendors.length > 0) {
      personalizedProfile += `\nIndustry Experience:\n`;
      vendors.forEach((vendor, index) => {
        personalizedProfile += `- ${vendor.company_name}: ${vendor.description}\n`;
        if (vendor.core_services && vendor.core_services.length > 0) {
          personalizedProfile += `  Specialties: ${vendor.core_services.join(', ')}\n`;
        }
        if (vendor.notable_customers && vendor.notable_customers.length > 0) {
          personalizedProfile += `  Notable clients: ${vendor.notable_customers.slice(0, 3).join(', ')}\n`;
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

    // Create enhanced cover letter generation prompt
    const coverLetterPrompt = `
You are an expert career consultant who writes compelling, personalized cover letters. Create a professional cover letter for Jordan Leahy applying to ${companyName}.

Company Name: ${companyName}
Job Description: ${jobDescription}
${jobDescriptionLink ? `Job Posting URL: ${jobDescriptionLink}` : ''}

${personalizedProfile}

Write a compelling cover letter that:
1. Addresses the hiring manager professionally
2. Demonstrates deep understanding of the company's mission and challenges
3. Shows specific alignment between Jordan's ACTUAL experience and the job requirements
4. Highlights quantifiable achievements from the real projects listed above
5. References specific case studies or work that directly relate to the job requirements
6. Expresses genuine enthusiasm for the opportunity
7. Maintains a confident, professional tone throughout

The cover letter should be 500-700 words and feel personal, not templated. Focus on specific value Jordan can bring based on the real project experience above.

Return ONLY the cover letter text, no JSON formatting or additional structure.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o3-2025-04-16',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert career consultant who creates highly targeted, personalized cover letters. You understand how to analyze job descriptions and create compelling narratives that demonstrate perfect fit. Always respond with just the cover letter text.' 
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
    const coverLetter = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      cover_letter: coverLetter,
      case_studies_used: caseStudies?.length || 0,
      vendors_used: vendors?.length || 0,
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
