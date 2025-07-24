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

    const systemContent = `You are the GenerateComparisonPages AI agent. Create clean, scannable healthcare company comparisons.

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

DATA MAPPING INSTRUCTIONS:
For company info fields, extract from vendor data:
- Founded: Use founding_year from vendor data
- Headquarters: Use headquarters from vendor data  
- Company Type: Use company_type from vendor data
- Funding: Use total_funding and funding_stage from vendor data
- Investors: Use key_investors from vendor data (join with commas)
- Employee Size: Use employee_count_range or estimate from company size
- Delivery Model: Extract from business_model or core_services
- Target Customers: Use customers field from vendor data
- Primary Solutions: Use core_services (limit to 2-3 main ones)
- AI Core: Extract AI/technology details from description and specialties
- EHR Integration: Look for integration details in key_features
- Client Base: Use performance_metrics.customer_count if available
- Certifications: Extract from certifications field
- Awards: Use any awards or recognition mentioned

STRUCTURE TO FOLLOW:
1. Company Info: ALL 13 fields must be filled (no "Not specified" or empty values)
2. Key Benefits: Exactly 3 short, impactful bullet points per company
3. Unique Strengths: Exactly 3 distinctive differentiators per company  
4. Feature Comparison: 8 key technical/business features with boolean or short string values
5. Summary Insights: One focused paragraph per company highlighting ideal use case
6. Use Cases: 5 specific scenarios with clear "best fit" designations

OUTPUT FORMAT: Return ONLY a valid JSON object (no markdown, no code blocks, no formatting). Start directly with { and end with }:
{
  "title": "Company1 vs Company2",
  "metaTitle": "Company1 vs Company2 Comparison",
  "metaDescription": "Compare Company1 and Company2 healthcare solutions",
  "company1": {
    "name": "string",
    "founded": "year",
    "headquarters": "City, State",
    "companyType": "Private/Public",
    "funding": "funding details",
    "investors": "investor names",
    "employeeSize": "size range",
    "deliveryModel": "delivery description",
    "targetCustomers": "customer types",
    "primarySolutions": "main products",
    "aiCore": "AI technology description",
    "ehrIntegration": "integration details",
    "keyBenefits": ["benefit1", "benefit2", "benefit3"],
    "uniqueStrengths": ["strength1", "strength2", "strength3"],
    "clientBase": "client description",
    "certifications": "certifications",
    "awards": "awards and recognition"
  },
  "company2": { /* same structure as company1 */ },
  "features": [
    {"feature": "Feature Name", "company1": true/false/"string", "company2": true/false/"string"}
  ],
  "summaryInsights": {
    "company1": "paragraph summary",
    "company2": "paragraph summary"
  },
  "useCases": [
    {"useCase": "scenario description", "bestFit": "Company1/Company2/Both"}
  ]
}`;

    const finalPrompt = `Generate a comparison between these two healthcare companies using the provided vendor data:

COMPANY 1: ${vendor1.company_name}
${JSON.stringify(vendor1, null, 2)}

COMPANY 2: ${vendor2.company_name}
${JSON.stringify(vendor2, null, 2)}

Create a CONCISE, SCANNABLE comparison. NO citations, references, or verbose text allowed.

EXAMPLE GOOD FORMAT:
- Key Benefits: "Real-time alerts", "Easy integration", "Cost reduction"
- Unique Strengths: "AI-powered insights", "Cloud-native platform", "Enterprise security"
- Summary: "Best for hospitals needing real-time clinical decision support"

EXAMPLE BAD FORMAT (DO NOT USE):
- "Comprehensive clinical decision support platform with advanced machine learning algorithms for predictive analytics [1]"
- "The company provides extensive integration capabilities with over 200+ EHR systems worldwide, offering seamless data exchange [2]"

CRITICAL: Return ONLY the JSON object. No markdown, explanations, or citations.`;

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