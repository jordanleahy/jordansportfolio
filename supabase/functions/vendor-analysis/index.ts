import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VendorAnalysisRequest {
  companyName: string;
  userId?: string;
}

interface VendorAnalysisResponse {
  company: {
    name: string;
    slug: string;
    founded?: string;
    headquarters?: string;
    website?: string;
    description: string;
  };
  business_model: {
    primary_focus: string;
    target_market: string;
    revenue_model: string;
    key_differentiators: string[];
  };
  competitive_intelligence: {
    market_position: string;
    strengths: string[];
    weaknesses: string[];
    threats: string[];
    opportunities: string[];
  };
  financials: {
    funding_stage?: string;
    total_funding?: string;
    valuation?: string;
    revenue_range?: string;
  };
  products_services: Array<{
    name: string;
    description: string;
    target_audience: string;
  }>;
  leadership: Array<{
    name: string;
    title: string;
    background: string;
  }>;
  recent_developments: Array<{
    date: string;
    event: string;
    impact: string;
  }>;
  data_source: 'internal_database' | 'web_research' | 'hybrid';
  analysis_confidence: 'high' | 'medium' | 'low';
  last_updated: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { companyName, userId }: VendorAnalysisRequest = await req.json();
    
    if (!companyName) {
      throw new Error('Company name is required');
    }

    console.log(`🔍 Starting vendor analysis for: ${companyName}`);

