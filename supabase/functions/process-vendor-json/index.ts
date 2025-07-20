
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
  aiCleaningUsed?: boolean;
  aiReasoning?: string;
}

// Field mapping dictionary to handle common variations
const FIELD_MAPPINGS = {
  // Core company info mappings
  'industry': 'company_type',
  'services': 'core_services',
  'target_market': 'customers',
  'company_size': null, // Store in company_data
  'key_technologies': 'key_features',
  'pricing_model': null, // Store in company_data
  'contact_info': null, // Store in company_data
  'social_media': null, // Store in company_data
  'competitors': null, // Store in research_data
  'unique_value_proposition': 'competitive_advantages',
  'recent_news': null, // Store in research_data
  'founded_year': 'founding_year',
  
  // Handle variations
  'founded': 'founding_year',
  'established': 'founding_year',
  'year_founded': 'founding_year',
  'location': 'headquarters',
  'hq': 'headquarters',
  'main_office': 'headquarters'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let success = false;

  try {
    const { rawJson } = await req.json();
    console.log('Processing raw JSON input...');

    const result = await processVendorJson(rawJson);
    success = result.success;

    // Track agent metrics if processing was successful
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
      errors: [error.message] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function trackAgentUsage(startTime: number, success: boolean) {
  try {
    const processingTime = Date.now() - startTime;
    
    // Find the vendor JSON processor agent
    const { data: agent } = await supabase
      .from('openai_agents')
      .select('*')
      .eq('name', 'Vendor JSON Processor')
      .single();

    if (agent) {
      // Update last_run timestamp
      await supabase
        .from('openai_agents')
        .update({ 
          last_run: new Date().toISOString(),
          metrics: {
            latencyMs: processingTime,
            errorRate: success ? 0 : 1
          }
        })
        .eq('id', agent.id);
    }
  } catch (error) {
    console.error('Error tracking agent usage:', error);
    // Don't fail the main request if metrics tracking fails
  }
}

async function processVendorJson(rawJson: string): Promise<ProcessingResult> {
  const fixes: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  let aiCleaningUsed = false;
  let aiReasoning = '';

  try {
    console.log('Starting JSON processing...');
    
    // Step 1: Try basic cleaning first
    let cleanedJson = await basicJsonCleaning(rawJson, fixes);
    
    // Step 2: Try to parse
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedJson);
      console.log('Basic cleaning successful');
    } catch (parseError) {
      console.log('Basic cleaning failed, trying AI-powered cleaning...');
      
      // Step 3: Use AI to clean the JSON
      if (openAIApiKey) {
        try {
          const aiResult = await aiJsonCleaning(rawJson);
          if (aiResult.success) {
            cleanedJson = aiResult.cleanedJson;
            parsedData = JSON.parse(cleanedJson);
            aiCleaningUsed = true;
            aiReasoning = aiResult.reasoning;
            fixes.push(...aiResult.fixes);
            console.log('AI cleaning successful');
          } else {
            throw new Error(`AI cleaning failed: ${aiResult.error}`);
          }
        } catch (aiError) {
          console.error('AI cleaning failed:', aiError);
          // Fallback to enhanced rule-based cleaning
          cleanedJson = await enhancedJsonCleaning(rawJson, fixes);
          parsedData = JSON.parse(cleanedJson);
        }
      } else {
        // No OpenAI key, use enhanced rule-based cleaning
        cleanedJson = await enhancedJsonCleaning(rawJson, fixes);
        parsedData = JSON.parse(cleanedJson);
      }
    }
    
    console.log('JSON parsed successfully, applying field mapping...');
    
    // Step 4: Apply intelligent field mapping
    const mappedData = await applyFieldMapping(parsedData, fixes, warnings);
    
    // Step 5: Validate and transform the mapped data
    const validatedData = validateAndTransformVendorData(mappedData, warnings, errors);
    
    // Step 6: Check for required fields
    const requiredFields = ['company_name', 'headquarters', 'company_type', 'description'];
    for (const field of requiredFields) {
      if (!validatedData[field] || validatedData[field].trim() === '') {
        errors.push(`Missing required field: ${field}`);
      }
    }

    console.log(`Processing completed. AI used: ${aiCleaningUsed}, Fixes: ${fixes.length}, Warnings: ${warnings.length}, Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      cleanedData: validatedData,
      originalData: rawJson,
      fixes,
      warnings,
      errors,
      aiCleaningUsed,
      aiReasoning
    };

  } catch (error) {
    console.error('Error during JSON processing:', error);
    errors.push(error.message);
    
    return {
      success: false,
      originalData: rawJson,
      fixes,
      warnings,
      errors,
      aiCleaningUsed,
      aiReasoning
    };
  }
}

async function applyFieldMapping(data: any, fixes: string[], warnings: string[]): Promise<any> {
  const mappedData: any = {};
  const companyData: any = {};
  const researchData: any = {};
  
  // Process each field in the input data
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    
    const mappedField = FIELD_MAPPINGS[key];
    
    if (mappedField) {
      // Direct field mapping
      mappedData[mappedField] = value;
      fixes.push(`Mapped '${key}' to '${mappedField}'`);
    } else if (mappedField === null) {
      // Store in appropriate JSON field
      if (['company_size', 'pricing_model', 'contact_info', 'social_media'].includes(key)) {
        companyData[key] = value;
        fixes.push(`Stored '${key}' in company_data`);
      } else if (['competitors', 'recent_news'].includes(key)) {
        researchData[key] = value;
        fixes.push(`Stored '${key}' in research_data`);
      }
    } else {
      // Check if it's a standard database field
      const standardFields = [
        'company_name', 'headquarters', 'founding_year', 'company_type', 'description',
        'core_services', 'specialties', 'customers', 'key_features', 'key_benefits',
        'website_url', 'source_url', 'funding_stage', 'total_funding', 'key_investors',
        'competitive_advantages', 'notable_customers', 'status'
      ];
      
      if (standardFields.includes(key)) {
        mappedData[key] = value;
      } else {
        // Store unknown fields in company_data
        companyData[key] = value;
        warnings.push(`Unknown field '${key}' stored in company_data`);
      }
    }
  }
  
  // Clean and process specific fields
  if (mappedData.founding_year) {
    mappedData.founding_year = extractYearFromText(mappedData.founding_year);
  }
  
  // Clean arrays by removing citations
  const arrayFields = ['core_services', 'specialties', 'customers', 'key_features', 'key_benefits', 'key_investors', 'competitive_advantages', 'notable_customers'];
  for (const field of arrayFields) {
    if (mappedData[field] && Array.isArray(mappedData[field])) {
      mappedData[field] = cleanArrayValues(mappedData[field]);
    }
  }
  
  // Generate slug from company name
  if (mappedData.company_name) {
    mappedData.slug = generateSlug(mappedData.company_name);
  }
  
  // Set defaults for required fields
  if (!mappedData.company_type && companyData.industry) {
    mappedData.company_type = cleanCitationText(companyData.industry);
    fixes.push('Used industry as company_type');
  }
  
  if (!mappedData.headquarters && companyData.location) {
    mappedData.headquarters = cleanCitationText(companyData.location);
    fixes.push('Used location as headquarters');
  }
  
  // Store JSON data
  if (Object.keys(companyData).length > 0) {
    mappedData.company_data = companyData;
  }
  
  if (Object.keys(researchData).length > 0) {
    mappedData.research_data = researchData;
  }
  
  return mappedData;
}

function cleanCitationText(text: string): string {
  if (typeof text !== 'string') return text;
  // Remove citation patterns like [oai_citation:0‡domain.com]
  return text.replace(/\s*\[oai_citation:[^\]]+\]/g, '').trim();
}

function cleanArrayValues(array: any[]): string[] {
  return array
    .filter(item => typeof item === 'string' && item.trim() !== '')
    .map(item => cleanCitationText(item))
    .filter(item => item.length > 0);
}

function extractYearFromText(text: any): number | null {
  if (typeof text === 'number') return text;
  if (typeof text !== 'string') return null;
  
  // Extract 4-digit year from text
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    const currentYear = new Date().getFullYear();
    if (year >= 1800 && year <= currentYear + 5) {
      return year;
    }
  }
  return null;
}

function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function aiJsonCleaning(rawJson: string): Promise<{
  success: boolean;
  cleanedJson?: string;
  reasoning?: string;
  fixes?: string[];
  error?: string;
}> {
  const prompt = `You are a JSON cleaning specialist. Your task is to fix malformed JSON data that comes from ChatGPT responses for vendor information.

IMPORTANT RULES:
1. Return ONLY valid JSON - no explanation text, no markdown formatting, no code blocks
2. Preserve ALL original data content - don't remove or change actual information
3. Fix structural issues like escaped characters, malformed URLs, broken strings
4. Common issues to fix:
   - Escaped characters that break parsing (\\_,  \\:, \\", \\\\)
   - Malformed URLs concatenated with other text
   - Broken string boundaries
   - Missing quotes around keys
   - Trailing commas
   - Invalid null values

INPUT JSON TO CLEAN:
${rawJson}

Return the cleaned JSON followed by a line starting with "REASONING:" explaining what you fixed.`;

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
            content: 'You are a precise JSON cleaning tool. Return only valid JSON followed by reasoning.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Split response into JSON and reasoning
    const lines = aiResponse.split('\n');
    let jsonEndIndex = -1;
    let reasoning = '';
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('REASONING:')) {
        jsonEndIndex = i;
        reasoning = lines.slice(i + 1).join('\n').trim();
        break;
      }
    }
    
    const cleanedJson = jsonEndIndex > -1 
      ? lines.slice(0, jsonEndIndex).join('\n').trim()
      : aiResponse.trim();
    
    // Extract fixes from reasoning
    const fixes = reasoning.split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map(line => line.replace(/^[\s\-•]+/, '').trim())
      .filter(fix => fix.length > 0);
    
    // Test if the cleaned JSON is valid
    JSON.parse(cleanedJson);
    
    return {
      success: true,
      cleanedJson,
      reasoning,
      fixes: fixes.length > 0 ? fixes : ['AI successfully cleaned and restructured the JSON']
    };
  } catch (error) {
    console.error('AI JSON cleaning error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function basicJsonCleaning(rawJson: string, fixes: string[]): Promise<string> {
  let cleanedJson = rawJson;
  
  // Basic escape character fixes
  const escapeReplacements = [
    { pattern: /\\_/g, replacement: '_', description: 'escaped underscores' },
    { pattern: /\\:/g, replacement: ':', description: 'escaped colons' },
    { pattern: /\\"/g, replacement: '"', description: 'escaped quotes' },
    { pattern: /\\\\/g, replacement: '\\', description: 'double backslashes' },
  ];
  
  escapeReplacements.forEach(({ pattern, replacement, description }) => {
    if (pattern.test(cleanedJson)) {
      cleanedJson = cleanedJson.replace(pattern, replacement);
      fixes.push(`Fixed ${description} in field names`);
    }
  });
  
  return cleanedJson;
}

async function enhancedJsonCleaning(rawJson: string, fixes: string[]): Promise<string> {
  let cleanedJson = rawJson;
  
  // Enhanced cleaning with more patterns
  const escapeReplacements = [
    { pattern: /\\_/g, replacement: '_', description: 'escaped underscores' },
    { pattern: /\\:/g, replacement: ':', description: 'escaped colons' },
    { pattern: /\\"/g, replacement: '"', description: 'escaped quotes' },
    { pattern: /\\\\/g, replacement: '\\', description: 'double backslashes' },
    { pattern: /\\n/g, replacement: ' ', description: 'escaped newlines' },
    { pattern: /\\t/g, replacement: ' ', description: 'escaped tabs' },
    { pattern: /\\r/g, replacement: '', description: 'escaped carriage returns' },
  ];
  
  escapeReplacements.forEach(({ pattern, replacement, description }) => {
    if (pattern.test(cleanedJson)) {
      cleanedJson = cleanedJson.replace(pattern, replacement);
      fixes.push(`Fixed ${description} in field names`);
    }
  });
  
  // Fix malformed URLs
  const urlPattern = /("(?:website_url|source_url)"\s*:\s*")(\[https?:\/\/[^"]+)(",\s*"[^"]+"\s*:\s*")([^"]*")/g;
  const urlMatches = cleanedJson.match(urlPattern);
  if (urlMatches) {
    cleanedJson = cleanedJson.replace(urlPattern, (match, prefix, url, separator, suffix) => {
      const cleanUrl = url.replace(/^\[/, '').split(',')[0].split('"')[0];
      fixes.push(`Fixed malformed URL: ${cleanUrl}`);
      return `${prefix}${cleanUrl}"`;
    });
  }
  
  // Fix null values
  cleanedJson = cleanedJson.replace(/\\null/g, 'null');
  cleanedJson = cleanedJson.replace(/"null"/g, 'null');
  cleanedJson = cleanedJson.replace(/:\s*"null"/g, ': null');
  
  // Fix trailing commas
  cleanedJson = cleanedJson.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing quotes around keys
  cleanedJson = cleanedJson.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  fixes.push('Applied enhanced rule-based cleaning');
  
  return cleanedJson;
}

