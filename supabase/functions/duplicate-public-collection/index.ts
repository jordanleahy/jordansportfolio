import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DuplicationRequest {
  theme_id: string;
}

interface ImageFile {
  url: string;
  aspect_ratio: string;
  field_name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { theme_id }: DuplicationRequest = await req.json();

    if (!theme_id) {
      return new Response(JSON.stringify({ error: 'theme_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting duplication of theme ${theme_id} for user ${user.id}`);

    // Fetch the original theme
    const { data: originalTheme, error: themeError } = await supabaseClient
      .from('themes')
      .select('*')
      .eq('id', theme_id)
      .single();

    if (themeError || !originalTheme) {
      return new Response(JSON.stringify({ error: 'Theme not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already has a theme with this name
    let newThemeName = originalTheme.theme_name;
    const { data: existingThemes } = await supabaseClient
      .from('themes')
      .select('theme_name')
      .eq('user_id', user.id)
      .like('theme_name', `${originalTheme.theme_name}%`);

    if (existingThemes && existingThemes.length > 0) {
      const existingNames = existingThemes.map(t => t.theme_name);
      let counter = 1;
      while (existingNames.includes(newThemeName)) {
        newThemeName = `${originalTheme.theme_name} (Copy ${counter})`;
        counter++;
      }
    }

    // Create new theme
    const { data: newTheme, error: newThemeError } = await supabaseClient
      .from('themes')
      .insert([{
        user_id: user.id,
        theme_name: newThemeName,
        description: originalTheme.description,
        category: originalTheme.category,
      }])
      .select()
      .single();

    if (newThemeError) throw newThemeError;

    console.log(`Created new theme: ${newTheme.id}`);

    // Fetch all posts for the original theme
    const { data: originalPosts, error: postsError } = await supabaseClient
      .from('social_media_posts')
      .select('*')
      .eq('theme_id', theme_id)
      .order('day', { ascending: true });

    if (postsError) throw postsError;

    console.log(`Found ${originalPosts?.length || 0} posts to duplicate`);

    const duplicatedPosts = [];
    
    for (const post of originalPosts || []) {
      // Collect all image URLs that need to be duplicated
      const imageFiles: ImageFile[] = [];
      
      const aspectRatios = ['image_url', 'image_16_9_url', 'image_1_1_url', 'image_3_4_url', 'image_4_3_url', 'image_9_16_url'];
      
      for (const field of aspectRatios) {
        if (post[field]) {
          const aspectRatio = field.replace('image_', '').replace('_url', '') || 'original';
          imageFiles.push({
            url: post[field],
            aspect_ratio: aspectRatio,
            field_name: field
          });
        }
      }

      // Duplicate each image file
      const newImageUrls: { [key: string]: string } = {};
      
      for (const imageFile of imageFiles) {
        try {
          console.log(`Downloading image: ${imageFile.url}`);
          
          const response = await fetch(imageFile.url);
          if (!response.ok) {
            console.warn(`Failed to download image: ${imageFile.url}`);
            continue;
          }
          
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Generate unique filename
          const fileExtension = imageFile.url.split('.').pop() || 'jpg';
          const uniqueId = crypto.randomUUID();
          const newFileName = `${imageFile.aspect_ratio}_${uniqueId}.${fileExtension}`;
          const storagePath = `users/${user.id}/duplicated-collections/${newTheme.id}/${newFileName}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('social-media-images')
            .upload(storagePath, uint8Array, {
              contentType: blob.type,
              upsert: false
            });
          
          if (uploadError) {
            console.error(`Upload failed for ${imageFile.url}:`, uploadError);
            continue;
          }
          
          // Get the public URL
          const { data: { publicUrl } } = supabaseClient.storage
            .from('social-media-images')
            .getPublicUrl(storagePath);
          
          newImageUrls[imageFile.field_name] = publicUrl;
          console.log(`Successfully duplicated image: ${imageFile.field_name}`);
          
        } catch (error) {
          console.error(`Error duplicating image ${imageFile.url}:`, error);
        }
      }

      // Create new post with duplicated images
      const newPostData = {
        user_id: user.id,
        theme_id: newTheme.id,
        title: post.title,
        description: post.description,
        category: post.category,
        day: post.day,
        status: 'draft' as const,
        ...newImageUrls, // Spread the new image URLs
      };

      const { data: newPost, error: newPostError } = await supabaseClient
        .from('social_media_posts')
        .insert([newPostData])
        .select()
        .single();

      if (newPostError) {
        console.error('Error creating post:', newPostError);
        continue;
      }

      duplicatedPosts.push(newPost);
      console.log(`Created post: ${newPost.id}`);
    }

    // Duplicate system prompts
    const { data: originalPrompts, error: promptsError } = await supabaseClient
      .from('theme_system_prompts_to_create_image_prompt_via_visual_prompt_a')
      .select('*')
      .or(`agent_name.eq.Theme Generation Agent,category.eq.${originalTheme.category}`);

    if (!promptsError && originalPrompts) {
      for (const prompt of originalPrompts) {
        await supabaseClient
      .from('theme_system_prompts_to_create_image_prompt_via_visual_prompt_a')
          .insert([{
            user_id: user.id,
            category: prompt.category,
            prompt_text: prompt.prompt_text,
            agent_name: prompt.agent_name,
            agent_purpose: prompt.agent_purpose,
            agent_owner: prompt.agent_owner,
            name: prompt.name,
            description: prompt.description,
          }]);
      }
    }

    console.log(`Duplication completed. Created theme: ${newTheme.id} with ${duplicatedPosts.length} posts`);

    return new Response(JSON.stringify({
      success: true,
      theme: newTheme,
      duplicatedPosts: duplicatedPosts.length,
      message: `Successfully saved "${newThemeName}" to your collection with ${duplicatedPosts.length} posts`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Duplication error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to duplicate collection',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});