
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to generate a slug from company name
const generateSlug = (companyName: string): string => {
  return companyName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

// Helper function to categorize company based on industry
const categorizeCompany = (industry: string, services: string[]): string => {
  const industryLower = industry.toLowerCase();
  const servicesText = services.join(' ').toLowerCase();
  
  if (industryLower.includes('healthcare') || industryLower.includes('medical') || 
      servicesText.includes('healthcare') || servicesText.includes('medical')) {
    return 'healthcare';
  }
  if (industryLower.includes('financial') || industryLower.includes('fintech') ||
      servicesText.includes('payment') || servicesText.includes('banking')) {
    return 'fintech';
  }
  if (industryLower.includes('software') || industryLower.includes('saas') ||
      servicesText.includes('software') || servicesText.includes('platform')) {
    return 'saas';
  }
  if (industryLower.includes('artificial intelligence') || industryLower.includes('ai') ||
      servicesText.includes('artificial intelligence') || servicesText.includes('machine learning')) {
    return 'ai';
  }
  if (industryLower.includes('security') || industryLower.includes('cyber') ||
      servicesText.includes('security') || servicesText.includes('cyber')) {
    return 'cybersecurity';
  }
  if (industryLower.includes('education') || industryLower.includes('learning') ||
      servicesText.includes('education') || servicesText.includes('learning')) {
    return 'edtech';
  }
  if (industryLower.includes('human resources') || industryLower.includes('hr') ||
      servicesText.includes('hr') || servicesText.includes('talent')) {
    return 'hrtech';
  }
  
  return 'saas'; // Default category
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offering } = await req.json();
    console.log('Processing offering:', offering.accessionnumber);

    if (!offering) {
      throw new Error('No offering data provided');
    }

    // Extract basic company info from offering
    const companyName = offering.issuers?.[0]?.entityname || offering.company_name || 'Unknown Company';
    const location = offering.issuers?.[0]?.city && offering.issuers?.[0]?.stateorcountrydescription 
      ? `${offering.issuers[0].city}, ${offering.issuers[0].stateorcountrydescription}`
      : 'Location not specified';
    const industry = offering.industrygrouptype || 'Technology';
    const fundingAmount = offering.totalofferingamount || offering.totalamountsold;

    // Create enhanced prompt for OpenAI (Note: Using knowledge cutoff data)
    const prompt = `You are a business intelligence researcher. Based on your knowledge, provide detailed information about the company "${companyName}" located in ${location} in the ${industry} industry. They recently raised ${fundingAmount ? `$${fundingAmount.toLocaleString()}` : 'funding'}.

Please provide comprehensive information in this exact JSON format:

{
  "company_name": "Exact company name",
  "description": "Detailed 2-3 sentence description of what the company does and their value proposition",
  "headquarters": "City, State/Country format",
  "founding_year": 2020,
  "company_type": "One of: Startup, Private Company, Public Company, Non-profit",
  "business_model": "Brief description of how they make money",
  "employee_count_range": "One of: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+, Unknown",
  "core_services": ["Primary service 1", "Primary service 2", "Primary service 3"],
  "specialties": ["Specialty area 1", "Specialty area 2", "Specialty area 3"],
  "key_features": ["Key feature 1", "Key feature 2", "Key feature 3"],
  "key_benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "target_customers": ["Customer type 1", "Customer type 2", "Customer type 3"],
  "notable_customers": ["Notable customer 1", "Notable customer 2"],
  "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"],
  "competitive_advantages": ["Advantage 1", "Advantage 2", "Advantage 3"],
  "funding_stage": "One of: Pre-Seed, Seed, Series A, Series B, Series C, Series D+, IPO, Unknown",
  "total_funding": "Amount in format like $5.2M or $15M",
  "key_investors": ["Investor 1", "Investor 2", "Investor 3"],
  "website_url": "https://company-website.com",
  "linkedin_url": "https://linkedin.com/company/...",
  "twitter_url": "https://twitter.com/...",
  "contact_email": "contact@company.com",
  "contact_phone": "+1-xxx-xxx-xxxx",
  "tech_stack": ["Technology 1", "Technology 2", "Technology 3"],
  "certifications": ["Certification 1", "Certification 2"],
  "awards_recognition": ["Award 1", "Award 2"],
  "partnerships": ["Partner 1", "Partner 2"],
  "geographic_presence": "Geographic regions they serve"
}

Important guidelines:
- Search thoroughly for accurate, up-to-date information
- If information is not available, use null for strings, empty arrays for arrays, or appropriate defaults
- Ensure all data is factual and sourced from recent web searches
- Focus on business-relevant information that would be useful for competitive intelligence
- For funding information, try to find the most recent and accurate data`;

    console.log('Calling OpenAI API for company research...');

    // Call OpenAI API with search capabilities
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a business intelligence researcher with access to web search. Always search for the most current and accurate information about companies. Provide detailed, factual responses in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices[0].message.content;

    console.log('OpenAI response received, parsing JSON...');

    // Parse the JSON response
    let vendorData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : generatedContent;
      vendorData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Generate slug and category
    const slug = generateSlug(vendorData.company_name);
    const category = categorizeCompany(industry, vendorData.core_services || []);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from the request headers
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) throw error;
        userId = user?.id;
      } catch (authError) {
        console.error('Auth error:', authError);
        throw new Error('Invalid authentication token');
      }
    }

    if (!userId) {
      throw new Error('User authentication required');
    }

    console.log('Creating vendor record...');

    // Check if vendor already exists
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id, company_name')
      .eq('company_name', vendorData.company_name)
      .maybeSingle();

    let vendorRecord;

    if (existingVendor) {
      // Update existing vendor
      const { data, error } = await supabase
        .from('vendors')
        .update({
          description: vendorData.description,
          headquarters: vendorData.headquarters || location,
          founding_year: vendorData.founding_year,
          company_type: vendorData.company_type || 'Private Company',
          business_model: vendorData.business_model,
          employee_count_range: vendorData.employee_count_range,
          core_services: vendorData.core_services || [],
          specialties: vendorData.specialties || [],
          key_features: vendorData.key_features || [],
          key_benefits: vendorData.key_benefits || [],
          customers: vendorData.target_customers || [],
          notable_customers: vendorData.notable_customers || [],
          competitors: vendorData.competitors || [],
          competitive_advantages: vendorData.competitive_advantages || [],
          funding_stage: vendorData.funding_stage,
          total_funding: vendorData.total_funding,
          key_investors: vendorData.key_investors || [],
          website_url: vendorData.website_url,
          linkedin_url: vendorData.linkedin_url,
          twitter_url: vendorData.twitter_url,
          contact_email: vendorData.contact_email,
          contact_phone: vendorData.contact_phone,
          tech_stack: vendorData.tech_stack || [],
          certifications: vendorData.certifications || [],
          awards_recognition: vendorData.awards_recognition || [],
          partnerships: vendorData.partnerships || [],
          geographic_presence: vendorData.geographic_presence,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingVendor.id)
        .select()
        .single();

      if (error) throw error;
      vendorRecord = data;
      console.log('Updated existing vendor:', vendorRecord.id);
    } else {
      // Create new vendor
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          company_name: vendorData.company_name,
          slug: slug,
          description: vendorData.description,
          headquarters: vendorData.headquarters || location,
          founding_year: vendorData.founding_year,
          company_type: vendorData.company_type || 'Private Company',
          business_model: vendorData.business_model,
          employee_count_range: vendorData.employee_count_range,
          core_services: vendorData.core_services || [],
          specialties: vendorData.specialties || [],
          key_features: vendorData.key_features || [],
          key_benefits: vendorData.key_benefits || [],
          customers: vendorData.target_customers || [],
          notable_customers: vendorData.notable_customers || [],
          competitors: vendorData.competitors || [],
          competitive_advantages: vendorData.competitive_advantages || [],
          funding_stage: vendorData.funding_stage,
          total_funding: vendorData.total_funding,
          key_investors: vendorData.key_investors || [],
          website_url: vendorData.website_url,
          linkedin_url: vendorData.linkedin_url,
          twitter_url: vendorData.twitter_url,
          contact_email: vendorData.contact_email,
          contact_phone: vendorData.contact_phone,
          tech_stack: vendorData.tech_stack || [],
          certifications: vendorData.certifications || [],
          awards_recognition: vendorData.awards_recognition || [],
          partnerships: vendorData.partnerships || [],
          geographic_presence: vendorData.geographic_presence,
          user_id: userId,
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;
      vendorRecord = data;
      console.log('Created new vendor:', vendorRecord.id);
    }

    return new Response(JSON.stringify({
      success: true,
      vendor: vendorRecord,
      category: category,
      action: existingVendor ? 'updated' : 'created'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in vendor-enhancement-agent:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
