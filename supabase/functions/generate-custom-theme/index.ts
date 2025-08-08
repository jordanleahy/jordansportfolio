/**
 * EDGE FUNCTION: Generate Custom Theme
 * 
 * PURPOSE:
 * Creates complete social media content themes from user descriptions using AI.
 * Generates structured theme data including category classification, theme naming,
 * and exactly 10 sequential daily posts with professional content for social media calendars.
 * 
 * INPUTS:
 * - description: string - User's theme description or content idea
 * 
 * OUTPUTS:
 * - Success: { success: true, themeData: object, message: string }
 * - Error: { success: false, error: string }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-4o-mini for theme and content generation)
 * 
 * USAGE:
 * Called from: Theme creation workflows, content planning tools, social media calendar generation
 * Authentication: Not required - public content generation endpoint
 * 
 * FLOW:
 * 1. Validate description input and OpenAI API availability
 * 2. Apply detailed system prompt requiring exact JSON structure with 10 posts
 * 3. Generate complete theme using OpenAI with specific formatting requirements
 * 4. Parse and validate generated JSON for required fields and post count
 * 5. Verify each post has day, title, and description fields
 * 6. Return structured theme data ready for import into content management systems
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [generate-custom-theme] Function started');
    
    if (!openAIApiKey) {
      console.log('❌ [generate-custom-theme] OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const { description } = await req.json();
    console.log('📝 [generate-custom-theme] Received description:', description);

    if (!description || description.trim().length === 0) {
      console.log('❌ [generate-custom-theme] No description provided');
      throw new Error('Theme description is required');
    }

    console.log('🎯 [generate-custom-theme] Generating custom theme for description:', description);

    const systemPrompt = `You are a professional social media content strategist. Convert user descriptions into structured theme JSON for social media calendar generation.

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no explanations or markdown
- Category must be lowercase, no spaces, use hyphens for separation
- Theme should be title case with proper spacing
- Generate exactly 10 posts with days 1-10
- Each post needs: day (number), title (engaging, professional), description (informative, 2-3 sentences)
- All content should be professional and industry-appropriate

JSON STRUCTURE REQUIRED:
{
  "category": "lowercase-category-name",
  "theme": "Professional Theme Title",
  "description": "Brief description of the theme focus",
  "posts": [
    {
      "day": 1,
      "title": "Engaging Post Title",
      "description": "Professional description explaining the topic clearly and providing value. Keep it informative and actionable."
    }
  ]
}

EXAMPLES:
User: "AI in healthcare for doctors"
Output: {"category": "ai-healthcare", "theme": "AI in Healthcare", "description": "Comprehensive guide to AI applications transforming healthcare delivery and patient outcomes", "posts": [...]}

User: "Marketing tips for small business"
Output: {"category": "small-business-marketing", "theme": "Small Business Marketing", "description": "Essential marketing strategies and tactics for growing small businesses", "posts": [...]}`;

    console.log('🤖 [generate-custom-theme] Calling OpenAI API');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a social media theme for: ${description}` }
        ]
      }),
    });

    console.log('📥 [generate-custom-theme] OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [generate-custom-theme] OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content.trim();

    console.log('📄 [generate-custom-theme] Generated content:', generatedContent);

    // Parse and validate the JSON
    console.log('🔍 [generate-custom-theme] Parsing generated JSON');
    let themeData;
    try {
      themeData = JSON.parse(generatedContent);
      console.log('✅ [generate-custom-theme] JSON parsed successfully:', themeData);
    } catch (parseError) {
      console.error('❌ [generate-custom-theme] Failed to parse generated JSON:', parseError);
      throw new Error('Generated content is not valid JSON');
    }

    // Basic validation
    console.log('🔍 [generate-custom-theme] Validating theme data structure');
    if (!themeData.category || !themeData.theme || !themeData.posts || !Array.isArray(themeData.posts)) {
      console.log('❌ [generate-custom-theme] Missing required fields:', {
        hasCategory: !!themeData.category,
        hasTheme: !!themeData.theme,
        hasPosts: !!themeData.posts,
        isPostsArray: Array.isArray(themeData.posts)
      });
      throw new Error('Generated theme data is missing required fields');
    }

    if (themeData.posts.length !== 10) {
      console.log('❌ [generate-custom-theme] Wrong number of posts:', themeData.posts.length);
      throw new Error('Theme must contain exactly 10 posts');
    }

    // Validate each post
    console.log('🔍 [generate-custom-theme] Validating individual posts');
    for (const post of themeData.posts) {
      if (!post.day || !post.title || !post.description) {
        console.log('❌ [generate-custom-theme] Invalid post:', post);
        throw new Error('Each post must have day, title, and description');
      }
    }

    console.log('✅ [generate-custom-theme] Theme generation successful:', themeData.category);

    return new Response(JSON.stringify({ 
      success: true, 
      themeData,
      message: 'Theme generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 [generate-custom-theme] Error in function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});