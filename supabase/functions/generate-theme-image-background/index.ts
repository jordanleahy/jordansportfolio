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

  const prompt = `Create a detailed image generation prompt for a ${category}-themed visual that represents the theme "${theme}".

The image should be inspired by this content:
Title: ${title}
Description: ${description}

Requirements:
- Professional, modern illustration style
- 4:3 aspect ratio (landscape orientation)
- Clean, visually appealing composition
- Relevant to ${category} industry
- No text overlays or titles in the image
- Use vibrant but professional colors

Generate a detailed prompt that will create a high-quality image suitable for representing this theme.`;

  console.log('🎨 Generating image prompt for theme:', theme);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating detailed image generation prompts. Create prompts that will generate professional, high-quality visuals.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Error generating image prompt:', error);
    throw error;
  }
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
    
    const { data: uploadData, error: uploadError } = await supabase.storage
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
async function updateThemeImageStatus(supabase: any, status: string, theme: string, userId: string, imageUrl?: string) {
  console.log(`🔄 Updating theme image status to '${status}' for theme: ${theme}`);
  
  const updateData: any = {
    theme_image_generation_status: status,
    updated_at: new Date().toISOString()
  };

  if (imageUrl) {
    updateData.theme_image_4_3_url = imageUrl;
  }

  const { error } = await supabase
    .from('social_media_posts')
    .update(updateData)
    .eq('theme', theme)
    .eq('user_id', userId);

  if (error) {
    console.error('❌ Error updating theme image status:', error);
    throw error;
  }
}

// Helper function to update posts with final image URL and status
async function updatePostsWithImage(supabase: any, imageUrl: string, theme: string, userId: string) {
  const { data, error } = await supabase
    .from('social_media_posts')
    .update({ 
      theme_image_4_3_url: imageUrl,
      theme_image_generation_status: 'complete',
      updated_at: new Date().toISOString()
    })
    .eq('theme', theme)
    .eq('user_id', userId)
    .select('id, title');

  if (error) {
    console.error('❌ Error updating posts with image:', error);
    throw error;
  }

  console.log(`✅ Updated ${data?.length || 0} posts to status 'complete' for theme: ${theme}`);
  return data;
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