import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

interface CleanPromptsRequest {
  themeId?: string;
  postIds?: string[];
  dryRun?: boolean;
}

interface CleanedPrompt {
  postId: string;
  originalPrompt: string;
  cleanedPrompt: string;
  noiseRemoved: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

// Generate correlation ID for request tracking
const generateCorrelationId = () => {
  return `clean-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Function to detect and remove noise from prompts
const cleanPrompt = (prompt: string): { cleaned: string; noise: string[] } => {
  if (!prompt) return { cleaned: '', noise: [] };
  
  const noisePatterns = [
    // ABC contamination
    /ABC\s+Create\s+a\s+[^.]*?\./gi,
    /ABC\s+book\s+focused\s+[^.]*?\./gi,
    /Peppa's\s+Table\s+Manners\s+ABCs/gi,
    /A\s+playful\s+ABC\s+series[^.]*?\./gi,
    /Each\s+card\s+highlights[^.]*?\./gi,
    
    // ChatGPT artifacts
    /ChatGPT\s+said:/gi,
    /Thought\s+for\s+\d+s/gi,
    /\{\s*"category"[^}]*\}/gi,
    
    // Branding text that appears literally
    /-\s*[^-]*ABCs?\s*/gi,
    /focused\s+(solely\s+)?on\s+/gi,
    /perfect\s+for\s+young\s+learners/gi,
    /preschoolers/gi,
    /families\s+can\s+practice/gi,
    
    // Duplicate instructions
    /Create\s+a\s+/gi,
    /Generate\s+/gi,
    /themed\s+illustration\s+showing\s+themed\s+illustration/gi
  ];
  
  let cleaned = prompt;
  const removedNoise: string[] = [];
  
  // Remove noise patterns
  noisePatterns.forEach(pattern => {
    const matches = cleaned.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!removedNoise.includes(match.trim())) {
          removedNoise.push(match.trim());
        }
      });
      cleaned = cleaned.replace(pattern, ' ');
    }
  });
  
  // Clean up extra spaces and formatting
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*,\s*/g, ', ')
    .replace(/\s*\.\s*\.\s*/g, '. ')
    .replace(/^\s*,\s*/, '')
    .replace(/\s*,\s*$/, '')
    .trim();
  
  // Ensure it starts with letter instruction if it had one
  if (prompt.includes('CRITICAL: Place a large, bold letter') && !cleaned.includes('CRITICAL: Place a large, bold letter')) {
    const letterMatch = prompt.match(/CRITICAL: Place a large, bold letter '([A-Z])'/);
    const textMatch = prompt.match(/"([A-Z]) is for ([^"]+)"/);
    if (letterMatch) {
      const letter = letterMatch[1];
      const word = textMatch ? textMatch[2] : 'Word';
      cleaned = `CRITICAL: Place a large, bold letter '${letter}' in the top-left corner of the image and include the text "${letter} is for ${word}" prominently displayed. ${cleaned}`;
    }
  }
  
  return { cleaned, noise: removedNoise };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = generateCorrelationId();
  console.log(`🧹 [${correlationId}] Prompt cleaning started`);

  try {
    // Initialize Supabase clients
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const userSupabase = createClient(
      supabaseUrl!,
      supabaseAnonKey!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      console.error(`❌ [${correlationId}] Authentication failed:`, authError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { themeId, postIds, dryRun = false }: CleanPromptsRequest = await req.json();

    if (!themeId && (!postIds || postIds.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Theme ID or post IDs are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📝 [${correlationId}] Fetching posts for cleaning...`);

    // Fetch posts to clean
    let query = supabase
      .from('social_media_posts')
      .select('id, title, generated_image_prompt')
      .eq('user_id', user.id)
      .not('generated_image_prompt', 'is', null);

    if (themeId) {
      query = query.eq('theme_id', themeId);
    } else if (postIds) {
      query = query.in('id', postIds);
    }

    const { data: posts, error: fetchError } = await query;

    if (fetchError) {
      console.error(`❌ [${correlationId}] Failed to fetch posts:`, fetchError);
      throw new Error(`Failed to fetch posts: ${fetchError.message}`);
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No posts with prompts found to clean',
          cleanedPrompts: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 [${correlationId}] Analyzing ${posts.length} posts for noise...`);

    // Clean prompts
    const cleanedPrompts: CleanedPrompt[] = [];
    const updatePromises: Promise<any>[] = [];

    for (const post of posts) {
      const { cleaned, noise } = cleanPrompt(post.generated_image_prompt);
      
      // Only include if noise was actually removed
      if (noise.length > 0 && cleaned !== post.generated_image_prompt) {
        cleanedPrompts.push({
          postId: post.id,
          originalPrompt: post.generated_image_prompt,
          cleanedPrompt: cleaned,
          noiseRemoved: noise
        });

        // Update in database if not dry run
        if (!dryRun) {
          updatePromises.push(
            supabase
              .from('social_media_posts')
              .update({ 
                generated_image_prompt: cleaned,
                updated_at: new Date().toISOString()
              })
              .eq('id', post.id)
          );
        }
      }
    }

    // Execute updates if not dry run
    if (!dryRun && updatePromises.length > 0) {
      console.log(`💾 [${correlationId}] Updating ${updatePromises.length} cleaned prompts...`);
      await Promise.all(updatePromises);
    }

    const summary = {
      totalPostsAnalyzed: posts.length,
      promptsCleaned: cleanedPrompts.length,
      totalNoiseRemoved: cleanedPrompts.reduce((sum, p) => sum + p.noiseRemoved.length, 0),
      dryRun
    };

    console.log(`✅ [${correlationId}] Cleaning completed:`, summary);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        cleanedPrompts,
        message: dryRun 
          ? `Analysis complete: ${cleanedPrompts.length} prompts can be cleaned`
          : `Successfully cleaned ${cleanedPrompts.length} prompts`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ [${correlationId}] Prompt cleaning error:`, error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to clean prompts', 
        details: error.message,
        correlation_id: correlationId
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});