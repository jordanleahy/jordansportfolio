import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FixResponse {
  success: boolean;
  message: string;
  results?: {
    promptsGenerated: boolean;
    imagesGenerated: { total: number; successful: number; failed: number };
  };
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the theme ID for "Bounce And Buoyancy Exploration"
    const { data: theme, error: themeError } = await supabase
      .from('themes')
      .select('id, user_id')
      .eq('theme_name', 'Bounce And Buoyancy Exploration')
      .single();

    if (themeError || !theme) {
      throw new Error(`Theme not found: ${themeError?.message}`);
    }

    console.log('🎯 Found theme:', theme.id, 'for user:', theme.user_id);

    // Step 1: Regenerate image prompts with correct system prompt
    console.log('📝 Step 1: Regenerating image prompts...');
    const promptResponse = await supabase.functions.invoke('ensure-post-image-prompts', {
      body: {
        category: 'bounce-buoyancy-exploration',
        userId: theme.user_id
      }
    });

    let promptsGenerated = false;
    if (promptResponse.error) {
      console.error('❌ Failed to generate prompts:', promptResponse.error);
    } else {
      console.log('✅ Prompts generated successfully');
      promptsGenerated = true;
    }

    // Step 2: Get all posts for this theme
    const { data: posts, error: postsError } = await supabase
      .from('social_media_posts')
      .select('id, title, day')
      .eq('theme_id', theme.id)
      .order('day');

    if (postsError) {
      throw new Error(`Failed to get posts: ${postsError.message}`);
    }

    console.log(`🎨 Step 2: Generating images for ${posts.length} posts...`);

    // Step 3: Generate both 1:1 and 16:9 images for each post
    const imageResults = {
      total: posts.length * 2, // Both 1:1 and 16:9 for each post
      successful: 0,
      failed: 0
    };

    for (const post of posts) {
      console.log(`🖼️ Generating images for Day ${post.day}: ${post.title}`);
      
      // Generate 1:1 image
      try {
        const image1x1Response = await supabase.functions.invoke('generate-day-1-1-1', {
          body: {
            themeId: theme.id,
            userId: theme.user_id,
            postId: post.id
          }
        });

        if (image1x1Response.error) {
          console.error(`❌ Failed 1:1 image for post ${post.id}:`, image1x1Response.error);
          imageResults.failed++;
        } else {
          console.log(`✅ Generated 1:1 image for post ${post.id}`);
          imageResults.successful++;
        }
      } catch (error) {
        console.error(`❌ Error generating 1:1 image for post ${post.id}:`, error);
        imageResults.failed++;
      }

      // Generate 16:9 image
      try {
        const image16x9Response = await supabase.functions.invoke('generate-day-1-4-3', {
          body: {
            themeId: theme.id,
            userId: theme.user_id,
            postId: post.id,
            aspectRatio: '16:9'
          }
        });

        if (image16x9Response.error) {
          console.error(`❌ Failed 16:9 image for post ${post.id}:`, image16x9Response.error);
          imageResults.failed++;
        } else {
          console.log(`✅ Generated 16:9 image for post ${post.id}`);
          imageResults.successful++;
        }
      } catch (error) {
        console.error(`❌ Error generating 16:9 image for post ${post.id}:`, error);
        imageResults.failed++;
      }

      // Small delay between posts to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const response: FixResponse = {
      success: true,
      message: `Fixed images for Bounce And Buoyancy Exploration theme`,
      results: {
        promptsGenerated,
        imagesGenerated: imageResults
      }
    };

    console.log('🎉 Image fix completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in fix-bounce-buoyancy-images:', error);
    
    const errorResponse: FixResponse = {
      success: false,
      message: 'Failed to fix images',
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});