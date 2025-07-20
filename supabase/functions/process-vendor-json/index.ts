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

interface ParsedCitation {
  id: string;
  documentId: string;
  startLine?: number;
  endLine?: number;
  originalText: string;
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

function parseCitations(text: string): { cleanText: string; citations: ParsedCitation[] } {
  const citationPattern = /【([^†]+)†L?(\d+)?-?L?(\d+)?】/g;
  const citations: ParsedCitation[] = [];
  let match;
  let citationIndex = 0;

  while ((match = citationPattern.exec(text)) !== null) {
    const [fullMatch, documentId, startLine, endLine] = match;
    citations.push({
      id: `citation_${citationIndex++}`,
      documentId,
      startLine: startLine ? parseInt(startLine) : undefined,
      endLine: endLine ? parseInt(endLine) : startLine ? parseInt(startLine) : undefined,
      originalText: fullMatch
    });
  }

  const cleanText = text.replace(citationPattern, '').trim();
  
  return { cleanText, citations };
}

function processTextWithCitations(text: string): { text: string; citations: ParsedCitation[] } {
  if (typeof text !== 'string') return { text: String(text), citations: [] };
  return parseCitations(text);
}

function processArrayWithCitations(array: any[]): { items: string[]; citations: ParsedCitation[] } {
  const allCitations: ParsedCitation[] = [];
  const cleanItems: string[] = [];

  array.forEach((item, index) => {
    if (typeof item === 'string' && item.trim() !== '') {
      const { cleanText, citations } = parseCitations(item);
      if (cleanText.length > 0) {
        cleanItems.push(cleanText);
        // Add index information to citations for array context
        citations.forEach(citation => {
          citation.id = `${citation.id}_item_${index}`;
          allCitations.push(citation);
        });
      }
    }
  });

  return { items: cleanItems, citations: allCitations };
}

async function processVendorJson(rawJson: string): Promise<ProcessingResult> {
  const fixes: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  let aiCleaningUsed = false;
  let aiReasoning = '';

  try {
    console.log('Starting JSON processing...');
    
    // Step 1: Enhanced basic cleaning first (handles ChatGPT formatting)
    let cleanedJson = await enhancedBasicCleaning(rawJson, fixes);
    
    // Step 2: Try to parse
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedJson);
      console.log('Enhanced basic cleaning successful');
    } catch (parseError) {
      console.log('Basic cleaning failed, trying AI-powered cleaning...');
      
      // Step 3: Use AI to clean the JSON (with timeout)
      if (openAIApiKey) {
        try {
          const aiResult = await Promise.race([
            aiJsonCleaning(rawJson),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI cleaning timeout')), 15000))
          ]) as any;
          
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
          // Fallback to legacy enhanced cleaning
          cleanedJson = await legacyEnhancedCleaning(rawJson, fixes);
          parsedData = JSON.parse(cleanedJson);
        }
      } else {
        // No OpenAI key, use legacy enhanced cleaning
        cleanedJson = await legacyEnhancedCleaning(rawJson, fixes);
        parsedData = JSON.parse(cleanedJson);
      }
    }
    
    console.log('JSON parsed successfully, applying citation-aware field mapping...');
    
    // Step 4: Apply citation-aware field mapping
    const mappedData = await applyCitationAwareMapping(parsedData, fixes, warnings);
    
