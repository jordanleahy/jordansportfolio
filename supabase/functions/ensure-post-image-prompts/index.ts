/**
 * EDGE FUNCTION: Ensure Post Image Prompts
 * 
 * PURPOSE:
 * Automatically generates image prompts for social media posts that are missing them.
 * Uses bulk prompt generation for efficient processing of multiple posts.
 * 
 * INPUTS:
 * - category: string - Category of posts to process (e.g., 'coding ai', 'healthcare', 'contracts')
 * - userId: string - User ID to filter posts
 * - themeId: string (optional) - Theme ID to filter posts by specific theme
 * 
 * OUTPUTS:
 * - Success: { success: true, category: string, totalPosts: number, status: 'processing' }
 * - Error: { error: string }
 * 
 * DEPENDENCIES:
 * - bulk-generate-prompts edge function
 * - Supabase Database (social_media_posts, themes tables)
 * 
 * USAGE:
 * Called from: Theme lifecycle management, content management workflows
 * Authentication: Service role access for batch operations
 * 
 * FLOW:
 * 1. Fetch all posts in specified category that lack image prompts
 * 2. Return immediate response and process in background using EdgeRuntime.waitUntil()
 * 3. Call bulk-generate-prompts function for efficient processing
 * 4. Update posts with generated prompts and timestamps
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 ENSURE POST IMAGE PROMPTS: Function started');
    
    const { category, userId, themeId } = await req.json();

    if (!category || !userId) {
      console.log('❌ MISSING REQUIRED FIELDS: category and userId are required');
      return new Response(
        JSON.stringify({ error: 'Category and userId are required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📋 ENSURE PROMPTS REQUEST: Category: ${category}, User: ${userId}, Theme: ${themeId || 'all'}`);

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Step 1: Get all posts in the category with theme data (optimized with JOIN)
    console.log('🔍 STEP 1: Fetching posts without image prompts');
    let postsQuery = supabase
      .from('social_media_posts')
      .select(`
        id, 
        title, 
        description, 
        category, 
        theme_id,
        themes!inner(
          visual_prompt_system_prompt_id,
          theme_name,
          category
        )
      `)
      .eq('category', category)
      .eq('user_id', userId)
      .is('generated_image_prompt', null);
    
    // If themeId is specified, filter by theme for more targeted processing
    if (themeId) {
      postsQuery = postsQuery.eq('theme_id', themeId);
      console.log(`🎯 FILTERING BY THEME: ${themeId}`);
    }
    
    const { data: posts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error('❌ ERROR FETCHING POSTS:', postsError);
      throw new Error(`Failed to fetch posts: ${postsError.message}`);
    }

    if (!posts || posts.length === 0) {
      console.log('✅ NO POSTS NEED PROMPTS: All posts already have image prompts (HYBRID SOLUTION: Duplicate protection active)');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No posts need image prompts - duplicate protection active',
          processed: 0,
          duplicateProtection: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 FOUND ${posts.length} POSTS: Need image prompt generation (HYBRID SOLUTION: Processing remaining posts)`);
    
    
    // Log details about posts found
    posts.forEach((post, index) => {
      console.log(`📝 [Post ${index + 1}] ID: ${post.id}, Title: "${post.title}", Theme ID: ${post.theme_id}`);
    });

    // Step 2: Return early response and process in background
    console.log('🚀 STEP 2: Starting background image prompt generation');
    console.log(`📊 Processing ${posts.length} posts with optimized batch processing`);

    // Background processing function using bulk prompt generation
    const processImagePromptsInBackground = async () => {
      console.log(`🔄 BACKGROUND: Processing ${posts.length} posts using bulk generation`);

      try {
        // Prepare bulk request data
        const bulkRequests = posts.map(post => ({
          postId: post.id,
          aspectRatio: '1:1'
        }));

        console.log(`🚀 BACKGROUND: Calling bulk-generate-prompts for ${bulkRequests.length} posts`);

        // Make single bulk call instead of individual calls
        const firstPost = posts[0];
        const bulkResult = await supabase.functions.invoke('bulk-generate-prompts', {
          body: {
            requests: bulkRequests,
            themeId: firstPost.theme_id,
            batchSize: bulkRequests.length
          }
        });

        if (bulkResult.error) {
          console.error(`❌ BACKGROUND: Bulk generation failed:`, bulkResult.error);
          throw new Error(`Bulk generation failed: ${bulkResult.error.message}`);
        }

        const bulkResponse = bulkResult.data;
        const results = bulkResponse?.results || [];
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.length - successCount;

        console.log(`📈 BACKGROUND PROCESSING COMPLETE: {
      category: "${category}",
      totalPosts: ${posts.length},
      successCount: ${successCount},
      errorCount: ${errorCount},
      successRate: ${((successCount / posts.length) * 100).toFixed(1)}%
    }`);

        // Update database with successful results
        for (const result of results) {
          if (result.success && result.prompt) {
            try {
              const { error: updateError } = await supabase
                .from('social_media_posts')
                .update({ 
                  generated_image_prompt: result.prompt,
                  individual_prompt_status: 'completed',
                  updated_at: new Date().toISOString()
                })
                .eq('id', result.postId);

              if (updateError) {
                console.error(`❌ BACKGROUND: Failed to update post ${result.postId}:`, updateError);
              } else {
                console.log(`✅ BACKGROUND: Updated post ${result.postId} with generated prompt`);
              }
            } catch (updateError) {
              console.error(`❌ BACKGROUND: Exception updating post ${result.postId}:`, updateError);
            }
          }
        }

        // Final background processing results
        console.log(`📈 BACKGROUND PROCESSING COMPLETE: {
      category: "${category}",
      totalPosts: ${posts.length},
      successCount: ${successCount},
      errorCount: ${errorCount},
      successRate: ${((successCount / posts.length) * 100).toFixed(1)}%
    }`);

      } catch (backgroundError) {
        console.error('❌ BACKGROUND PROCESSING ERROR:', backgroundError);
      }
    };

    // Use EdgeRuntime.waitUntil to run background processing without blocking response
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(processImagePromptsInBackground());
      console.log('📋 BACKGROUND: Processing started with EdgeRuntime.waitUntil()');
    } else {
      // Fallback for environments without EdgeRuntime.waitUntil
      processImagePromptsInBackground().catch(error => {
        console.error('❌ BACKGROUND PROCESSING FALLBACK ERROR:', error);
      });
      console.log('📋 BACKGROUND: Processing started with fallback method');
    }

    // Return immediate response to prevent timeout
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Image prompt generation started in background',
        category,
        totalPosts: posts.length,
        status: 'processing',
        optimizations: {
          batchSize: posts.length,
          batchDelay: '0ms',
          backgroundProcessing: true,
          earlyResponse: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ IMAGE PROMPT GENERATION ERROR:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});