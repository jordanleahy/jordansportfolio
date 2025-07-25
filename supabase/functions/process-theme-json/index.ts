import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingResult {
  success: boolean;
  cleanedData?: any;
  originalData?: any;
  fixes: string[];
  warnings: string[];
  errors: string[];
  modelUsed: string;
  processingTimeMs: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { rawJson } = await req.json();
    console.log('Processing theme JSON data...');

    const result = await processThemeJsonWithAI(rawJson, startTime);
    
    // Track usage
    await trackAgentUsage(result.success, Date.now() - startTime);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-theme-json function:', error);
    await trackAgentUsage(false, Date.now() - startTime);
    
    return new Response(JSON.stringify({
      success: false,
      errors: [error.message],
      fixes: [],
      warnings: [],
      modelUsed: 'gpt-4o-mini',
      processingTimeMs: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function trackAgentUsage(success: boolean, processingTimeMs: number) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from('openai_agents').insert({
      name: 'Theme JSON Processor',
      purpose: 'AI-powered theme JSON cleaning and structuring',
      model_version: 'gpt-4o-mini',
      trigger: 'api_call',
      input_source: 'Raw theme JSON data',
      output_target: 'Cleaned theme data',
      schedule: 'on-demand',
      owner: 'Content Management Team',
      status: 'active',
      last_run: new Date().toISOString(),
      metrics: {
        latencyMs: processingTimeMs,
        errorRate: success ? 0 : 1
      },
      tags: ['theme', 'json-processing', 'content-cleanup', 'ai'],
      notes: `Processing ${success ? 'completed successfully' : 'failed'} in ${processingTimeMs}ms`
    });
  } catch (error) {
    console.error('Failed to track agent usage:', error);
  }
}

async function processThemeJsonWithAI(rawData: any, startTime: number): Promise<ProcessingResult> {
  const fixes: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // First, try to parse and clean the JSON structure
    const aiProcessedData = await aiProcessThemeData(rawData);
    const validatedData = await validateThemeFields(aiProcessedData, fixes, warnings, errors);

    return {
      success: errors.length === 0,
      cleanedData: validatedData,
      originalData: rawData,
      fixes,
      warnings,
      errors,
      modelUsed: 'gpt-4o-mini',
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('AI processing failed:', error);
    errors.push(`AI processing failed: ${error.message}`);
    
    return {
      success: false,
      originalData: rawData,
      fixes,
      warnings,
      errors,
      modelUsed: 'gpt-4o-mini',
      processingTimeMs: Date.now() - startTime
    };
  }
}

async function aiProcessThemeData(rawData: any) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const themeSchema = {
    category: "string (required) - The category/topic of the theme",
    theme: "string (required) - The theme name",
    description: "string (optional) - Brief description of the theme",
    posts: "array (required) - Array of post objects with the following structure:",
    postSchema: {
      day: "number (optional) - Day number (1-30)",
      title: "string (required) - Post title (max 100 characters)",
      description: "string (required) - Post description (100-500 characters)",
      theme: "string (optional) - Theme name (will inherit from parent if not provided)",
      status: "string (optional) - 'draft', 'scheduled', or 'published' (defaults to 'draft')"
    }
  };

  const prompt = `You are a professional content processing AI that cleans and structures theme data for social media content management.

TASK: Clean and structure the following raw theme JSON data according to the schema below.

TARGET SCHEMA:
${JSON.stringify(themeSchema, null, 2)}

PROCESSING RULES:
1. Fix any JSON syntax errors (malformed quotes, missing commas, etc.)
2. Ensure all required fields are present and properly formatted
3. Validate and improve content quality:
   - Titles should be engaging and clear (max 100 chars)
   - Descriptions should be informative and actionable (100-500 chars)
   - Remove any HTML tags or special characters
4. Generate missing day numbers sequentially (1-30)
5. Set default status to 'draft' if not provided
6. Ensure theme consistency across all posts
7. Limit to maximum 30 posts per theme
8. Validate that posts array has at least 1 post

CONTENT IMPROVEMENTS:
- Make titles more engaging and professional
- Ensure descriptions are clear, actionable, and valuable
- Fix grammar and spelling issues
- Remove redundant or low-quality content
- Ensure consistent tone and style

RAW DATA TO PROCESS:
${JSON.stringify(rawData, null, 2)}

Return ONLY the cleaned JSON object, no additional text or explanation.`;

  console.log('Calling OpenAI API for theme processing...');

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
          content: 'You are a professional content processing AI. Return only valid JSON objects without any additional text, explanations, or markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const aiResponse = result.choices[0].message.content.trim();

  try {
    // Remove any potential markdown formatting
    const cleanJson = aiResponse.replace(/^```json\s*|\s*```$/g, '');
    const processedData = JSON.parse(cleanJson);
    
    console.log('AI processing completed successfully');
    return processedData;
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
  }
}

async function validateThemeFields(data: any, fixes: string[], warnings: string[], errors: string[]): Promise<any> {
  const validated = { ...data };

  // Validate category
  if (!validated.category || typeof validated.category !== 'string') {
    if (!validated.category) {
      errors.push('Category is required');
    } else {
      validated.category = String(validated.category);
      fixes.push('Converted category to string');
    }
  }

  // Validate theme
  if (!validated.theme || typeof validated.theme !== 'string') {
    if (!validated.theme) {
      errors.push('Theme is required');
    } else {
      validated.theme = String(validated.theme);
      fixes.push('Converted theme to string');
    }
  }

  // Validate posts array
  if (!Array.isArray(validated.posts)) {
    errors.push('Posts must be an array');
    return validated;
  }

  if (validated.posts.length === 0) {
    errors.push('At least one post is required');
    return validated;
  }

  if (validated.posts.length > 30) {
    validated.posts = validated.posts.slice(0, 30);
    warnings.push('Limited posts to maximum of 30');
  }

  // Validate each post
  validated.posts = validated.posts.map((post: any, index: number) => {
    const validatedPost = { ...post };

    // Validate day
    if (validatedPost.day === undefined || validatedPost.day === null) {
      validatedPost.day = index + 1;
      fixes.push(`Generated day number ${index + 1} for post ${index + 1}`);
    } else if (typeof validatedPost.day !== 'number') {
      validatedPost.day = parseInt(String(validatedPost.day)) || (index + 1);
      fixes.push(`Converted day to number for post ${index + 1}`);
    }

    // Validate title
    if (!validatedPost.title || typeof validatedPost.title !== 'string') {
      errors.push(`Post ${index + 1}: Title is required and must be a string`);
    } else if (validatedPost.title.length > 100) {
      validatedPost.title = validatedPost.title.substring(0, 97) + '...';
      fixes.push(`Truncated title for post ${index + 1}`);
    }

    // Validate description
    if (!validatedPost.description || typeof validatedPost.description !== 'string') {
      errors.push(`Post ${index + 1}: Description is required and must be a string`);
    } else {
      if (validatedPost.description.length < 100) {
        warnings.push(`Post ${index + 1}: Description is quite short (${validatedPost.description.length} chars)`);
      } else if (validatedPost.description.length > 500) {
        validatedPost.description = validatedPost.description.substring(0, 497) + '...';
        fixes.push(`Truncated description for post ${index + 1}`);
      }
    }

    // Set theme if not provided
    if (!validatedPost.theme) {
      validatedPost.theme = validated.theme;
      fixes.push(`Set theme for post ${index + 1}`);
    }

    // Set default status
    if (!validatedPost.status) {
      validatedPost.status = 'draft';
      fixes.push(`Set default status for post ${index + 1}`);
    } else if (!['draft', 'scheduled', 'published'].includes(validatedPost.status)) {
      validatedPost.status = 'draft';
      fixes.push(`Corrected invalid status for post ${index + 1}`);
    }

    return validatedPost;
  });

  return validated;
}