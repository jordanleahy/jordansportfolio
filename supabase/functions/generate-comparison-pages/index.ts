import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { vendor1, vendor2 } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!vendor1 || !vendor2) {
      throw new Error('Both vendor1 and vendor2 data are required for comparison generation');
    }

    console.log(`Generating comparison between ${vendor1.company_name} and ${vendor2.company_name}`);

    const systemContent = `You are the GenerateComparisonPages AI agent. Create clean, scannable healthcare company comparisons for STRUCTURED DATABASE STORAGE.

ABSOLUTELY CRITICAL - ENFORCE STRICTLY:
- ABSOLUTELY NO CITATIONS, REFERENCES, OR BRACKETED NUMBERS ANYWHERE
- ABSOLUTELY NO verbose paragraphs or lengthy explanations
- MUST BE scan-friendly with bullet points and short phrases
- Key Benefits: MAXIMUM 8 words per bullet point
- Unique Strengths: MAXIMUM 12 words per bullet point  
- Summary Insights: MAXIMUM 30 words per company paragraph
- ALL content MUST BE concise, punchy, and immediately readable
- Focus ONLY on key differentiators that matter for quick comparison
- Use short, impactful phrases - NOT full sentences

DATA MAPPING INSTRUCTIONS - USE ACTUAL VENDOR DATA:
Extract real data from vendor objects. Use "N/A" only if field is truly missing:

- Founded: vendor.founding_year (convert to string) or "N/A"
- Headquarters: vendor.headquarters or "N/A"
- Company Type: vendor.company_type or "N/A"
- Funding: vendor.total_funding + " (" + vendor.funding_stage + ")" or vendor.funding_stage or "N/A"
- Investors: vendor.key_investors.join(", ") (limit to top 3-4) or "N/A"
- Employee Size: vendor.employee_count_range or "N/A"
- Delivery Model: vendor.business_model or extract from vendor.core_services or "N/A"
- Target Customers: vendor.customers.join(", ") (limit to top 3) or "N/A"
- Primary Solutions: vendor.core_services.slice(0,3).join(", ") or "N/A"
- AI Core: extract AI/ML terms from vendor.specialties or vendor.description or "N/A"
- EHR Integration: extract EHR systems from vendor.key_features or vendor.specialties or "N/A"
- Notable Customers: vendor.notable_customers.join(", ") (limit to top 3-4) or "N/A"
- Partnerships: vendor.partnerships.join(", ") (focus on major tech partners) or "N/A"

CRITICAL: DO NOT use placeholder text like "Company1", "Series C", "Investor1". 
Extract the ACTUAL data from the vendor objects provided. If a field is missing, use "N/A".

STRUCTURE TO FOLLOW:
1. Main comparison metadata (title, meta_title, meta_description, slug)
2. Company data (name, founded, headquarters, key_benefits array, unique_strengths array)
3. Basic info categories (Founded, Headquarters, Company Type, etc.)
4. Feature comparisons (8 key technical/business features with boolean or short string values)
5. Summary insights (One focused paragraph per company highlighting ideal use case)
6. Use cases (5 specific scenarios with clear "best fit" designations)

OUTPUT FORMAT: Return ONLY a valid JSON object for STRUCTURED DATABASE INSERTION (no markdown, no code blocks, no formatting). Start directly with { and end with }:
{
  "comparison": {
    "title": "Company1 vs Company2",
    "meta_title": "Company1 vs Company2 Comparison", 
    "meta_description": "Compare Company1 and Company2 healthcare solutions",
    "slug": "company1-vs-company2",
    "status": "published"
  },
  "companies": [
    {
      "company_position": 1,
      "name": "Company1 Name",
      "founded": "2010",
      "headquarters": "City, State, Country",
      "key_benefits": ["benefit1", "benefit2", "benefit3"],
      "unique_strengths": ["strength1", "strength2", "strength3"]
    },
    {
      "company_position": 2,
      "name": "Company2 Name", 
      "founded": "2015",
      "headquarters": "City, State, Country",
      "key_benefits": ["benefit1", "benefit2", "benefit3"],
      "unique_strengths": ["strength1", "strength2", "strength3"]
    }
  ],
  "basic_info": [
    {"category": "Founded", "company1_value": "2010", "company2_value": "2015", "sort_order": 0},
    {"category": "Headquarters", "company1_value": "Austin, TX", "company2_value": "Boston, MA", "sort_order": 1},
    {"category": "Company Type", "company1_value": "Private", "company2_value": "Public", "sort_order": 2},
    {"category": "Funding", "company1_value": "Series C", "company2_value": "IPO", "sort_order": 3},
    {"category": "Investors", "company1_value": "Investor1, Investor2", "company2_value": "Investor3, Investor4", "sort_order": 4},
    {"category": "Employee Size", "company1_value": "201-500", "company2_value": "1000+", "sort_order": 5},
    {"category": "Delivery Model", "company1_value": "Cloud SaaS", "company2_value": "Hybrid", "sort_order": 6},
    {"category": "Target Customers", "company1_value": "Hospitals", "company2_value": "Health Systems", "sort_order": 7},
    {"category": "Primary Solutions", "company1_value": "Solution A", "company2_value": "Solution B", "sort_order": 8},
    {"category": "AI Core", "company1_value": "ML Engine", "company2_value": "AI Platform", "sort_order": 9},
    {"category": "EHR Integration", "company1_value": "Epic, Cerner", "company2_value": "All major", "sort_order": 10},
    {"category": "Notable Customers", "company1_value": "Customer1, Customer2", "company2_value": "Customer3, Customer4", "sort_order": 11},
    {"category": "Partnerships", "company1_value": "Partner1, Partner2", "company2_value": "Partner3, Partner4", "sort_order": 12}
  ],
  "features": [
    {"feature_name": "Real-time Analytics", "company1_value": "Yes", "company2_value": "Yes", "sort_order": 0},
    {"feature_name": "Mobile Access", "company1_value": "Yes", "company2_value": "No", "sort_order": 1},
    {"feature_name": "Custom Dashboards", "company1_value": "Yes", "company2_value": "Limited", "sort_order": 2}
  ],
  "insights": [
    {"company_position": 1, "insight_text": "Best for hospitals needing real-time clinical decision support"},
    {"company_position": 2, "insight_text": "Ideal for large health systems requiring comprehensive workflow automation"}
  ],
  "use_cases": [
    {"use_case": "Large hospital system implementation", "best_fit": "Company2", "sort_order": 0},
    {"use_case": "Mid-size hospital efficiency", "best_fit": "Company1", "sort_order": 1},
    {"use_case": "Academic medical center", "best_fit": "Both", "sort_order": 2}
  ]
}`;

    const finalPrompt = `Generate a comparison between these two healthcare companies using the provided vendor data:

COMPANY 1: ${vendor1.company_name}
${JSON.stringify(vendor1, null, 2)}

COMPANY 2: ${vendor2.company_name}
${JSON.stringify(vendor2, null, 2)}

Create a CONCISE, SCANNABLE comparison for STRUCTURED DATABASE STORAGE. NO citations, references, or verbose text allowed.

EXAMPLE GOOD FORMAT:
- Key Benefits: "Real-time alerts", "Easy integration", "Cost reduction"
- Unique Strengths: "AI-powered insights", "Cloud-native platform", "Enterprise security"
- Summary: "Best for hospitals needing real-time clinical decision support"

EXAMPLE BAD FORMAT (DO NOT USE):
- "Comprehensive clinical decision support platform with advanced machine learning algorithms for predictive analytics [1]"
- "The company provides extensive integration capabilities with over 200+ EHR systems worldwide, offering seamless data exchange [2]"

CRITICAL: Return ONLY the structured JSON object for database insertion. No markdown, explanations, or citations.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: finalPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    let generatedText = data.choices[0].message.content;
    
    // Post-process to remove any citations or references that might have slipped through
    generatedText = generatedText.replace(/\[\d+\]/g, '').replace(/\([^)]*\d[^)]*\)/g, '').trim();

    console.log('Successfully generated comparison content');

    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-comparison-pages function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate comparison. Please check your vendor data and try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});