import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ImageRequest, SupabaseClient } from '../_shared/types.ts';
import { 
  corsHeaders, 
  updateThemeImageStatus, 
  generateImagePrompt, 
  generateThemeImage 
} from '../_shared/utils.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestData: ImageRequest | null = null;

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
      // Get theme ID from theme name
      const { data: themeData, error: themeError } = await supabase
        .from('themes')
        .select('id')
        .eq('name', theme)
        .eq('user_id', userId)
        .maybeSingle();

      if (themeError || !themeData) {
        throw new Error(`Theme not found: ${theme}`);
      }

      const { data: posts, error: postsError } = await supabase
        .from('social_media_posts')
        .select('title, description')
        .eq('theme_id', themeData.id)
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
    await updateThemeImageStatus(supabase, 'complete', theme, userId, imageUrl);

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