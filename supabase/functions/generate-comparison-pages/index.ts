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

    console.log(`🚀 Starting comparison generation`);
    console.log(`📊 Company 1 Data:`, { 
      name: vendor1.company_name, 
      id: vendor1.id,
      dataKeys: Object.keys(vendor1)
    });
    console.log(`📊 Company 2 Data:`, { 
      name: vendor2.company_name, 
      id: vendor2.id,
      dataKeys: Object.keys(vendor2)
    });

    console.log(`Generating comparison between ${vendor1.company_name} and ${vendor2.company_name}`);

    // Create slug-friendly company names
    const company1Slug = vendor1.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const company2Slug = vendor2.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    console.log(`🔗 Generated slugs:`, { 
      company1Slug, 
      company2Slug 
    });

    const systemContent = `🚨 ABSOLUTE FORMATTING REQUIREMENTS - MANDATORY COMPLIANCE 🚨

1. Key Benefits: MAXIMUM 8 WORDS per bullet (50 chars max) - NO EXCEPTIONS
2. Unique Strengths: MAXIMUM 12 WORDS per bullet (80 chars max) - NO EXCEPTIONS  
3. NO CITATIONS, NO REFERENCES, NO BRACKETED NUMBERS - REMOVE ALL [1], (ref), etc.
4. Use action verbs and concrete benefits ONLY
5. NO fluff words: "comprehensive", "robust", "innovative", "advanced"

EXAMPLES OF CORRECT FORMAT:
Key Benefits (8 words max):
✅ "Reduces denials by 46%" (4 words)
✅ "Accelerates cash flow" (3 words)
✅ "Automates revenue cycle" (3 words)
❌ "Provides comprehensive revenue cycle management solutions with advanced AI capabilities [1]"

Unique Strengths (12 words max):
✅ "Unified cloud-based platform for revenue management" (7 words)
✅ "AltitudeAI predicts denials before submission" (6 words)
❌ "Offers a comprehensive, cloud-based platform that provides unified revenue cycle management [ref]"

You are the GenerateComparisonPages AI agent. Create clean, scannable healthcare company comparisons for STRUCTURED DATABASE STORAGE.

🚨 CRITICAL ENFORCEMENT - NO EXCEPTIONS:
- ZERO CITATIONS: No [1], (ref), [reference], etc. - REMOVE ALL
- ZERO VERBOSE TEXT: Only short, punchy phrases
- Key Benefits: 8 WORDS MAX (action verb + benefit)
- Unique Strengths: 12 WORDS MAX (specific differentiator)
- Summary Insights: 30 WORDS MAX per company
- Use bullet points, NOT paragraphs
- Focus ONLY on key differentiators for quick scanning

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
- Certifications: vendor.certifications.join(", ") or "N/A"
- Awards & Recognition: vendor.awards_recognition.join(", ") or "N/A"

CRITICAL: DO NOT use placeholder text like "Company1", "Series C", "Investor1". 
Extract the ACTUAL data from the vendor objects provided. If a field is missing, use "N/A".

COMPANIES TO COMPARE:
- COMPANY 1: ${vendor1.company_name}
- COMPANY 2: ${vendor2.company_name}

MANDATORY: Use these EXACT company names in ALL output fields. Do NOT use placeholders.

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
    "title": "${vendor1.company_name} vs ${vendor2.company_name}",
    "meta_title": "${vendor1.company_name} vs ${vendor2.company_name} Comparison", 
    "meta_description": "Compare ${vendor1.company_name} and ${vendor2.company_name} healthcare solutions",
    "slug": "${company1Slug}-vs-${company2Slug}",
    "status": "published"
  },
  "companies": [
    {
      "company_position": 1,
      "name": "${vendor1.company_name}",
      "founded": "ACTUAL_YEAR_FROM_VENDOR1",
      "headquarters": "ACTUAL_HQ_FROM_VENDOR1",
      "key_benefits": ["benefit1", "benefit2", "benefit3"],
      "unique_strengths": ["strength1", "strength2", "strength3"]
    },
    {
      "company_position": 2,
      "name": "${vendor2.company_name}", 
      "founded": "ACTUAL_YEAR_FROM_VENDOR2",
      "headquarters": "ACTUAL_HQ_FROM_VENDOR2",
      "key_benefits": ["benefit1", "benefit2", "benefit3"],
      "unique_strengths": ["strength1", "strength2", "strength3"]
    }
  ],
  "basic_info": [
    {"category": "Founded", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 0},
    {"category": "Headquarters", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 1},
    {"category": "Company Type", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 2},
    {"category": "Funding", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 3},
    {"category": "Investors", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 4},
    {"category": "Employee Size", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 5},
    {"category": "Delivery Model", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 6},
    {"category": "Target Customers", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 7},
    {"category": "Primary Solutions", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 8},
    {"category": "AI Core", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 9},
    {"category": "EHR Integration", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 10},
    {"category": "Notable Customers", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 11},
    {"category": "Partnerships", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 12},
    {"category": "Certifications", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 13},
    {"category": "Awards & Recognition", "company1_value": "ACTUAL_DATA", "company2_value": "ACTUAL_DATA", "sort_order": 14}
  ],
  "features": [
    {"feature_name": "Real-time Analytics", "company1_value": "Yes", "company2_value": "Yes", "sort_order": 0},
    {"feature_name": "Mobile Access", "company1_value": "Yes", "company2_value": "No", "sort_order": 1},
    {"feature_name": "Custom Dashboards", "company1_value": "Yes", "company2_value": "Limited", "sort_order": 2}
  ],
  "insights": [
    {"company_position": 1, "insight_text": "Best use case for ${vendor1.company_name}"},
    {"company_position": 2, "insight_text": "Best use case for ${vendor2.company_name}"}
  ],
  "use_cases": [
    {"use_case": "Large hospital system implementation", "best_fit": "${vendor1.company_name} or ${vendor2.company_name}", "sort_order": 0},
    {"use_case": "Mid-size hospital efficiency", "best_fit": "${vendor1.company_name} or ${vendor2.company_name}", "sort_order": 1},
    {"use_case": "Academic medical center", "best_fit": "Both", "sort_order": 2}
  ]
}`;

    const finalPrompt = `🚨 FINAL WORD LIMIT ENFORCEMENT 🚨

Key Benefits: STRICTLY 8 WORDS MAX per bullet (Examples: "Reduces denials 46%", "Speeds cash flow")
Unique Strengths: STRICTLY 12 WORDS MAX per bullet (Examples: "Cloud platform with predictive analytics", "Real-time clinical alerts")

Generate a comparison between these two healthcare companies using the provided vendor data:

COMPANY 1: ${vendor1.company_name}
${JSON.stringify(vendor1, null, 2)}

COMPANY 2: ${vendor2.company_name}
${JSON.stringify(vendor2, null, 2)}

🚨 MANDATORY COMPLIANCE:
- NO CITATIONS: Strip ALL [1], (ref), [reference] patterns
- NO VERBOSE TEXT: Only action verbs + concrete benefits
- WORD LIMITS: Count every word - exceed limits = FAILURE
- CHARACTER LIMITS: Key Benefits 50 chars, Unique Strengths 80 chars

VALID EXAMPLES:
Key Benefits: ["Reduces denials 46%", "Speeds revenue cycle", "Automates workflows"]
Unique Strengths: ["Cloud-native RCM platform", "AI predicts claim denials", "Real-time dashboard analytics"]

INVALID EXAMPLES:
❌ "Provides comprehensive revenue cycle management with advanced AI"
❌ "Comprehensive platform offering extensive integration capabilities [1]"

CRITICAL: Return ONLY the structured JSON object for database insertion. No markdown, explanations, or citations.`;

    console.log(`📝 System prompt contains companies:`, {
      promptContains1: systemContent.includes(vendor1.company_name),
      promptContains2: systemContent.includes(vendor2.company_name)
    });

    console.log(`🤖 Sending request to OpenAI...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: finalPrompt }
        ],
        temperature: 0.1,
        max_completion_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`✅ OpenAI Response received:`, {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasMessage: !!data.choices?.[0]?.message,
      usage: data.usage
    });
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error(`❌ Invalid OpenAI response structure:`, data);
      throw new Error('Invalid response from OpenAI API');
    }

    let generatedText = data.choices[0].message.content;
    
    console.log(`📄 Raw AI response (first 500 chars):`, generatedText.substring(0, 500));
    
    // Aggressive post-processing to enforce word limits and remove citations
    generatedText = generatedText
      .replace(/\[\d+\]/g, '') // Remove [1], [2], etc.
      .replace(/\([^)]*\d[^)]*\)/g, '') // Remove (ref), (reference), etc.
      .replace(/\[.*?\]/g, '') // Remove any bracketed content
      .replace(/【.*?】/g, '') // Remove unicode brackets
      .replace(/\*[A-Z0-9-]+/g, '') // Remove citation patterns like *L288-L314
      .trim();

    // Parse and clean up the JSON structure, moving key_benefits and unique_strengths to basic_info
    try {
      const parsedJSON = JSON.parse(generatedText);
      
      // Move key_benefits and unique_strengths from companies to basic_info
      if (parsedJSON.companies && parsedJSON.companies.length >= 2) {
        const company1 = parsedJSON.companies[0];
        const company2 = parsedJSON.companies[1];
        
        if (!parsedJSON.basic_info) parsedJSON.basic_info = [];
        
        // Process key_benefits - find the maximum number between both companies
        const maxBenefits = Math.max(
          (company1.key_benefits || []).length,
          (company2.key_benefits || []).length
        );
        
        for (let i = 0; i < maxBenefits; i++) {
          const benefit1 = company1.key_benefits?.[i];
          const benefit2 = company2.key_benefits?.[i];
          
          let cleaned1 = 'N/A';
          let cleaned2 = 'N/A';
          
          if (benefit1) {
            cleaned1 = benefit1.replace(/\[.*?\]/g, '').replace(/\*[A-Z0-9-]+/g, '').trim();
            const words = cleaned1.split(' ');
            if (words.length > 8) {
              cleaned1 = words.slice(0, 8).join(' ');
            }
          }
          
          if (benefit2) {
            cleaned2 = benefit2.replace(/\[.*?\]/g, '').replace(/\*[A-Z0-9-]+/g, '').trim();
            const words = cleaned2.split(' ');
            if (words.length > 8) {
              cleaned2 = words.slice(0, 8).join(' ');
            }
          }
          
          parsedJSON.basic_info.push({
            category: `Key Benefits ${i + 1}`,
            company1_value: cleaned1,
            company2_value: cleaned2
          });
        }
        
        // Process unique_strengths - find the maximum number between both companies
        const maxStrengths = Math.max(
          (company1.unique_strengths || []).length,
          (company2.unique_strengths || []).length
        );
        
        for (let i = 0; i < maxStrengths; i++) {
          const strength1 = company1.unique_strengths?.[i];
          const strength2 = company2.unique_strengths?.[i];
          
          let cleaned1 = 'N/A';
          let cleaned2 = 'N/A';
          
          if (strength1) {
            cleaned1 = strength1.replace(/\[.*?\]/g, '').replace(/\*[A-Z0-9-]+/g, '').trim();
            const words = cleaned1.split(' ');
            if (words.length > 12) {
              cleaned1 = words.slice(0, 12).join(' ');
            }
          }
          
          if (strength2) {
            cleaned2 = strength2.replace(/\[.*?\]/g, '').replace(/\*[A-Z0-9-]+/g, '').trim();
            const words = cleaned2.split(' ');
            if (words.length > 12) {
              cleaned2 = words.slice(0, 12).join(' ');
            }
          }
          
          parsedJSON.basic_info.push({
            category: `Unique Strengths ${i + 1}`,
            company1_value: cleaned1,
            company2_value: cleaned2
          });
        }
        
        // Remove from company objects
        if (company1.key_benefits) delete company1.key_benefits;
        if (company1.unique_strengths) delete company1.unique_strengths;
        if (company2.key_benefits) delete company2.key_benefits;
        if (company2.unique_strengths) delete company2.unique_strengths;
      }
      
      generatedText = JSON.stringify(parsedJSON);
    } catch (parseError) {
      console.error('JSON parsing failed during cleanup:', parseError);
    }

    console.log(`🧹 Cleaned response (first 500 chars):`, generatedText.substring(0, 500));

    // Try to parse JSON to check structure
    try {
      const parsedJSON = JSON.parse(generatedText);
      console.log(`📋 Parsed JSON structure:`, {
        hasComparison: !!parsedJSON.comparison,
        hasCompanies: !!parsedJSON.companies,
        companiesCount: parsedJSON.companies?.length,
        company1Name: parsedJSON.companies?.[0]?.name,
        company2Name: parsedJSON.companies?.[1]?.name,
        topLevelKeys: Object.keys(parsedJSON)
      });
    } catch (parseError) {
      console.error(`❌ JSON parsing failed:`, parseError);
      console.log(`🔍 Problematic JSON:`, generatedText);
    }

    console.log('✅ Successfully generated comparison content');

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