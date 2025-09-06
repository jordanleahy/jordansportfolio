import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkDeleteRequest {
  themeIds: string[];
  categories: string[];
}

interface DeleteResult {
  themeId: string;
  category: string;
  success: boolean;
  error?: string;
  postsDeleted?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { themeIds, categories }: BulkDeleteRequest = await req.json();

    if (!Array.isArray(themeIds) || !Array.isArray(categories) || themeIds.length !== categories.length) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: themeIds and categories must be arrays of equal length' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate batch size (max 10 at a time for safety)
    if (themeIds.length > 10) {
      return new Response(
        JSON.stringify({ error: 'Batch size too large. Maximum 10 themes per request.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing bulk delete for user ${user.id}: ${themeIds.length} themes`);

    const results: DeleteResult[] = [];
    let totalPostsDeleted = 0;

    // Process each theme deletion
    for (let i = 0; i < themeIds.length; i++) {
      const themeId = themeIds[i];
      const category = categories[i];
      
      console.log(`Deleting theme ${i + 1}/${themeIds.length}: ${category} (${themeId})`);

      try {
        // First, verify user owns this theme by checking posts
        const { data: posts, error: postsCheckError } = await supabaseClient
          .from('social_media_posts')
          .select('id')
          .eq('user_id', user.id)
          .eq('theme_id', themeId);

        if (postsCheckError) {
          throw new Error(`Failed to verify ownership: ${postsCheckError.message}`);
        }

        if (!posts || posts.length === 0) {
          results.push({
            themeId,
            category,
            success: false,
            error: 'No posts found for this theme or access denied'
          });
          continue;
        }

        const postCount = posts.length;

        // Start transaction-like deletions
        console.log(`Deleting ${postCount} posts for category: ${category}`);

        // Delete social media posts first
        const { error: postsError } = await supabaseClient
          .from('social_media_posts')
          .delete()
          .eq('theme_id', themeId)
          .eq('user_id', user.id);

        if (postsError) {
          throw new Error(`Failed to delete posts: ${postsError.message}`);
        }

        // Delete the theme itself
        const { error: themeError } = await supabaseClient
          .from('themes')
          .delete()
          .eq('id', themeId)
          .eq('user_id', user.id);

        if (themeError) {
          console.warn(`Warning: Failed to delete theme for ${category}:`, themeError.message);
        }

        results.push({
          themeId,
          category,
          success: true,
          postsDeleted: postCount
        });

        totalPostsDeleted += postCount;
        console.log(`Successfully deleted theme: ${category} (${postCount} posts)`);

      } catch (error) {
        console.error(`Error deleting theme ${category}:`, error);
        results.push({
          themeId,
          category,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    console.log(`Bulk delete completed: ${successCount} successful, ${errorCount} errors, ${totalPostsDeleted} total posts deleted`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          totalRequested: themeIds.length,
          successful: successCount,
          failed: errorCount,
          totalPostsDeleted
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Bulk delete error:', error);
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