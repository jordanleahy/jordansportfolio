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
    const { prompt, type = 'general', vendor1, vendor2 } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log(`Generating content for type: ${type}`);

    let systemContent;
    let finalPrompt = prompt;

    if (type === 'comparison') {
      if (!vendor1 || !vendor2) {
        throw new Error('Both vendor1 and vendor2 data are required for comparison generation');
      }

      systemContent = `You are the GenerateComparisonPages AI agent. Your task is to create healthcare company comparisons that match the exact style, tone, and structure of the SmarterDx vs Iodine comparison.

STYLE REQUIREMENTS:
- Text must be simple, punchy, and direct
- Use concise bullet points for benefits and strengths
- Keep descriptions crisp and factual
- Maintain professional healthcare industry tone
- Focus on practical differentiators

STRUCTURE TO FOLLOW:
1. Company Info: Founded, headquarters, funding, employee size, delivery model, target customers, primary solutions, AI core, EHR integration
2. Key Benefits: 3 short, impactful bullet points per company
3. Unique Strengths: 3 distinctive differentiators per company  
4. Feature Comparison: 8 key technical/business features with boolean or short string values
5. Summary Insights: One paragraph per company highlighting their ideal use case and strengths
6. Use Cases: 5 specific scenarios with clear "best fit" designations

OUTPUT FORMAT: Return a valid JSON object with this exact structure:
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

      finalPrompt = `Generate a comparison between these two healthcare companies using the provided vendor data:

COMPANY 1: ${vendor1.company_name}
${JSON.stringify(vendor1, null, 2)}

COMPANY 2: ${vendor2.company_name}
${JSON.stringify(vendor2, null, 2)}

Create a comprehensive comparison following the exact style and structure of the SmarterDx vs Iodine example. Focus on their healthcare solutions, AI capabilities, market positioning, and practical differentiators.`;
    } else if (type === 'image_prompt') {
      systemContent = 'You are an expert at creating detailed, professional image generation prompts for AI image generators. Focus on creating clear, specific prompts that will generate high-quality, professional visuals.';
    } else {
      systemContent = 'You are a helpful assistant that generates high-quality content based on user prompts.';
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: type === 'comparison' ? 'gpt-4o' : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: finalPrompt }
        ],
        temperature: type === 'comparison' ? 0.3 : 0.7,
        max_tokens: type === 'comparison' ? 4000 : 2000,
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

    const generatedText = data.choices[0].message.content;

    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate content. Please check your request and try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});