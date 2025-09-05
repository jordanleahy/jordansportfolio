import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { blogPostId, sectionIndex = null, aspectRatio = '1:1' } = await req.json();

    if (!blogPostId) {
      return new Response(JSON.stringify({ error: 'Missing blogPostId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Init Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the blog post
    const { data: blogPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, category, visual_sections')
      .eq('id', blogPostId)
      .single();

    if (fetchError || !blogPost) {
      return new Response(JSON.stringify({ error: fetchError?.message || 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to generating immediately
    await supabase
      .from('blog_posts')
      .update({ image_generation_status: 'generating', updated_at: new Date().toISOString() })
      .eq('id', blogPostId);

    // Background task
    const task = async () => {
      try {
        const visualSections: any[] = blogPost.visual_sections || [];
        const indicesToProcess: number[] =
          sectionIndex === null || sectionIndex === undefined
            ? visualSections.map((_, i) => i)
            : [Number(sectionIndex)];

        const updatedSections = [...visualSections];
        const generatedPrompts: string[] = [];
        let hasUpdates = false;

        for (let i = 0; i < indicesToProcess.length; i++) {
          const idx = indicesToProcess[i];
          const section = visualSections[idx];
          if (!section) continue;

          try {
            // Step 1: Use create-single-image-prompt for blog visuals
            const promptRequestText = `Create a detailed image generation prompt for a blog section with the headline "${section.headline}" and content: "${section.content}". The blog is in the ${blogPost.category} category. Generate a professional, engaging visual prompt for ${aspectRatio} aspect ratio.`;
            
            const { data: promptData, error: promptError } = await supabase.functions.invoke('create-single-image-prompt', {
              body: {
                postId: blogPost.id,
                themeId: blogPost.theme || blogPost.category,
                aspectRatio: aspectRatio,
                content: promptRequestText
              }
            });
            if (promptError || !promptData?.prompt) {
              console.error(`Prompt generation failed for section ${idx + 1}:`, promptError?.message || 'No generated prompt received');
              continue;
            }
            const prompt = promptData.prompt as string;
            generatedPrompts[idx] = prompt;

            // Step 2: Image generation
            const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-image-gpt', {
              body: { prompt, aspectRatio, category: blogPost.category },
            });
            if (imageError || !imageData?.image) {
              console.warn(`Image generation failed for section ${idx + 1}:`, imageError?.message);
              continue;
            }
            const imageB64 = imageData.image as string;

            // Step 3: Upload to storage
            const base64Data = imageB64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            const fileName = `blog_${blogPostId}_section_${idx + 1}_${Date.now()}.jpg`;
            const filePath = `visual-sections/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('blog-images')
              .upload(filePath, buffer, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false,
              });
            if (uploadError) {
              console.error(`Upload failed for section ${idx + 1}:`, uploadError);
              continue;
            }

            const { data: publicUrlData } = supabase.storage
              .from('blog-images')
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              updatedSections[idx] = { ...section, image_url: publicUrlData.publicUrl };
              hasUpdates = true;
            }

            // polite delay between sections
            if (i < indicesToProcess.length - 1) {
              await new Promise((r) => setTimeout(r, 1500));
            }
          } catch (innerErr) {
            console.error(`Error processing section ${idx + 1}:`, innerErr);
          }
        }

        const finalStatus = hasUpdates ? 'completed' : 'failed';
        const updateData: any = {
          image_generation_status: finalStatus,
          updated_at: new Date().toISOString(),
        };
        if (hasUpdates) updateData.visual_sections = updatedSections;
        updateData.visual_section_prompts = generatedPrompts;

        await supabase
          .from('blog_posts')
          .update(updateData)
          .eq('id', blogPostId);
      } catch (e) {
        console.error('Regeneration task failed:', e);
        await supabase
          .from('blog_posts')
          .update({ image_generation_status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', blogPostId);
      }
    };

    // Run in background
    // deno-lint-ignore no-explicit-any
    const anyGlobal: any = globalThis as any;
    if (anyGlobal.EdgeRuntime && anyGlobal.EdgeRuntime.waitUntil) {
      anyGlobal.EdgeRuntime.waitUntil(task());
    } else {
      task();
    }

    return new Response(
      JSON.stringify({ started: true, message: 'Image regeneration started' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in regenerate-blog-visuals:', error);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
