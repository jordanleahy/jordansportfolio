import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

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
  let success = false;

  try {
    const { rawJson } = await req.json();
    console.log('Processing raw JSON with o3 Pro optimization...');

    const result = await processVendorJsonWithO3Pro(rawJson, startTime);
    success = result.success;

    if (success) {
      await trackAgentUsage(startTime, true);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-vendor-json function:', error);
    await trackAgentUsage(startTime, false);
    
    return new Response(JSON.stringify({ 
      success: false,
      errors: [error.message],
      modelUsed: 'o3-pro',
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
      .eq('name', 'Vendor JSON Processor')
      .single();

    if (agent) {
      await supabase
        .from('openai_agents')
        .update({ 
          last_run: new Date().toISOString(),
          metrics: {
            latencyMs: processingTime,
            errorRate: success ? 0 : 1,
            modelUsed: 'o3-pro'
          }
        })
        .eq('id', agent.id);
    }
  } catch (error) {
    console.error('Error tracking agent usage:', error);
  }
}

// Optimized for o3 Pro single-pass processing
async function processVendorJsonWithO3Pro(rawJson: string, startTime: number): Promise<ProcessingResult> {
  const fixes: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    console.log('Using o3 Pro for intelligent JSON processing...');
    
    // Single intelligent processing step with o3 Pro
    const result = await o3ProProcessVendorData(rawJson);
    
    if (!result.success) {
      throw new Error(result.error || 'o3 Pro processing failed');
    }

    // Validate the processed data
    const validatedData = validateCoreFields(result.data, warnings, errors);
    
    const processingTime = Date.now() - startTime;
    console.log(`o3 Pro processing completed in ${processingTime}ms. Warnings: ${warnings.length}, Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      cleanedData: validatedData,
      originalData: rawJson,
      fixes: result.fixes || [],
      warnings,
      errors,
      modelUsed: 'o3-pro',
      processingTimeMs: processingTime
    };

  } catch (error) {
    console.error('Error during o3 Pro processing:', error);
    errors.push(error.message);
    
    return {
      success: false,
      originalData: rawJson,
      fixes,
      warnings,
      errors,
      modelUsed: 'o3-pro',
      processingTimeMs: Date.now() - startTime
    };
  }
}

// o3 Pro intelligent processing with simplified schema
async function o3ProProcessVendorData(rawJson: string): Promise<{
  success: boolean;
  data?: any;
  fixes?: string[];
  error?: string;
}> {
  const simplifiedSchema = {
    // Core required fields
    company_name: "string (required)",
    headquarters: "string (required)", 
    company_type: "Private|Public|Non-profit|Government",
    description: "string (required)",
    
    // Contact & web presence
    website_url: "string|null",
    contact_email: "string|null",
    contact_phone: "string|null",
    linkedin_url: "string|null",
    
    // Business details
    founding_year: "number|null",
    funding_stage: "string|null", 
    total_funding: "string|null",
    employee_count_range: "string|null",
    business_model: "string|null",
    
    // Array fields (use empty array [] if not available)
    core_services: "string[]",
    specialties: "string[]", 
    customers: "string[]",
    competitors: "string[]",
    key_features: "string[]",
    key_benefits: "string[]",
    competitive_advantages: "string[]",
    key_investors: "string[]",
    notable_customers: "string[]",
    
    // Optional arrays
    tech_stack: "string[]|null",
    certifications: "string[]|null",
    partnerships: "string[]|null",
    
    // Structured data
    performance_metrics: "object|null",
    company_data: "object|null"
  };

  const prompt = `You are an expert at extracting and structuring company data. Clean this raw JSON and map it to the specified schema.

CRITICAL RULES:
1. Fix any JSON syntax errors (escaped characters, malformed quotes, trailing commas)
2. Use your reasoning to map fields intelligently - the input may have different field names
3. For company_type: choose exactly one of: Private, Public, Non-profit, Government
4. Use null for missing string/number fields, empty arrays [] for missing array fields
5. Extract meaningful data even if field names don't match exactly
6. Generate a slug from company_name (lowercase, hyphens, no special chars)
7. Return ONLY valid JSON with no additional text

INPUT SCHEMA TARGET:
${JSON.stringify(simplifiedSchema, null, 2)}

REMEMBER: 
- Keep citations in the original text format 【document†line】 - don't remove them
- Use your intelligence to infer appropriate company_type from context
- Map similar fields (e.g., "services" → "core_services", "founded" → "founding_year")

RAW DATA TO PROCESS:
${rawJson}`;

  try {
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
            content: 'You are an expert data processor. Extract and clean company data according to the schema. Return only valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let processedJson = data.choices[0].message.content.trim();
    
    // Clean the completion response to handle markdown wrapping
    if (processedJson.startsWith('```json')) {
      processedJson = processedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (processedJson.startsWith('```')) {
      processedJson = processedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Validate the returned JSON
    const parsedData = JSON.parse(processedJson);
    
    // Add slug generation
    if (parsedData.company_name) {
      parsedData.slug = generateSlug(parsedData.company_name);
    }
    
    return {
      success: true,
      data: parsedData,
      fixes: ['o3 Pro intelligent processing completed', 'Generated slug from company name']
    };
    
  } catch (error) {
    console.error('o3 Pro processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function validateCoreFields(data: any, warnings: string[], errors: string[]): any {
  const validated: any = { ...data };
  
  // Required fields validation
  const requiredFields = ['company_name', 'headquarters', 'company_type', 'description'];
  for (const field of requiredFields) {
    if (!validated[field] || (typeof validated[field] === 'string' && validated[field].trim() === '')) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate company_type is one of allowed values
  const allowedCompanyTypes = ['Private', 'Public', 'Non-profit', 'Government'];
  if (validated.company_type && !allowedCompanyTypes.includes(validated.company_type)) {
    warnings.push(`Invalid company_type: ${validated.company_type}, using 'Private' as default`);
    validated.company_type = 'Private';
  }
  
  // Ensure array fields are arrays and have sensible defaults
  const coreArrayFields = [
    'core_services', 'specialties', 'customers', 'competitors', 'key_features', 
    'key_benefits', 'competitive_advantages', 'key_investors', 'notable_customers'
  ];
  
  for (const field of coreArrayFields) {
    if (!validated[field] || !Array.isArray(validated[field])) {
      validated[field] = [];
      warnings.push(`Set empty array for required field: ${field}`);
    }
  }
  
  // Optional array fields - can be null
  const optionalArrayFields = ['tech_stack', 'certifications', 'partnerships'];
  for (const field of optionalArrayFields) {
    if (validated[field] && !Array.isArray(validated[field])) {
      validated[field] = null;
      warnings.push(`Reset invalid ${field} to null`);
    }
  }
  
  // Ensure object fields exist
  if (!validated.company_data || typeof validated.company_data !== 'object') {
    validated.company_data = {};
  }
  
  if (!validated.performance_metrics || typeof validated.performance_metrics !== 'object') {
    validated.performance_metrics = null;
  }
  
  // Set user_id and status for database compatibility
  validated.user_id = null; // Will be set by calling code
  validated.status = 'draft';
  
  return validated;
}

function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
