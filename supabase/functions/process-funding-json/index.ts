
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
    console.log('Processing funding JSON with specialized AI agent...');
    
    // Log the incoming raw data to inspect key_features and key_benefits
    console.log('Raw JSON input (first 1000 chars):', typeof rawJson === 'string' ? rawJson.substring(0, 1000) : JSON.stringify(rawJson).substring(0, 1000));
    
    // Try to parse and check if key_features/key_benefits exist in input
    try {
      const inputData = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
      console.log('🔍 Checking input for key fields:');
      console.log('- key_features exists:', inputData.key_features !== undefined, 'length:', Array.isArray(inputData.key_features) ? inputData.key_features.length : 'not array');
      console.log('- key_benefits exists:', inputData.key_benefits !== undefined, 'length:', Array.isArray(inputData.key_benefits) ? inputData.key_benefits.length : 'not array');
      console.log('- competitive_advantages exists:', inputData.competitive_advantages !== undefined, 'length:', Array.isArray(inputData.competitive_advantages) ? inputData.competitive_advantages.length : 'not array');
    } catch (parseError) {
      console.log('Could not parse input JSON for pre-analysis:', parseError.message);
    }

    const result = await processFundingJsonWithAI(rawJson, startTime);
    success = result.success;

    if (success) {
      await trackAgentUsage(startTime, true);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-funding-json function:', error);
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
      .eq('name', 'Funding JSON Processor')
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

// Specialized AI processing for funding data
async function processFundingJsonWithAI(rawJson: string, startTime: number): Promise<ProcessingResult> {
  const fixes: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    console.log('Using gpt-5-mini for specialized funding data processing...');
    
    const result = await aiProcessFundingData(rawJson);
    
    if (!result.success) {
      throw new Error(result.error || 'AI processing failed');
    }

    // Validate the processed data
    let validatedData;
    if (Array.isArray(result.data)) {
      // Handle array of companies
      validatedData = result.data.map(company => validateFundingFields(company, warnings, errors));
    } else if (typeof result.data === 'object' && result.data !== null) {
      // Check if it's an object with numeric keys (array-like)
      const keys = Object.keys(result.data);
      const isArrayLike = keys.every(key => /^\d+$/.test(key));
      
      if (isArrayLike) {
        // Convert array-like object to array and validate each item
        validatedData = keys.map(key => validateFundingFields(result.data[key], warnings, errors));
      } else {
        // Handle single company object
        validatedData = validateFundingFields(result.data, warnings, errors);
      }
    } else {
      validatedData = validateFundingFields(result.data, warnings, errors);
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`Funding AI processing completed in ${processingTime}ms. Warnings: ${warnings.length}, Errors: ${errors.length}`);

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
    console.error('Error during funding AI processing:', error);
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

// AI processing specialized for funding data
async function aiProcessFundingData(rawJson: string): Promise<{
  success: boolean;
  data?: any;
  fixes?: string[];
  error?: string;
}> {
  const fundingSchema = {
    // Core required fields
    company_name: "string (required)",
    headquarters: "string (required)", 
    company_type: "Private|Public|Non-profit|Government",
    description: "string (required)",
    
    // Funding-specific fields (main focus)
    funding_stage: "string|null - standardized stage: Pre-Seed, Seed, Series A, Series B, Series C, Series D+, IPO, Unknown",
    total_funding: "string|null - formatted amount like $5.2M, $15M, $1.2B",
    key_investors: "string[] - array of investor names",
    founding_year: "number|null - year as integer",
    business_model: "string|null - how company makes money",
    employee_count_range: "string|null - 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+, Unknown",
    
    // Supporting fields
    core_services: "string[]",
    specialties: "string[]", 
    customers: "string[]",
    competitors: "string[]",
    key_features: "string[]",
    key_benefits: "string[]",
    competitive_advantages: "string[]",
    notable_customers: "string[]",
    
    // Contact & web presence
    website_url: "string|null",
    contact_email: "string|null",
    contact_phone: "string|null",
    linkedin_url: "string|null",
    
    // Optional arrays
    tech_stack: "string[]|null",
    certifications: "string[]|null",
    partnerships: "string[]|null",
    
    // Structured data
    performance_metrics: "object|null",
    company_data: "object|null"
  };

  const prompt = `You are a funding data specialist. Extract and structure funding information from this raw JSON and map it to the specified schema.

CRITICAL FUNDING DATA PROCESSING RULES:
1. Fix any JSON syntax errors (escaped characters, malformed quotes, trailing commas)
2. STANDARDIZE funding_stage to exactly one of: Pre-Seed, Seed, Series A, Series B, Series C, Series D+, IPO, Unknown
3. FORMAT total_funding as clean amounts like "$5.2M", "$15M", "$1.2B" (no ranges or extra text)
4. EXTRACT key_investors as clean company/person names (no titles or descriptions)
5. NORMALIZE founding_year to integer year only
6. CATEGORIZE employee_count_range to: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+, Unknown
7. Use null for missing string/number fields, empty arrays [] ONLY for truly missing array fields
8. Generate a slug from company_name (lowercase, hyphens, no special chars)
9. Choose company_type from: Private, Public, Non-profit, Government
10. Return ONLY valid JSON with no additional text

🚨 CRITICAL ARRAY PRESERVATION RULES:
- If key_features exists in input data, PRESERVE ALL entries in the output array
- If key_benefits exists in input data, PRESERVE ALL entries in the output array  
- If competitive_advantages exists in input data, PRESERVE ALL entries in the output array
- Do NOT set these arrays to empty [] unless they are completely missing from input
- Look for variations like "features", "benefits", "advantages" and map them correctly

ARRAY FIELD MAPPING EXAMPLES:
- "key_features" OR "features" → key_features array
- "key_benefits" OR "benefits" → key_benefits array
- "competitive_advantages" OR "advantages" → competitive_advantages array
- "core_services" OR "services" → core_services array

FUNDING STAGE CONVERSION EXAMPLES:
- "Pre-seed" → "Pre-Seed"
- "seed round" → "Seed"
- "series a" → "Series A"
- "series b funding" → "Series B"
- "ipo" → "IPO"
- "public company" → "IPO"
- "unknown" or missing → "Unknown"

TOTAL FUNDING CONVERSION EXAMPLES:
- "$5.2 million" → "$5.2M"
- "$15 million dollars" → "$15M"
- "$1.2 billion" → "$1.2B"
- "15M" → "$15M"
- "1.2B funding" → "$1.2B"
- "unknown" or missing → null

TARGET SCHEMA:
${JSON.stringify(fundingSchema, null, 2)}

REMEMBER: 
- Keep citations in the original text format 【document†line】 - don't remove them
- Focus on accurate funding data extraction and normalization
- Map similar fields intelligently (e.g., "firm_name" → "company_name", "services" → "core_services")
- Be precise with funding stages and amounts
- NEVER ignore existing array data - always preserve it!

RAW FUNDING DATA TO PROCESS:
${rawJson}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a funding data specialist. Extract and normalize funding information according to the schema. Return only valid JSON.' 
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
    console.log('AI processed data:', JSON.stringify(parsedData, null, 2));
    
    // Critical data preservation check
    console.log('🚨 AI OUTPUT CHECK:');
    console.log('- key_features in AI output:', parsedData.key_features !== undefined, 'length:', Array.isArray(parsedData.key_features) ? parsedData.key_features.length : 'not array');
    console.log('- key_benefits in AI output:', parsedData.key_benefits !== undefined, 'length:', Array.isArray(parsedData.key_benefits) ? parsedData.key_benefits.length : 'not array');
    console.log('- competitive_advantages in AI output:', parsedData.competitive_advantages !== undefined, 'length:', Array.isArray(parsedData.competitive_advantages) ? parsedData.competitive_advantages.length : 'not array');
    
    // Add slug generation
    if (parsedData.company_name) {
      parsedData.slug = generateSlug(parsedData.company_name);
    } else {
      console.log('WARNING: No company_name found in AI processed data');
    }
    
    return {
      success: true,
      data: parsedData,
      fixes: ['Specialized funding data processing completed', 'Generated slug from company name']
    };
    
  } catch (error) {
    console.error('Funding AI processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function validateFundingFields(data: any, warnings: string[], errors: string[]): any {
  const validated: any = { ...data };
  
  console.log('Validating funding fields for data:', JSON.stringify(validated, null, 2));
  
  // For funding data, only require fields that are typically available
  const requiredFields = ['company_name'];
  for (const field of requiredFields) {
    console.log(`Checking required field: ${field}, value:`, validated[field], 'type:', typeof validated[field]);
    if (!validated[field] || (typeof validated[field] === 'string' && validated[field].trim() === '')) {
      console.log(`VALIDATION ERROR: Missing required field: ${field}`);
      errors.push(`Missing required field: ${field}`);
    } else {
      console.log(`VALIDATION SUCCESS: Field ${field} is valid`);
    }
  }
  
  // Set defaults for commonly missing fields in funding data
  if (!validated.company_type) {
    validated.company_type = 'Private';
  }
  if (!validated.headquarters) {
    validated.headquarters = 'Not specified';
  }
  if (!validated.description) {
    validated.description = 'Investment firm or venture capital fund.';
  }
  
  // Validate company_type
  const allowedCompanyTypes = ['Private', 'Public', 'Non-profit', 'Government'];
  if (validated.company_type && !allowedCompanyTypes.includes(validated.company_type)) {
    warnings.push(`Invalid company_type: ${validated.company_type}, using 'Private' as default`);
    validated.company_type = 'Private';
  }
  
  // Validate funding_stage
  const allowedFundingStages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'IPO', 'Unknown'];
  if (validated.funding_stage && !allowedFundingStages.includes(validated.funding_stage)) {
    warnings.push(`Invalid funding_stage: ${validated.funding_stage}, using 'Unknown' as default`);
    validated.funding_stage = 'Unknown';
  }
  
  // Validate employee_count_range
  const allowedEmployeeRanges = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'Unknown'];
  if (validated.employee_count_range && !allowedEmployeeRanges.includes(validated.employee_count_range)) {
    warnings.push(`Invalid employee_count_range: ${validated.employee_count_range}, using 'Unknown' as default`);
    validated.employee_count_range = 'Unknown';
  }
  
  // Validate founding_year
  if (validated.founding_year !== null && validated.founding_year !== undefined) {
    const year = Number(validated.founding_year);
    if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 5) {
      warnings.push(`Invalid founding_year: ${validated.founding_year}, setting to null`);
      validated.founding_year = null;
    } else {
      validated.founding_year = year;
    }
  }
  
  // Validate total_funding format
  if (validated.total_funding && typeof validated.total_funding === 'string') {
    const fundingRegex = /^\$\d+(\.\d+)?[MBK]?$/;
    if (!fundingRegex.test(validated.total_funding)) {
      warnings.push(`Invalid total_funding format: ${validated.total_funding}, should be like $5.2M`);
    }
  }
  
  // Ensure array fields are arrays (preserve existing valid arrays)
  const arrayFields = [
    'core_services', 'specialties', 'customers', 'competitors', 'key_features', 
    'key_benefits', 'competitive_advantages', 'key_investors', 'notable_customers'
  ];
  
  for (const field of arrayFields) {
    console.log(`Validating array field: ${field}, current value:`, validated[field]);
    
    if (validated[field] === undefined || validated[field] === null) {
      // Field is missing, set to empty array
      validated[field] = [];
      console.log(`Set missing field ${field} to empty array`);
    } else if (!Array.isArray(validated[field])) {
      // Field exists but is not an array, reset to empty array
      console.log(`WARNING: Field ${field} is not an array, resetting. Value was:`, validated[field]);
      validated[field] = [];
      warnings.push(`Reset invalid ${field} (was not an array) to empty array`);
    } else if (validated[field].length > 0) {
      // Field exists and is a valid array with content, preserve it
      console.log(`Preserving existing ${field} array with ${validated[field].length} items`);
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