    // Step 5: Validate and set defaults for required fields
    const validatedData = validateRequiredFields(mappedData, warnings, errors);
    
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

async function applyCitationAwareMapping(data: any, fixes: string[], warnings: string[]): Promise<any> {
  const mappedData: any = {};
  const allCitations: { [key: string]: ParsedCitation[] } = {};
  
  // Direct field assignments with citation extraction
  const directFields = [
    'company_name', 'headquarters', 'founding_year', 'company_type', 'description',
    'website_url', 'funding_stage', 'total_funding', 'business_model', 
    'employee_count_range', 'geographic_presence', 'contact_email', 
    'contact_phone', 'contact_address', 'linkedin_url', 'twitter_url'
  ];
  
  for (const field of directFields) {
    if (data[field] !== undefined && data[field] !== null) {
      if (typeof data[field] === 'string') {
        const { text, citations } = processTextWithCitations(data[field]);
        mappedData[field] = text;
        if (citations.length > 0) {
          allCitations[field] = citations;
          fixes.push(`Extracted ${citations.length} citations from ${field}`);
        }
      } else {
        mappedData[field] = data[field];
      }
    }
  }
  
  // Array field processing with citation extraction
  const arrayFields = [
    'core_services', 'specialties', 'customers', 'key_features', 'key_benefits', 
    'key_investors', 'competitive_advantages', 'notable_customers',
    'certifications', 'awards_recognition', 'office_locations', 'partnerships', 'tech_stack'
  ];
  
  for (const field of arrayFields) {
    if (data[field] && Array.isArray(data[field])) {
      const { items, citations } = processArrayWithCitations(data[field]);
      mappedData[field] = items;
      if (citations.length > 0) {
        allCitations[field] = citations;
        fixes.push(`Extracted ${citations.length} citations from ${field} array`);
      }
    } else {
      mappedData[field] = [];
    }
  }
  
  // Store citations in research_data
  if (Object.keys(allCitations).length > 0) {
    mappedData.research_data = {
      ...data.research_data,
      citations: allCitations,
      citation_count: Object.values(allCitations).reduce((sum, citations) => sum + citations.length, 0)
    };
    fixes.push(`Stored ${Object.keys(allCitations).length} field citations in research_data`);
  }
  
  // Generate slug from company name
  if (mappedData.company_name) {
    mappedData.slug = generateSlug(mappedData.company_name);
    fixes.push('Generated slug from company name');
  }
  
  // Handle other object fields
  const objectFields = ['performance_metrics', 'company_data'];
  for (const field of objectFields) {
    if (data[field] !== undefined) {
      if (typeof data[field] === 'object' && data[field] !== null) {
        mappedData[field] = data[field];
      } else {
        warnings.push({
          field,
          message: `${field} should be an object, setting to empty object`,
          severity: 'warning'
        });
        mappedData[field] = {};
      }
    } else {
      mappedData[field] = {};
    }
  }
  
  // Set default research_data if not already set
  if (!mappedData.research_data) {
    mappedData.research_data = data.research_data || {};
  }
  
  return mappedData;
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
  // Use a more focused, smaller prompt for faster processing
  const prompt = `Fix this malformed JSON. Common issues: escaped underscores (\\_), broken quotes, trailing commas.

RETURN ONLY VALID JSON:
${rawJson.substring(0, 2000)}${rawJson.length > 2000 ? '...[truncated]' : ''}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Faster, cheaper model
        messages: [
          { 
            role: 'system', 
            content: 'You fix JSON syntax errors. Return only valid JSON, no explanation.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        max_tokens: 2000 // Reduced for faster processing
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const cleanedJson = data.choices[0].message.content.trim();
    
    // Test if the cleaned JSON is valid
    JSON.parse(cleanedJson);
    
    return {
      success: true,
      cleanedJson,
      reasoning: 'AI cleaned JSON formatting issues',
      fixes: ['AI successfully fixed JSON syntax errors']
    };
  } catch (error) {
    console.error('AI JSON cleaning error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function enhancedBasicCleaning(rawJson: string, fixes: string[]): Promise<string> {
  let cleanedJson = rawJson;
  
  // Enhanced cleaning with ChatGPT-specific patterns
  const cleaningRules = [
    // Fix escaped underscores (ChatGPT common issue)
    { pattern: /\\_/g, replacement: '_', description: 'escaped underscores' },
    // Fix escaped colons
    { pattern: /\\:/g, replacement: ':', description: 'escaped colons' },
    // Fix markdown-style URLs in brackets
    { pattern: /\[https?:\/\/([^\]]+)\]\(https?:\/\/[^)]+\)/g, replacement: 'https://$1', description: 'markdown URLs' },
    // Fix escaped quotes
    { pattern: /\\"/g, replacement: '"', description: 'escaped quotes' },
    // Fix double backslashes
    { pattern: /\\\\/g, replacement: '\\', description: 'double backslashes' },
    // Fix escaped newlines
    { pattern: /\\n/g, replacement: ' ', description: 'escaped newlines' },
    // Fix escaped tabs
    { pattern: /\\t/g, replacement: ' ', description: 'escaped tabs' },
    // Fix trailing commas in arrays and objects
    { pattern: /,(\s*[}\]])/g, replacement: '$1', description: 'trailing commas' },
    // Fix missing quotes around object keys
    { pattern: /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, replacement: '$1"$2":', description: 'unquoted object keys' }
  ];
  
  cleaningRules.forEach(({ pattern, replacement, description }) => {
    if (pattern.test(cleanedJson)) {
      cleanedJson = cleanedJson.replace(pattern, replacement);
      fixes.push(`Fixed ${description}`);
    }
  });
  
  return cleanedJson;
}

async function legacyEnhancedCleaning(rawJson: string, fixes: string[]): Promise<string> {
  let cleanedJson = rawJson;
  
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
  
  // Fix trailing commas
  cleanedJson = cleanedJson.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing quotes around keys
  cleanedJson = cleanedJson.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  fixes.push('Applied legacy enhanced cleaning');
  
  return cleanedJson;
}

function validateRequiredFields(data: any, warnings: string[], errors: string[]): any {
  const validated: any = { ...data };
  
  // Required fields validation
  const requiredFields = ['company_name', 'headquarters', 'company_type', 'description'];
  for (const field of requiredFields) {
    if (!validated[field] || (typeof validated[field] === 'string' && validated[field].trim() === '')) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Ensure array fields are arrays
  const arrayFields = [
    'core_services', 'specialties', 'customers', 'key_features', 
    'key_benefits', 'key_investors', 'competitive_advantages', 'notable_customers',
    'certifications', 'awards_recognition', 'office_locations', 'partnerships', 'tech_stack'
  ];
  
  for (const field of arrayFields) {
    if (!validated[field] || !Array.isArray(validated[field])) {
      validated[field] = [];
      warnings.push(`Set empty array for ${field}`);
    }
  }
  
  // Ensure JSON fields are objects
  if (!validated.company_data || typeof validated.company_data !== 'object') {
    validated.company_data = {};
  }
  
  if (!validated.research_data || typeof validated.research_data !== 'object') {
    validated.research_data = {};
  }
  
  // Set default status
  if (!validated.status) {
    validated.status = 'draft';
  }
  
  // Set defaults for missing required fields
  if (!validated.company_type) {
    validated.company_type = 'Technology Company';
    warnings.push('Set default company_type');
  }
  
  if (!validated.headquarters) {
    validated.headquarters = 'Unknown';
    warnings.push('Set default headquarters');
  }
  
  if (!validated.description && validated.company_name) {
    validated.description = `${validated.company_name} is a technology company providing innovative solutions.`;
    warnings.push('Generated default description');
  }
  
  return validated;
}
