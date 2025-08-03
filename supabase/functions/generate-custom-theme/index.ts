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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { description } = await req.json();

    if (!description || description.trim().length === 0) {
      throw new Error('Theme description is required');
    }

    console.log('Generating custom theme for description:', description);

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a social media theme for: ${description}` }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content.trim();

    console.log('Generated content:', generatedContent);

    // Parse and validate the JSON
    let themeData;
    try {
      themeData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse generated JSON:', parseError);
      throw new Error('Generated content is not valid JSON');
    }

    // Basic validation
    if (!themeData.category || !themeData.theme || !themeData.posts || !Array.isArray(themeData.posts)) {
      throw new Error('Generated theme data is missing required fields');
    }

    if (themeData.posts.length !== 10) {
      throw new Error('Theme must contain exactly 10 posts');
    }

    // Validate each post
    for (const post of themeData.posts) {
      if (!post.day || !post.title || !post.description) {
        throw new Error('Each post must have day, title, and description');
      }
    }

    console.log('Theme generation successful:', themeData.category);

    return new Response(JSON.stringify({ 
      success: true, 
      themeData,
      message: 'Theme generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-custom-theme function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});