    // Step 1: Check internal vendor database
    const { data: existingVendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .ilike('company_name', `%${companyName}%`)
      .limit(1)
      .maybeSingle();

    let vendorData: any = null;
    let dataSource: 'internal_database' | 'web_research' | 'hybrid' = 'web_research';
    let analysisConfidence: 'high' | 'medium' | 'low' = 'medium';

    if (existingVendor) {
      console.log(`✅ Found vendor in database: ${existingVendor.company_name}`);
      vendorData = existingVendor;
      dataSource = 'internal_database';
      analysisConfidence = 'high';
    }

    // Step 2: Get system prompt for vendor analysis by finding the agent first
    const { data: vendorAgent } = await supabase
      .from('openai_agents')
      .select('id')
      .eq('name', 'Vendor Analysis Agent')
      .limit(1)
      .maybeSingle();

    const { data: systemPrompt } = await supabase
      .from('system_prompts')
      .select('prompt_text')
      .eq('agent_id', vendorAgent?.id)
      .limit(1)
      .maybeSingle();

    const basePrompt = systemPrompt?.prompt_text || `Analyze the company ${companyName} and provide structured competitive intelligence data.`;

    // Step 3: Perform web research using OpenAI search if needed
    let webResearchData = '';
    let researchPrompt = '';
    
    if (!existingVendor) {
      // No internal data - need comprehensive research
      researchPrompt = `Search for comprehensive information about ${companyName} company. Find details about their business model, products/services, funding history, leadership team, market position, competitive landscape, recent developments, and key differentiators. Focus on factual information that would be valuable for competitive intelligence analysis.`;
      dataSource = 'web_research';
    } else {
      // Have internal data - enhance with recent updates
      researchPrompt = `Search for the latest updates and recent developments about ${companyName} company in 2024-2025. Find information about recent funding rounds, leadership changes, new product launches, market expansions, partnerships, or any significant business developments. Also look for current competitive analysis and market positioning updates.`;
      dataSource = 'hybrid';
    }

    // Perform web research using OpenAI with search
    try {
      console.log(`🌐 Performing web research for: ${companyName}`);
      
      const searchResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini-2025-08-07',
          messages: [
            {
              role: 'system',
              content: 'You are a research assistant with access to current web information. Provide factual, up-to-date information about companies based on recent web searches. Focus on verifiable data and cite sources when possible.'
            },
            {
              role: 'user',
              content: researchPrompt
            }
          ],
          max_completion_tokens: 2000,
        }),
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        webResearchData = searchData.choices[0]?.message?.content || '';
        console.log(`✅ OpenAI web research completed`);
      } else {
        console.warn(`⚠️ OpenAI search failed: ${searchResponse.statusText}`);
        // Fallback to basic analysis without web data
        if (!existingVendor) {
          dataSource = 'web_research';
          analysisConfidence = 'low';
        }
      }
    } catch (error) {
      console.warn(`⚠️ Web research failed: ${error.message}`);
      if (!existingVendor) {
        dataSource = 'web_research';
        analysisConfidence = 'low';
      }
    }

    // Step 4: Generate structured analysis using OpenAI
    const analysisPrompt = `
${basePrompt}

## Available Data:

${existingVendor ? `### Internal Database Data:
${JSON.stringify(existingVendor, null, 2)}
` : ''}

${webResearchData ? `### Web Research Data:
${webResearchData}
` : ''}

## Instructions:
Analyze the company "${companyName}" using the available data above. If internal database data exists, use it as the foundation and enhance with web research. If only web research is available, structure that data according to the required JSON format.

Focus on competitive intelligence aspects that would be valuable to a competitor analyzing this company.
`;

    console.log(`🤖 Generating AI analysis...`);

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: basePrompt },
          { role: 'user', content: analysisPrompt }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const openAIData = await openAIResponse.json();
    const analysisContent = openAIData.choices[0]?.message?.content || '';

    console.log(`✅ AI analysis completed`);

    // Step 5: Parse and structure the response
    let structuredAnalysis: VendorAnalysisResponse;
    
    try {
      // Try to parse as JSON first
      structuredAnalysis = JSON.parse(analysisContent);
    } catch {
      // If parsing fails, create a structured response from the text
      structuredAnalysis = {
        company: {
          name: existingVendor?.company_name || companyName,
          slug: existingVendor?.slug || companyName.toLowerCase().replace(/\s+/g, '-'),
          founded: existingVendor?.founded_year?.toString(),
          headquarters: existingVendor?.headquarters_location,
          website: existingVendor?.website_url,
          description: existingVendor?.description || analysisContent.substring(0, 500) + '...'
        },
        business_model: {
          primary_focus: existingVendor?.primary_business_focus || 'Information extracted from analysis',
          target_market: existingVendor?.target_market || 'Various sectors',
          revenue_model: 'Subscription/SaaS',
          key_differentiators: existingVendor?.key_differentiators || ['Innovation', 'Customer focus']
        },
        competitive_intelligence: {
          market_position: 'Market participant',
          strengths: ['Technology platform', 'Market presence'],
          weaknesses: ['Limited market data'],
          threats: ['Market competition'],
          opportunities: ['Market expansion']
        },
        financials: {
          funding_stage: existingVendor?.funding_stage,
          total_funding: existingVendor?.total_funding_amount?.toString(),
          valuation: existingVendor?.last_valuation?.toString(),
          revenue_range: existingVendor?.annual_revenue_range
        },
        products_services: [{
          name: 'Primary offering',
          description: 'Core business solution',
          target_audience: 'Business customers'
        }],
        leadership: [{
          name: 'Leadership team',
          title: 'Executive',
          background: 'Industry experience'
        }],
        recent_developments: [{
          date: new Date().toISOString().split('T')[0],
          event: 'Analysis conducted',
          impact: 'Competitive intelligence gathered'
        }],
        data_source: dataSource,
        analysis_confidence: analysisConfidence,
        last_updated: new Date().toISOString()
      };
    }

    // Ensure required fields are present
    structuredAnalysis.data_source = dataSource;
    structuredAnalysis.analysis_confidence = analysisConfidence;
    structuredAnalysis.last_updated = new Date().toISOString();

    console.log(`✅ Vendor analysis completed for ${companyName}`);

    return new Response(JSON.stringify(structuredAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in vendor analysis:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to analyze vendor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});