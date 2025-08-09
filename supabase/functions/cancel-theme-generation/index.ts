import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the authorization header and extract the JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the JWT and get user
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    console.log(`🛑 Cancellation request from user: ${user.id}`)

    // Find any pending theme submissions for this user
    const { data: submissions, error: submissionsError } = await supabase
      .from('theme_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError)
      throw new Error('Failed to fetch submissions')
    }

    console.log(`Found ${submissions?.length || 0} pending submissions`)

    let cancelledCount = 0
    let errors: string[] = []

    if (submissions && submissions.length > 0) {
      // Mark submissions as cancelled
      for (const submission of submissions) {
        try {
          const { error: updateError } = await supabase
            .from('theme_submissions')
            .update({
              status: 'cancelled',
              error_message: 'Cancelled by user',
              completed_at: new Date().toISOString()
            })
            .eq('id', submission.id)

          if (updateError) {
            errors.push(`Failed to cancel submission ${submission.id}: ${updateError.message}`)
            console.error('Update error:', updateError)
          } else {
            cancelledCount++
            console.log(`✅ Cancelled submission: ${submission.id}`)
          }
        } catch (error) {
          errors.push(`Error cancelling submission ${submission.id}: ${error.message}`)
          console.error('Submission cancellation error:', error)
        }
      }
    }

    // Also clean up any temporary pending posts that might have been created
    try {
      const { data: pendingPosts, error: postsError } = await supabase
        .from('social_media_posts')
        .select('id, theme_id')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .is('theme_id', null)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!postsError && pendingPosts && pendingPosts.length > 0) {
        const { error: deleteError } = await supabase
          .from('social_media_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('status', 'draft')
          .is('theme_id', null)

        if (deleteError) {
          console.warn('Failed to clean up pending posts:', deleteError)
        } else {
          console.log(`🧹 Cleaned up ${pendingPosts.length} pending posts`)
        }
      }
    } catch (error) {
      console.warn('Error cleaning up pending posts:', error)
    }

    const response = {
      success: true,
      cancelled_count: cancelledCount,
      message: cancelledCount > 0 
        ? `Successfully cancelled ${cancelledCount} pending theme generation${cancelledCount > 1 ? 's' : ''}`
        : 'No pending theme generations found to cancel',
      errors: errors.length > 0 ? errors : undefined
    }

    console.log('✅ Cancellation response:', response)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Cancel theme generation error:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to cancel theme generation'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})