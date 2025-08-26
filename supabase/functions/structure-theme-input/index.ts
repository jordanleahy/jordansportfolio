import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions for theme data structure
interface PostStatus {
  draft: 'draft';
  scheduled: 'scheduled';
  published: 'published';
}

interface ThemePost {
  day?: number;
  title: string;
  story_description: string;
  status?: keyof PostStatus;
}

interface ThemeImportData {
  category?: string;
  theme: string;
  theme_description?: string;
  posts: ThemePost[];
}

interface ProcessingResult {
  success: boolean;
  data?: ThemeImportData;
  error?: string;
  warnings?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Structure Theme Input - Processing request...');
    
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return json({ error: 'Missing or invalid text input' }, 400);
    }

    console.log('📥 Input text length:', text.length);

    // First attempt: Try to normalize locally
    const localResult = tryNormalizeLocal(text);
    if (localResult.success && localResult.data) {
      console.log('✅ Local normalization successful');
      return json(localResult);
    }

    console.log('🤖 Local normalization failed, using OpenAI...');
    
    // Fallback: Use OpenAI API for complex structuring
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return json({ error: 'OpenAI API key not configured' }, 500);
    }

    const systemPrompt = `You are a strict data structuring agent. Convert user text into EXACT JSON that matches this schema and constraints. Output ONLY raw JSON (no code fences, no commentary).

SCHEMA:
{
  "category": "string (1-100, optional)",
  "theme": "string (1-200, required)",
  "theme_description": "string (<=1000, optional)",
  "posts": [
    {
      "day": number (1-365, optional),
      "title": "string (1-500, required)",
      "story_description": "string (1-2000, required)",
      "status": "draft" | "scheduled" | "published" (default "draft")
    }
  ]
}

REQUIREMENTS:
- posts length: 1-100 max
- Trim whitespace, remove empty strings
- If category missing: set to "general"
- If status missing/invalid: set to "draft"
- If day missing: auto-increment starting at 1
- Map any fields like description -> story_description
- NEVER include markdown, explanations, or keys not in schema.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_completion_tokens: 2000, // GPT-5 compatible parameter
        // Note: temperature parameter removed for GPT-5 compatibility
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      return json({ 
        error: `OpenAI API error: ${response.status}`,
        details: errorData 
      }, 500);
    }

    const aiResponse = await response.json();
    const structuredText = aiResponse.choices[0].message.content.trim();
    
    console.log('📤 OpenAI response length:', structuredText.length);

    // Parse and validate the AI response
    let parsedData;
    try {
      parsedData = JSON.parse(structuredText);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI JSON response:', parseError);
      return json({ 
        error: 'Failed to parse AI response as JSON',
        raw_response: structuredText.substring(0, 200)
      }, 500);
    }

    // Validate and coerce the parsed data
    const validationResult = validateAndCoerce(parsedData);
    
    console.log('✅ Structure Theme Input - Processing complete');
    return json(validationResult);

  } catch (error) {
    console.error('💥 Structure Theme Input - Error:', error);
    return json({ 
      error: 'Internal server error',
      message: error.message 
    }, 500);
  }
});

// Helper function to create JSON responses with CORS headers
function json(obj: any, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Try to normalize input locally (for already structured JSON)
function tryNormalizeLocal(input: string): ProcessingResult {
  try {
    // Remove common markdown artifacts
    const cleaned = input.replace(/```json\s*|\s*```/g, '').trim();
    
    const parsed = JSON.parse(cleaned);
    const result = validateAndCoerce(parsed);
    
    if (result.success) {
      return result;
    }
    
    return { success: false, error: 'Local validation failed' };
  } catch (error) {
    return { success: false, error: `Local parse failed: ${error.message}` };
  }
}

// Validate and coerce data to match ThemeImportData schema
function validateAndCoerce(obj: any): ProcessingResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return { success: false, error: 'Input must be an object' };
  }

  // Validate required theme field
  if (!obj.theme || typeof obj.theme !== 'string') {
    return { success: false, error: 'Missing required field: theme' };
  }

  if (obj.theme.length > 200) {
    obj.theme = obj.theme.substring(0, 200);
    warnings.push('Theme truncated to 200 characters');
  }

  // Validate and set category
  if (!obj.category || typeof obj.category !== 'string') {
    obj.category = 'general';
    warnings.push('Category defaulted to "general"');
  } else if (obj.category.length > 100) {
    obj.category = obj.category.substring(0, 100);
    warnings.push('Category truncated to 100 characters');
  }

  // Validate theme_description
  if (obj.theme_description && typeof obj.theme_description === 'string') {
    if (obj.theme_description.length > 1000) {
      obj.theme_description = obj.theme_description.substring(0, 1000);
      warnings.push('Theme description truncated to 1000 characters');
    }
  }

  // Validate posts array
  if (!Array.isArray(obj.posts)) {
    return { success: false, error: 'Posts must be an array' };
  }

  if (obj.posts.length === 0) {
    return { success: false, error: 'At least one post is required' };
  }

  if (obj.posts.length > 100) {
    obj.posts = obj.posts.slice(0, 100);
    warnings.push('Posts array truncated to 100 items');
  }

  // Validate and coerce each post
  obj.posts = obj.posts.map((post: any, index: number) => {
    if (!post || typeof post !== 'object') {
      errors.push(`Post ${index + 1}: Invalid post object`);
      return null;
    }

    // Handle title
    if (!post.title || typeof post.title !== 'string') {
      errors.push(`Post ${index + 1}: Missing or invalid title`);
      return null;
    }
    if (post.title.length > 500) {
      post.title = post.title.substring(0, 500);
      warnings.push(`Post ${index + 1}: Title truncated to 500 characters`);
    }

    // Handle description (map from various possible field names)
    let description = post.story_description || post.description || '';
    if (!description || typeof description !== 'string') {
      errors.push(`Post ${index + 1}: Missing or invalid description`);
      return null;
    }
    if (description.length > 2000) {
      description = description.substring(0, 2000);
      warnings.push(`Post ${index + 1}: Description truncated to 2000 characters`);
    }

    // Validate day
    let day = post.day;
    if (day !== undefined) {
      day = Number(day);
      if (isNaN(day) || day < 1 || day > 365) {
        warnings.push(`Post ${index + 1}: Invalid day value, will be auto-assigned`);
        day = undefined;
      }
    }

    // Validate status
    let status = post.status;
    if (!status || !['draft', 'scheduled', 'published'].includes(status)) {
      status = 'draft';
      if (post.status) {
        warnings.push(`Post ${index + 1}: Invalid status, defaulted to 'draft'`);
      }
    }

    return {
      day,
      title: post.title.trim(),
      story_description: description.trim(),
      status
    };
  }).filter(Boolean); // Remove null entries

  // Auto-assign days for posts without day values
  let nextDay = 1;
  obj.posts.forEach((post: any) => {
    if (!post.day) {
      post.day = nextDay;
    }
    nextDay = Math.max(nextDay, post.day + 1);
  });

  if (errors.length > 0) {
    return { 
      success: false, 
      error: `Validation errors: ${errors.join('; ')}`,
      warnings 
    };
  }

  const result: ThemeImportData = {
    category: obj.category,
    theme: obj.theme.trim(),
    theme_description: obj.theme_description?.trim(),
    posts: obj.posts
  };

  return { 
    success: true, 
    data: result,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}