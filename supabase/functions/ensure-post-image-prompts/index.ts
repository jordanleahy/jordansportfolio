/**
 * EDGE FUNCTION: Ensure Post Image Prompts
 * 
 * PURPOSE:
 * Automatically generates image prompts for social media posts that are missing them.
 * Batch processes posts by category using the Visual Prompt Generator agent and category-specific
 * system prompts to create professional, consistent image generation prompts.
 * 
 * INPUTS:
 * - category: string - Category of posts to process (e.g., 'coding ai', 'healthcare', 'contracts')
 * - userId: string - User ID to filter posts and find appropriate agent
 * 
 * OUTPUTS:
 * - Success: { success: true, category: string, totalPosts: number, status: 'processing' }
 * - Error: { error: string }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-4o-mini for prompt generation)
 * - Supabase Database (social_media_posts, openai_agents, system_prompts tables)
 * 
 * USAGE:
 * Called from: Content management workflows, bulk processing operations
 * Authentication: Service role access for batch operations
 * 
 * FLOW:
 * 1. Fetch all posts in specified category that lack image prompts
 * 2. Find user's Visual Prompt Generator agent
 * 3. Retrieve category-specific system prompt from system_prompts table
 * 4. Return immediate response and process in background using EdgeRuntime.waitUntil()
 * 5. For each post, generate detailed image prompt using OpenAI
 * 6. Update posts with generated prompts and timestamp
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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

    // Step 2: Cache system prompt for efficiency (avoid repeated queries)
    console.log('🔍 STEP 2: Caching system prompt for batch processing');
    let cachedSystemPrompt = null;
    
    // Try to get system prompt from theme data first (if available)
    const firstPost = posts[0];
    if (firstPost?.themes?.visual_prompt_system_prompt_id) {
      const { data: systemPromptData, error: promptError } = await supabase
        .from('theme_system_prompts')
        .select('id, agent_name, prompt_text')
        .eq('id', firstPost.themes.visual_prompt_system_prompt_id)
        .eq('is_active', true)
        .single();
      
      if (systemPromptData && !promptError) {
        cachedSystemPrompt = systemPromptData;
        console.log(`✅ CACHED SYSTEM PROMPT: ${systemPromptData.agent_name}, length: ${systemPromptData.prompt_text.length}`);
      }
    }
    
    // Fallback to user's most recent Visual Prompt Generator if no theme-specific prompt
    if (!cachedSystemPrompt) {
      const { data: systemPromptData, error: promptError } = await supabase
        .from('theme_system_prompts')
        .select('id, agent_name, prompt_text')
        .eq('user_id', userId)
        .eq('agent_name', 'Visual Prompt Generator')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (promptError || !systemPromptData) {
        console.error(`❌ ERROR: No system prompt found for user`);
        throw new Error(`No system prompt found for user`);
      }
      
      cachedSystemPrompt = systemPromptData;
      console.log(`✅ FALLBACK SYSTEM PROMPT: ${systemPromptData.agent_name}, length: ${systemPromptData.prompt_text.length}`);
    }

    // Step 3: Return early response and process in background
    console.log('🚀 STEP 3: Starting background image prompt generation');
    console.log(`📊 Processing ${posts.length} posts with optimized batch processing`);

    // Background processing function with improved error handling
    const processImagePromptsInBackground = async () => {
      let successCount = 0;
      let errorCount = 0;
      const results = [];
      const BATCH_SIZE = posts.length; // Process all posts in single batch for maximum speed
      const BATCH_DELAY_MS = 0; // No delay between batches for faster processing

      console.log(`🔄 BACKGROUND: Processing ${posts.length} posts in batches of ${BATCH_SIZE}`);

      try {
        // Process posts in smaller batches to prevent timeout
        for (let i = 0; i < posts.length; i += BATCH_SIZE) {
          const batch = posts.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(posts.length / BATCH_SIZE);
          
          console.log(`🔄 BACKGROUND BATCH ${batchNum}/${totalBatches}: Processing ${batch.length} posts`);

          // Process batch with parallel processing and improved error handling
          const batchPromises = batch.map(async (post, index) => {
            try {
              console.log(`🎯 BACKGROUND: Generating prompt for "${post.title}" (${post.id})`);

              // Use internal edge function to generate prompts consistently with retry logic
              const invokePayload = {
                postId: post.id,
                themeId: post.theme_id,
                aspectRatio: '1:1'
              };
              
              let promptResp = null;
              let promptFnError = null;
              const maxRetries = 2; // Reduced retries to prevent excessive delays
              
              for (let attempt = 1; attempt <= maxRetries; attempt++) {
                const result = await supabase.functions.invoke('create-single-image-prompt', {
                  body: invokePayload
                });
                
                promptResp = result.data;
                promptFnError = result.error;
                
                if (!promptFnError) {
                  break; // Success, exit retry loop
                }
                
                // Check if it's a retryable error (503, timeout, etc.)
                const isRetryable = promptFnError.message?.includes('Service Unavailable') || 
                                   promptFnError.message?.includes('503') ||
                                   promptFnError.message?.includes('timeout');
                
                if (!isRetryable || attempt === maxRetries) {
                  console.error(`❌ BACKGROUND: Prompt function error for post ${post.id} (attempt ${attempt}/${maxRetries}):`, promptFnError);
                  break;
                }
                
                console.log(`⏳ BACKGROUND: Retrying post ${post.id} (attempt ${attempt + 1}/${maxRetries}) in 1s...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }

              if (promptFnError) {
                return { postId: post.id, success: false, error: promptFnError.message };
              }

              const generatedPrompt = promptResp?.generatedPrompt;

              if (!generatedPrompt) {
                console.error(`❌ BACKGROUND: No prompt generated for post ${post.id}`);
                return { postId: post.id, success: false, error: 'No prompt generated' };
              }

              // ✅ Database is already updated atomically by create-single-image-prompt
              console.log(`✅ BACKGROUND: Prompt generated and saved for post ${post.id}`);
              return {
                  postId: post.id, 
                  success: true, 
                  promptLength: generatedPrompt.length 
                };
              }

            } catch (error) {
              console.error(`❌ BACKGROUND: Unexpected error for post ${post.id}:`, error);
              return { postId: post.id, success: false, error: error.message };
            }
          });

          // Wait for all posts in the batch to complete
          const batchResults = await Promise.allSettled(batchPromises);
          
          // Process batch results
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
              results.push(result.value);
              if (result.value.success) {
                successCount++;
              } else {
                errorCount++;
              }
            } else {
              const post = batch[index];
              console.error(`❌ BACKGROUND: Batch promise failed for post ${post.id}:`, result.reason);
              errorCount++;
              results.push({ 
                postId: post.id, 
                success: false, 
                error: result.reason?.message || 'Promise rejected' 
              });
            }
          });

          // Log batch completion with more details
          const successfulInBatch = batchResults.filter(r => r.status === 'fulfilled' && r.value?.success).length;
          console.log(`✅ BACKGROUND BATCH ${batchNum}/${totalBatches} completed: ${successfulInBatch}/${batch.length} successful`);

          // Process next batch immediately for faster completion
          if (i + BATCH_SIZE < posts.length && BATCH_DELAY_MS > 0) {
            console.log(`⏱️ BACKGROUND: Waiting ${BATCH_DELAY_MS}ms before next batch...`);
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
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