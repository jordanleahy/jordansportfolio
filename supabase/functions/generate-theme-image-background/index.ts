import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackgroundImageRequest {
  theme: string;
  category: string;
  userId: string;
  firstPostTitle?: string;
  firstPostDescription?: string;
}

// Helper function to generate image prompt using OpenAI
async function generateImagePrompt(title: string, description: string, theme: string, category: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🎨 Generating image prompt for theme:', theme);
  
  const systemPrompt = `You are an expert at creating detailed, professional image generation prompts for ${theme}-themed AI image generators.

Create prompts that will generate:
- Professional, credible visuals suitable for ${theme} content
- Clear focal points that support the content message
- Appropriate industry context and environmental elements
- Balanced composition with good visual hierarchy
- Consistent branding feel across different ${theme} topics

CRITICAL FORMATTING RULES:
- DO NOT include any title, headline, or text overlays in the generated image
- Include "in a 4:3 landscape format" naturally within the prompt description
- Focus purely on the visual elements, composition, and professional aesthetic
- End the prompt with a period, no additional formatting or labels`;

  const userPrompt = `Title: ${title}
Description: ${description}
Theme: ${theme}
Category: ${category}

Create a detailed image generation prompt for this ${theme} theme content.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 500
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Helper function to generate theme image using OpenAI
async function generateThemeImage(supabase: any, prompt: string, theme: string, userId: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🖼️ Generating theme image for:', theme);

  try {
    // Generate image using OpenAI
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        response_format: 'b64_json'
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI Image API Error Details:', errorData);
      throw new Error(`OpenAI Image API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const base64Image = data.data[0].b64_json;

    // Convert to blob for upload
    const imageData = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
    const blob = new Blob([imageData], { type: 'image/png' });

    // Upload to Supabase Storage
    const fileName = `theme-images/${userId}/${theme.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('social-media-images')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error uploading image:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('social-media-images')
      .getPublicUrl(fileName);

    console.log('✅ Theme image uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;

  } catch (error) {
    console.error('❌ Error generating theme image:', error);
    throw error;
  }
}

// Helper function to update theme image status in database
async function updateThemeImageStatus(supabase: any, status: string, theme: string, userId: string, imageUrl?: string): Promise<void> {
  console.log(`🔄 Updating theme image status to '${status}' for theme: ${theme}`);
  
  const updateData: any = {
    theme_image_generation_status: status,
    updated_at: new Date().toISOString()
  };
  
  if (imageUrl && status === 'complete') {
    updateData.theme_image_4_3_url = imageUrl;
  }
  
  const { data, error } = await supabase
    .from('social_media_posts')
    .update(updateData)
    .eq('theme', theme)
    .eq('user_id', userId)
    .select('id, title');

  if (error) {
    console.error(`❌ Failed to update theme image status:`, error);
    throw new Error(`Database update failed: ${error.message}`);
  }
  
  console.log(`✅ Updated ${data?.length || 0} posts to status '${status}' for theme: ${theme}`);
}

// Helper function to update posts with final image URL and status
async function updatePostsWithImage(supabase: any, imageUrl: string, theme: string, userId: string): Promise<void> {
  return updateThemeImageStatus(supabase, 'complete', theme, userId, imageUrl);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestData: BackgroundImageRequest | null = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body and store it for error handling
    requestData = await req.json();
    const { theme, category, userId, firstPostTitle, firstPostDescription } = requestData;

    console.log(`🚀 Starting background image generation for theme: ${theme}`);
    console.log(`📋 Request data: { theme: "${theme}", category: "${category}", userId: "${userId}" }`);

    // Validate required parameters
    if (!theme || !category || !userId) {
      throw new Error('Missing required parameters: theme, category, or userId');
    }

    // Set status to generating
    await updateThemeImageStatus(supabase, 'generating', theme, userId);

    // Get first post data if not provided
    let postTitle = firstPostTitle;
    let postDescription = firstPostDescription;

    if (!postTitle || !postDescription) {
      console.log('🔍 Fetching first post data for image generation');
      const { data: posts, error: postsError } = await supabase
        .from('social_media_posts')
        .select('title, description')
        .eq('theme', theme)
        .eq('user_id', userId)
        .order('day', { ascending: true })
        .limit(1);

      if (postsError || !posts || posts.length === 0) {
        throw new Error('No posts found for theme');
      }

      postTitle = posts[0].title;
      postDescription = posts[0].description;
    }

    // Generate image prompt
    const imagePrompt = await generateImagePrompt(postTitle, postDescription, theme, category);
    console.log('✅ Generated image prompt successfully');

    // Generate and upload theme image
    const imageUrl = await generateThemeImage(supabase, imagePrompt, theme, userId);
    console.log('✅ Generated and uploaded theme image successfully');

    // Update all posts with the image URL and mark as complete
    await updatePostsWithImage(supabase, imageUrl, theme, userId);

    console.log(`🎉 Background image generation completed successfully for theme: ${theme}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
        theme,
        message: 'Theme image generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in background image generation:', error);

    // Try to update status to failed if we have the necessary info
    try {
      if (requestData?.theme && requestData?.userId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await updateThemeImageStatus(supabase, 'failed', requestData.theme, requestData.userId);
        console.log('✅ Updated theme status to failed');
      }
    } catch (statusError) {
      console.error('❌ Error updating failed status:', statusError);
    }

    return new Response(
      JSON.stringify({ 
        error: 'Background image generation failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});