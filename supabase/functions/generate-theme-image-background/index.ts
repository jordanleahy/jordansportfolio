/**
 * EDGE FUNCTION: Generate Theme Image Background
 * 
 * PURPOSE:
 * Creates cohesive background images for social media themes using AI image generation.
 * Generates visual identities that represent the theme's content and tone by analyzing
 * theme context and first post content to create representative background visuals.
 * 
 * INPUTS:
 * - theme: string - Theme name for visual context and database lookup
 * - category: string - Content category for style guidance and visual direction
 * - userId: string - User ID for database operations and permissions
 * - firstPostTitle: string (optional) - Override first post title for context
 * - firstPostDescription: string (optional) - Override first post description for inspiration
 * 
 * OUTPUTS:
 * - Success: { success: true, imageUrl: string, theme: string, message: string }
 * - Error: { error: string, details: string }
 * 
 * DEPENDENCIES:
 * - Supabase Database (themes, social_media_posts tables)
 * - AI Image Generation Pipeline (generateImagePrompt, generateThemeImage shared utilities)
 * - Shared Utils (updateThemeImageStatus for status tracking)
 * 
 * USAGE:
 * Called from: Theme creation workflows, visual branding generation, social media theme setup
 * Authentication: Service role access for database operations and image generation
 * 
 * FLOW:
 * 1. Validate theme, category, and userId parameters
 * 2. Look up theme ID and update status to 'generating'
 * 3. Retrieve first post details if not provided for visual context
 * 4. Generate appropriate image prompt using theme and post information
 * 5. Create and upload background image using AI generation pipeline
 * 6. Update theme with generated image URL and mark as 'complete'
 * 7. Handle errors by updating theme status to 'failed' with proper cleanup
 */

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
    const { theme, category, userId, firstPostTitle, firstPostDescription, themeId: providedThemeId } = requestData;

    console.log(`🚀 Starting background image generation for theme: ${theme}`);
    console.log(`📋 Request data: { theme: "${theme}", category: "${category}", userId: "${userId}", themeId: "${providedThemeId}" }`);

    // Validate required parameters
    if (!theme || !category || !userId) {
      throw new Error('Missing required parameters: theme, category, or userId');
    }

    let themeId = providedThemeId;

    // Get theme ID if not provided
    if (!themeId) {
      console.log('🔍 Looking up theme ID for theme:', theme);
      const { data: themeData, error: themeError } = await supabase
        .from('themes')
        .select('id')
        .eq('theme_name', theme)
        .eq('user_id', userId)
        .eq('category', category)
        .maybeSingle();

      if (themeError) {
        console.error('❌ Theme lookup error:', themeError);
        throw new Error(`Theme lookup failed: ${themeError.message}`);
      }

      if (!themeData) {
        // Try searching with just theme name and user (in case category doesn't match exactly)
        console.log('🔄 Retrying theme lookup without category filter...');
        const { data: fallbackThemeData, error: fallbackError } = await supabase
          .from('themes')
          .select('id, category')
          .eq('theme_name', theme)
          .eq('user_id', userId)
          .maybeSingle();

        if (fallbackError || !fallbackThemeData) {
          console.error('❌ Theme not found even with fallback search:', { theme, userId, category });
          throw new Error(`Theme not found: ${theme} for user ${userId}`);
        }

        themeId = fallbackThemeData.id;
        console.log(`✅ Found theme via fallback with category: ${fallbackThemeData.category}`);
      } else {
        themeId = themeData.id;
        console.log('✅ Found theme ID:', themeId);
      }
    } else {
      console.log('✅ Using provided theme ID:', themeId);
    }

    // Set status to generating
    await updateThemeImageStatus(supabase, 'generating', themeId, userId);

    // Get first post data if not provided
    let postTitle = firstPostTitle;
    let postDescription = firstPostDescription;

    if (!postTitle || !postDescription) {
      console.log('🔍 Fetching first post data for image generation');

      const { data: posts, error: postsError } = await supabase
        .from('social_media_posts')
        .select('title, description')
        .eq('theme_id', themeId)
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
    await updateThemeImageStatus(supabase, 'complete', themeId, userId, imageUrl);

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
        
        // Look up theme ID for error handling
        let themeIdForError = requestData.themeId;
        
        if (!themeIdForError) {
          const { data: themeData } = await supabase
            .from('themes')
            .select('id')
            .eq('theme_name', requestData.theme)
            .eq('user_id', requestData.userId)
            .maybeSingle();
            
          themeIdForError = themeData?.id;
        }

        if (themeIdForError) {
          await updateThemeImageStatus(supabase, 'failed', themeIdForError, requestData.userId);
          console.log('✅ Updated theme status to failed');
        }
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