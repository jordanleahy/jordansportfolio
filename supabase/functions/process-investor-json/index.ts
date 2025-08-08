import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { trackOpenAIUsage, generateCorrelationId, makeOpenAIRequest, enhanceOpenAIRequestBody, extractUsageFromOpenAIResponse } from '../_shared/openai-attribution.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Initialize Supabase client for metrics tracking
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProcessingResult {
  success: boolean;
  cleanedData?: any;
  originalData?: any;
  fixes?: string[];
  errors?: string[];  
  warnings?: string[];
  modelUsed?: string;
  processingTimeMs?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  const correlationId = generateCorrelationId();
  let success = false;
  let estimatedCost = 0;
  let tokensUsed = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let errorMessage: string | undefined;
  let requestMetadata: any = {};
  let openAIRequestId: string | undefined;

  try {
    const { rawJson } = await req.json();
    requestMetadata = { correlationId, dataType: typeof rawJson };
    console.log('Processing raw investor JSON...', { correlationId });

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const result = await processInvestorJsonWithAI(rawJson, startTime, userId, correlationId, requestMetadata);
    success = result.success;

    if (success) {
      await trackAgentUsage(startTime, true);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-investor-json function:', error);
    await trackAgentUsage(startTime, false);
    
      return new Response(JSON.stringify({ 
      success: false,
      errors: [error.message],
      modelUsed: 'gpt-5-mini',
      processingTimeMs: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function trackAgentUsage(startTime: number, success: boolean) {
  try {
    const processingTime = Date.now() - startTime;
    
    const { data: agent } = await supabase
      .from('openai_agents')
      .select('*')
      .eq('name', 'Investor JSON Processor')
      .single();

    if (agent) {
      await supabase
        .from('openai_agents')
        .update({ 
          last_run: new Date().toISOString(),
          metrics: {
            latencyMs: processingTime,
            errorRate: success ? 0 : 1,
            modelUsed: 'gpt-5-mini'
          }
        })
        .eq('id', agent.id);
    }
  } catch (error) {
    console.error('Error tracking agent usage:', error);
  }
}

async function processInvestorJsonWithAI(rawJson: string, startTime: number, userId?: string, correlationId?: string, requestMetadata?: any): Promise<ProcessingResult> {
  const fixes: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    console.log('Using AI for intelligent investor JSON processing...');
    
    const result = await aiProcessInvestorData(rawJson, userId, correlationId, requestMetadata);
    
    if (!result.success) {
      throw new Error(result.error || 'AI processing failed');
    }

    // Validate the processed data
    const validatedData = validateCoreFields(result.data, warnings, errors);
    
    const processingTime = Date.now() - startTime;
    console.log(`AI investor processing completed in ${processingTime}ms. Warnings: ${warnings.length}, Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      cleanedData: validatedData,
      originalData: rawJson,
      fixes: result.fixes || [],
      warnings,
      errors,
       modelUsed: 'gpt-5-mini',
      processingTimeMs: processingTime
    };

  } catch (error) {
    console.error('Error during AI investor processing:', error);
    errors.push(error.message);
    
    return {
      success: false,
      originalData: rawJson,
      fixes,
      warnings,
      errors,
       modelUsed: 'gpt-5-mini',
      processingTimeMs: Date.now() - startTime
    };
  }
}

// AI intelligent processing for investor data
async function aiProcessInvestorData(rawJson: string, userId?: string, correlationId?: string, requestMetadata?: any): Promise<{
  success: boolean;
  data?: any;
  fixes?: string[];
  error?: string;
}> {
  const investorSchema = {
    // Core required fields
    firm_name: "string (required)",
    address: "string|null",
    city: "string|null", 
    state: "string|null",
    zip: "string|null",
    website: "string|null",
    sector_focus: "string[] (required, can be empty array)",
    
    // Investment details
    stage: "string|null - investment stage like 'Series A', 'Growth Equity', 'Seed'",
    check_size_min: "number|null - minimum check size in millions (numeric value only)",
    check_size_max: "number|null - maximum check size in millions (numeric value only)",
    
    // Fund information
    latest_fund_name: "string|null",
    latest_fund_year: "number|null - year as integer",
    latest_fund_size: "number|null - fund size in millions (numeric value only)",
    total_aum: "number|null - total assets under management in millions (numeric value only)",
    
    // Contact details
    lead_partner: "string|null",
    contact_email: "string|null"
  };

  const prompt = `You are an expert at extracting and structuring investor/VC firm data. Clean this raw JSON and map it to the specified schema.

CRITICAL RULES:
1. Fix any JSON syntax errors (escaped characters, malformed quotes, trailing commas)
2. Use your reasoning to map fields intelligently - the input may have different field names
3. For numeric fields (check_size_min/max, fund_size, total_aum): extract ONLY the numeric value in millions
   - "$50M" becomes 50
   - "$2.5B" becomes 2500
   - "$100 million" becomes 100
4. Use null for missing string/number fields, empty arrays [] for missing array fields
5. Extract meaningful data even if field names don't match exactly
6. Generate a slug from firm_name (lowercase, hyphens, no special chars)
7. Return ONLY valid JSON with no additional text

INPUT SCHEMA TARGET:
${JSON.stringify(investorSchema, null, 2)}

FIELD MAPPING EXAMPLES:
- "firm_name" could be: company_name, fund_name, organization_name, name
- "sector_focus" could be: sectors, focus_areas, investment_sectors, verticals
- "stage" could be: investment_stage, focus_stage, preferred_stage
- "check_size" could be: investment_range, ticket_size, check_range
- "total_aum" could be: aum, assets_under_management, total_assets

RAW DATA TO PROCESS:
${rawJson}`;

  try {
    // Enhanced OpenAI request with correlation tracking
    const requestBody = enhanceOpenAIRequestBody({
      model: 'gpt-5-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert data processor specializing in investment firm data. Extract and clean investor data according to the schema. Return only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 1,
      max_tokens: 4000
    }, correlationId);

    const { response, openAIRequestId: responseOpenAIRequestId, responseTime } = await makeOpenAIRequest({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      correlationId,
    });

    const openAIRequestId = responseOpenAIRequestId;

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const processedJson = data.choices[0].message.content.trim();
    
    // Validate the returned JSON
    const parsedData = JSON.parse(processedJson);
    
    // Add slug generation
    if (parsedData.firm_name) {
      parsedData.slug = generateSlug(parsedData.firm_name);
    }
    
    // Track API usage with enhanced attribution if we have userId
    if (userId) {
      const usageData = extractUsageFromOpenAIResponse(data);
      await trackOpenAIUsage({
        userId,
        functionName: 'process-investor-json',
        model: 'gpt-5-mini',
        requestType: 'text_generation',
        success: true,
        estimatedCost: usageData.estimatedCost,
        tokensUsed: usageData.totalTokens || 0,
        promptTokens: usageData.promptTokens || 0,
        completionTokens: usageData.completionTokens || 0,
        responseTimeMs: responseTime,
        metadata: requestMetadata,
        correlationId,
        openAIRequestId,
      });
    }
    
    return {
      success: true,
      data: parsedData,
      fixes: ['AI intelligent investor processing completed', 'Generated slug from firm name']
    };
    
  } catch (error) {
    console.error('AI investor processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function validateCoreFields(data: any, warnings: string[], errors: string[]): any {
  const validated: any = { ...data };
  
  // Required fields validation
  const requiredFields = ['firm_name'];
  for (const field of requiredFields) {
    if (!validated[field] || (typeof validated[field] === 'string' && validated[field].trim() === '')) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Ensure sector_focus is an array
  if (!validated.sector_focus || !Array.isArray(validated.sector_focus)) {
    validated.sector_focus = [];
    warnings.push('Set empty array for sector_focus field');
  }
  
  // Validate numeric fields
  const numericFields = ['check_size_min', 'check_size_max', 'latest_fund_year', 'latest_fund_size', 'total_aum'];
  for (const field of numericFields) {
    if (validated[field] !== null && validated[field] !== undefined) {
      const num = Number(validated[field]);
      if (isNaN(num)) {
        warnings.push(`Invalid numeric value for ${field}, setting to null`);
        validated[field] = null;
      } else {
        validated[field] = num;
      }
    }
  }
  
  // Validate year range
  if (validated.latest_fund_year !== null && validated.latest_fund_year !== undefined) {
    const year = Number(validated.latest_fund_year);
    if (year < 1900 || year > new Date().getFullYear() + 5) {
      warnings.push(`Invalid year ${year}, setting to null`);
      validated.latest_fund_year = null;
    }
  }
  
  // Set user_id and status for database compatibility
  validated.user_id = null; // Will be set by calling code
  validated.status = 'draft';
  
  return validated;
}

function generateSlug(firmName: string): string {
  return firmName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}