function validateAndTransformVendorData(data: any, warnings: string[], errors: string[]): any {
  const transformed: any = {};
  
  // Required string fields
  const stringFields = [
    'company_name', 'headquarters', 'description', 'company_type',
    'funding_stage', 'total_funding', 'website_url', 'source_url', 'status', 'slug'
  ];
  
  for (const field of stringFields) {
    if (data[field] !== undefined && data[field] !== null) {
      if (typeof data[field] === 'string') {
        transformed[field] = data[field].trim();
      } else {
        transformed[field] = String(data[field]);
        warnings.push(`Converted ${field} from ${typeof data[field]} to string`);
      }
    }
  }
  
  // Numeric fields
  if (data.founding_year !== undefined && data.founding_year !== null) {
    const year = Number(data.founding_year);
    if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 5) {
      warnings.push(`Invalid founding year: ${data.founding_year}`);
    } else {
      transformed.founding_year = year;
    }
  }
  
  // Array fields
  const arrayFields = [
    'core_services', 'specialties', 'customers', 'key_features', 
    'key_benefits', 'key_investors', 'competitive_advantages', 'notable_customers'
  ];
  
  for (const field of arrayFields) {
    if (data[field] !== undefined) {
      if (Array.isArray(data[field])) {
        transformed[field] = data[field]
          .filter(item => typeof item === 'string' && item.trim() !== '')
          .map(item => item.trim());
      } else {
        warnings.push(`Field ${field} should be an array, found ${typeof data[field]}`);
        transformed[field] = [];
      }
    } else {
      transformed[field] = [];
    }
  }
  
  // Object fields
  const objectFields = ['performance_metrics', 'research_data', 'company_data'];
  for (const field of objectFields) {
    if (data[field] !== undefined && data[field] !== null) {
      if (typeof data[field] === 'object') {
        transformed[field] = data[field];
      } else {
        warnings.push(`Field ${field} should be an object, found ${typeof data[field]}`);
        transformed[field] = {};
      }
    } else {
      transformed[field] = {};
    }
  }
  
  // Set default status if not provided
  if (!transformed.status) {
    transformed.status = 'draft';
  }
  
  // Ensure required fields have defaults if missing
  if (!transformed.company_type) {
    transformed.company_type = 'Technology Company';
    warnings.push('Set default company_type');
  }
  
  if (!transformed.headquarters) {
    transformed.headquarters = 'Unknown';
    warnings.push('Set default headquarters');
  }
  
  if (!transformed.description) {
    transformed.description = `${transformed.company_name} is a technology company providing innovative solutions.`;
    warnings.push('Generated default description');
  }
  
  return transformed;
}
