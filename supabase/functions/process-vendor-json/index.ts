
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingResult {
  success: boolean;
  cleanedData?: any;
  originalData?: any;
  fixes?: string[];
  errors?: string[];
  warnings?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawJson } = await req.json();
    console.log('Processing raw JSON input...');

    const result = await processVendorJson(rawJson);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-vendor-json function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      errors: [error.message] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processVendorJson(rawJson: string): Promise<ProcessingResult> {
  const fixes: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    console.log('Starting JSON processing...');
    
    // Step 1: Clean the raw JSON string
    let cleanedJson = rawJson;
    
    // Fix escaped underscores
    if (cleanedJson.includes('\\_')) {
      cleanedJson = cleanedJson.replace(/\\_/g, '_');
      fixes.push('Fixed escaped underscores in field names');
    }
    
    // Fix escaped colons
    if (cleanedJson.includes('\\:')) {
      cleanedJson = cleanedJson.replace(/\\:/g, ':');
      fixes.push('Fixed escaped colons');
    }
    
    // Fix malformed URLs - look for patterns like "url":"[https://...","other_field":"https://...
    const urlPattern = /("(?:website_url|source_url)"\s*:\s*")(\[https?:\/\/[^"]+)(",\s*"[^"]+"\s*:\s*")([^"]*")/g;
    const urlMatches = cleanedJson.match(urlPattern);
    if (urlMatches) {
      cleanedJson = cleanedJson.replace(urlPattern, (match, prefix, url, separator, suffix) => {
        const cleanUrl = url.replace(/^\[/, '').split(',')[0].split('"')[0];
        fixes.push(`Fixed malformed URL: ${cleanUrl}`);
        return `${prefix}${cleanUrl}"`;
      });
    }
    
    // Fix null values that might be escaped
    cleanedJson = cleanedJson.replace(/\\null/g, 'null');
    
    console.log('JSON cleaning completed, attempting to parse...');
    
    // Step 2: Parse the cleaned JSON
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedJson);
    } catch (parseError) {
      // Try to fix common JSON issues
      console.log('Initial parse failed, attempting additional fixes...');
      
      // Fix trailing commas
      cleanedJson = cleanedJson.replace(/,(\s*[}\]])/g, '$1');
      
      // Fix missing quotes around keys
      cleanedJson = cleanedJson.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      try {
        parsedData = JSON.parse(cleanedJson);
        fixes.push('Fixed JSON syntax errors (trailing commas, unquoted keys)');
      } catch (secondParseError) {
        throw new Error(`JSON parsing failed: ${secondParseError.message}`);
      }
    }
    
    console.log('JSON parsed successfully, validating structure...');
    
    // Step 3: Validate and transform the data
    const validatedData = validateAndTransformVendorData(parsedData, warnings, errors);
    
    // Step 4: Check for required fields
    const requiredFields = ['company_name'];
    for (const field of requiredFields) {
      if (!validatedData[field] || validatedData[field].trim() === '') {
        errors.push(`Missing required field: ${field}`);
      }
    }

    console.log(`Processing completed. Fixes: ${fixes.length}, Warnings: ${warnings.length}, Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      cleanedData: validatedData,
      originalData: rawJson,
      fixes,
      warnings,
      errors
    };

  } catch (error) {
    console.error('Error during JSON processing:', error);
    errors.push(error.message);
    
    return {
      success: false,
      originalData: rawJson,
      fixes,
      warnings,
      errors
    };
  }
}

function validateAndTransformVendorData(data: any, warnings: string[], errors: string[]): any {
  const transformed: any = {};
  
  // Required string fields
  const stringFields = [
    'company_name', 'headquarters', 'description', 'company_type',
    'funding_stage', 'total_funding', 'website_url', 'source_url', 'status'
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
  
  return transformed;
}
