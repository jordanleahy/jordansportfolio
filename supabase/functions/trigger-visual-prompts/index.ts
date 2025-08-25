import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting visual prompt generation trigger...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending posts that need visual prompts
    const { data: posts, error: postsError } = await supabase
      .from('social_media_posts')
      .select(`
        id, title, description, category,
        themes!inner(theme_name)
      `)
      .eq('individual_prompt_status', 'pending')
      .limit(10);

    if (postsError) {
      throw new Error(`Error fetching posts: ${postsError.message}`);
    }

    console.log(`📝 Found ${posts?.length || 0} posts needing visual prompts`);

    let successCount = 0;
    let errorCount = 0;

    // Process each post
    for (const post of posts || []) {
      try {
        console.log(`🎨 Generating visual prompt for post: ${post.title}`);
        
        // Call visual-prompt-generator
        const { data: promptData, error: promptError } = await supabase.functions.invoke('visual-prompt-generator', {
          body: {
            category: 'book_highlights_visual',
            context: post.description,
            theme: post.themes?.theme_name || 'Book Highlights',
            description: post.title,
            aspect_ratio: '1:1'
          }
        });

        if (promptError) {
          console.error(`❌ Error generating prompt for ${post.id}:`, promptError);
          errorCount++;
          continue;
        }

        if (promptData?.success && promptData?.image_prompt) {
          // Update post with visual prompt
          const { error: updateError } = await supabase
            .from('social_media_posts')
            .update({
              visual_prompt: promptData.image_prompt,
              individual_prompt_status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);

          if (updateError) {
            console.error(`❌ Error updating post ${post.id}:`, updateError);
            errorCount++;
          } else {
            console.log(`✅ Successfully generated prompt for: ${post.title}`);
            successCount++;
          }
        } else {
          console.error(`❌ No prompt generated for ${post.id}`);
          errorCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error);
        errorCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${posts?.length || 0} posts`,
      results: {
        successCount,
        errorCount,
        totalProcessed: successCount + errorCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in trigger-visual-prompts:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});