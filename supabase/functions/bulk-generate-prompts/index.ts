import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface BatchRequest {
  postId: string;
  aspectRatio: string;
}

interface BulkPromptRequest { 
  requests: BatchRequest[];
  themeId: string;
  batchSize: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    )

    const { requests, themeId, batchSize }: BulkPromptRequest = await req.json();

    if (!requests?.length || !themeId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: requests and themeId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🚀 Processing batch of ${requests.length} prompts for theme ${themeId}`);

    // Get theme details for context
    const { data: theme } = await supabaseClient
      .from('themes')
      .select('theme_name, description, category')
      .eq('id', themeId)
      .single();

    if (!theme) {
      return new Response(
        JSON.stringify({ error: 'Theme not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get post details for all requests in one query
    const { data: posts } = await supabaseClient
      .from('social_media_posts')
      .select('id, title, description, day')
      .in('id', requests.map(r => r.postId));

    if (!posts?.length) {
      return new Response(
        JSON.stringify({ error: 'No posts found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process requests in parallel with controlled concurrency
    const BATCH_SIZE = Math.min(5, requests.length); // Process 5 at a time
    const results = [];

    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const batch = requests.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (request) => {
        const post = posts.find(p => p.id === request.postId);
        if (!post) {
          return {
            postId: request.postId,
            prompt: '',
            error: 'Post not found'
          };
        }

        try {
          // Generate optimized prompt using OpenAI
          const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: `You are an expert visual content creator for ${theme.category} industry. 
                  Create detailed, professional image generation prompts that will produce high-quality visuals.
                  
                  Theme Context: ${theme.theme_name} - ${theme.description}
                  Aspect Ratio: ${request.aspectRatio}
                  
                  Guidelines:
                  - Create professional, industry-appropriate visuals
                  - Use modern, clean aesthetics
                  - Include appropriate ${theme.category} context
                  - Optimize for ${request.aspectRatio} composition
                  - Avoid text overlays in the image
                  - Focus on visual storytelling`
                },
                {
                  role: 'user',
                  content: `Create a visual prompt for:
                  Title: ${post.title}
                  Description: ${post.description}
                  Day: ${post.day || 'N/A'}
                  
                  Make it specific to ${theme.category} industry and optimized for ${request.aspectRatio} format.`
                }
              ],
              max_tokens: 500,
              temperature: 0.7
            }),
          });

          if (!openAIResponse.ok) {
            throw new Error(`OpenAI API error: ${openAIResponse.status}`);
          }

          const openAIData = await openAIResponse.json();
          const generatedPrompt = openAIData.choices[0]?.message?.content;

          if (!generatedPrompt) {
            throw new Error('No prompt generated');
          }

          return {
            postId: request.postId,
            prompt: generatedPrompt.trim(),
            success: true
          };

        } catch (error) {
          console.error(`❌ Error generating prompt for post ${request.postId}:`, error);
          return {
            postId: request.postId,
            prompt: '',
            error: error.message,
            success: false
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to prevent rate limiting
      if (i + BATCH_SIZE < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    console.log(`✅ Batch complete: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        results,
        metadata: {
          theme: theme.theme_name,
          category: theme.category,
          totalRequests: requests.length,
          successCount,
          failCount,
          processingTime: Date.now()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Bulk prompt generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});