
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
 * - Success: { success: true, category: string, totalPosts: number, successCount: number, errorCount: number, results: array }
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
 * 4. For each post, generate detailed image prompt using OpenAI
 * 5. Update posts with generated prompts and timestamp
 * 6. Return processing summary with success/error counts and details
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
    
    const { category, userId } = await req.json();

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

    console.log(`📋 ENSURE PROMPTS REQUEST: Category: ${category}, User: ${userId}`);

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Step 1: Get all posts in the category that need image prompts
    console.log('🔍 STEP 1: Fetching posts without image prompts');
    const { data: posts, error: postsError } = await supabase
      .from('social_media_posts')
      .select('id, title, description, category')
      .eq('category', category)
      .eq('user_id', userId)
      .is('generated_image_prompt', null);

    if (postsError) {
      console.error('❌ ERROR FETCHING POSTS:', postsError);
      throw new Error(`Failed to fetch posts: ${postsError.message}`);
    }

    if (!posts || posts.length === 0) {
      console.log('✅ NO POSTS NEED PROMPTS: All posts already have image prompts');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No posts need image prompts',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 FOUND ${posts.length} POSTS: Need image prompt generation`);

    // Step 2: Get the system prompt for this category (most recent active for this user)
    console.log('🔍 STEP 2: Fetching system prompt for category');
    const { data: systemPromptData, error: promptError } = await supabase
      .from('system_prompts')
      .select('prompt_text')
      .eq('user_id', userId)
      .eq('category', category)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (promptError || !systemPromptData) {
      console.error(`❌ ERROR: No system prompt found for category: ${category}`, promptError);
      throw new Error(`No system prompt found for category: ${category}`);
    }

    console.log(`✅ SYSTEM PROMPT FOUND: Category: ${category}, Prompt length: ${systemPromptData.prompt_text.length}`);

    // Step 3: Generate image prompts for each post
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    console.log('🎨 STEP 3: Starting image prompt generation for posts');

    for (const post of posts) {
      try {
        console.log(`🎯 GENERATING PROMPT: Post "${post.title}" (${post.id})`);

        // Use internal edge function to generate prompts consistently
        const { data: promptResp, error: promptFnError } = await supabase.functions.invoke('generate-image-prompt-dynamic', {
          body: {
            title: post.title,
            description: post.description,
            category: post.category,
            aspectRatio: '16:9'
          }
        });

        if (promptFnError) {
          console.error(`❌ PROMPT FUNCTION ERROR for post ${post.id}:`, promptFnError);
          errorCount++;
          results.push({ postId: post.id, success: false, error: promptFnError.message });
          continue;
        }

        const generatedPrompt = promptResp?.generatedPrompt;

        if (!generatedPrompt) {
          console.error(`❌ NO PROMPT GENERATED for post ${post.id}`);
          errorCount++;
          results.push({ postId: post.id, success: false, error: 'No prompt generated' });
          continue;
        }

        // Step 4: Update the post with the generated prompt
        const { error: updateError } = await supabase
          .from('social_media_posts')
          .update({ 
            generated_image_prompt: generatedPrompt.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);

        if (updateError) {
          console.error(`❌ UPDATE ERROR for post ${post.id}:`, updateError);
          errorCount++;
          results.push({ postId: post.id, success: false, error: updateError.message });
        } else {
          console.log(`✅ PROMPT GENERATED and SAVED: Post ${post.id}`);
          successCount++;
          results.push({ 
            postId: post.id, 
            success: true, 
            promptLength: generatedPrompt.length 
          });
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ UNEXPECTED ERROR for post ${post.id}:`, error);
        errorCount++;
        results.push({ postId: post.id, success: false, error: error.message });
      }
    }

    // Step 5: Log final results
    console.log(`📈 IMAGE PROMPT GENERATION COMPLETE: {
  category: "${category}",
  totalPosts: ${posts.length},
  successCount: ${successCount},
  errorCount: ${errorCount},
  successRate: ${((successCount / posts.length) * 100).toFixed(1)}%
}`);

    return new Response(
      JSON.stringify({
        success: true,
        category,
        totalPosts: posts.length,
        successCount,
        errorCount,
        results,
        message: `Generated image prompts for ${successCount} out of ${posts.length} posts`
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
