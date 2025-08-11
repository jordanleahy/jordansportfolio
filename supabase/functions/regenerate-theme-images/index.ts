import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegenerateRequest {
  themeName: string;
  aspectRatio?: '1:1' | '16:9' | 'both';
}

interface RegenerateResponse {
  success: boolean;
  message: string;
  results?: {
    promptsGenerated: boolean;
    imagesGenerated: { total: number; successful: number; failed: number };
    posts: { id: string; title: string; day: number; status: string }[];
  };
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { themeName, aspectRatio = 'both' }: RegenerateRequest = await req.json();

    if (!themeName) {
      throw new Error('Theme name is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the theme
    const { data: theme, error: themeError } = await supabase
      .from('themes')
      .select('id, user_id, category')
      .eq('theme_name', themeName)
      .single();

    if (themeError || !theme) {
      throw new Error(`Theme "${themeName}" not found: ${themeError?.message}`);
    }

    console.log('🎯 Found theme:', theme.id, 'category:', theme.category, 'user:', theme.user_id);

    // Step 1: Regenerate image prompts
    console.log('📝 Step 1: Regenerating image prompts...');
    const promptResponse = await supabase.functions.invoke('ensure-post-image-prompts', {
      body: {
        category: theme.category,
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
      .select('id, title, day, image_1_1_status, image_16_9_status')
      .eq('theme_id', theme.id)
      .order('day');

    if (postsError) {
      throw new Error(`Failed to get posts: ${postsError.message}`);
    }

    console.log(`🎨 Step 2: Regenerating images for ${posts.length} posts (${aspectRatio})...`);

    // Step 3: Generate images based on aspect ratio preference
    const shouldGenerate1x1 = aspectRatio === '1:1' || aspectRatio === 'both';
    const shouldGenerate16x9 = aspectRatio === '16:9' || aspectRatio === 'both';
    
    const totalImages = posts.length * (shouldGenerate1x1 ? 1 : 0) + posts.length * (shouldGenerate16x9 ? 1 : 0);
    
    const imageResults = {
      total: totalImages,
      successful: 0,
      failed: 0
    };

    const postResults = [];

    for (const post of posts) {
      console.log(`🖼️ Processing Day ${post.day}: ${post.title}`);
      
      const postResult = {
        id: post.id,
        title: post.title,
        day: post.day,
        status: 'processing'
      };

      // Generate 1:1 image if requested
      if (shouldGenerate1x1) {
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
      }

      // Generate 16:9 image if requested
      if (shouldGenerate16x9) {
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
      }

      postResult.status = 'completed';
      postResults.push(postResult);

      // Small delay between posts to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const response: RegenerateResponse = {
      success: true,
      message: `Regenerated images for "${themeName}" theme`,
      results: {
        promptsGenerated,
        imagesGenerated: imageResults,
        posts: postResults
      }
    };

    console.log('🎉 Image regeneration completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in regenerate-theme-images:', error);
    
    const errorResponse: RegenerateResponse = {
      success: false,
      message: 'Failed to regenerate images',
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});