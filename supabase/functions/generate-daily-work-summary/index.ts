import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🕰️ Daily work summary generation started at:', new Date().toISOString());

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all users who have activity data
    const { data: activeUsers, error: usersError } = await supabase
      .from('social_media_posts')
      .select('user_id')
      .neq('user_id', null)
      .limit(100)

    if (usersError) {
      console.error('❌ Error fetching active users:', usersError)
      throw usersError
    }

    if (!activeUsers || activeUsers.length === 0) {
      console.log('ℹ️ No active users found')
      return new Response('No active users found', { status: 200, headers: corsHeaders })
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(activeUsers.map(u => u.user_id))]
    console.log(`👥 Processing daily summaries for ${uniqueUserIds.length} users`)

    const results = []
    const today = new Date().toISOString().split('T')[0]

    // Process users in parallel batches for better performance
    const BATCH_SIZE = 10
    const userBatches = []
    for (let i = 0; i < uniqueUserIds.length; i += BATCH_SIZE) {
      userBatches.push(uniqueUserIds.slice(i, i + BATCH_SIZE))
    }

    for (const batch of userBatches) {
      const batchPromises = batch.map(async (userId) => {
        try {
          console.log(`📊 Processing user: ${userId}`)

          // Check if summary already exists for today
          const { data: existingSummary } = await supabase
            .from('daily_work_summaries')
            .select('id')
            .eq('user_id', userId)
            .eq('summary_date', today)
            .single()

          if (existingSummary) {
            console.log(`✅ Summary already exists for user ${userId} on ${today}`)
            return { userId, success: true, message: 'Summary already exists' }
          }

        // Get user's activity data for the day
        const { data: posts } = await supabase
          .from('social_media_posts')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', `${today}T00:00:00Z`)
          .lt('created_at', `${new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}T00:00:00Z`)

        // Get Daily Work Summary Agent for this user
        const { data: agent } = await supabase
          .from('openai_agents')
          .select('*')
          .eq('user_id', userId)
          .eq('name', 'Daily Work Summary Agent')
          .eq('status', 'active')
          .single()

          if (!agent) {
            console.log(`⚠️ No Daily Work Summary Agent found for user ${userId}`)
            return { userId, success: false, error: 'No Daily Work Summary Agent found' }
          }

        // Generate summary based on activity
        const activityData = {
          date: today,
          posts_created: posts?.length || 0,
          content_areas: posts ? [...new Set(posts.map(p => p.category))].filter(Boolean) : [],
          total_activity_score: posts?.length || 0
        }

        // Determine category based on activity
        let category = 'productivity' // default
        if (activityData.content_areas.some(area => ['coding ai', 'healthcare', 'contracts'].includes(area))) {
          category = 'technical'
        } else if (activityData.content_areas.some(area => ['design', 'visual'].includes(area))) {
          category = 'creative'
        }

        // Get system prompt for the category
        const systemPrompts = agent.system_prompts as any[] || []
        const categoryPrompt = systemPrompts.find(p => p.category === category)
        
          if (!categoryPrompt) {
            console.log(`⚠️ No system prompt found for category ${category}`)
            return { userId, success: false, error: `No system prompt found for category ${category}` }
          }

        // Generate mock summary data (in real implementation, this would call OpenAI)
        const mockSummary = {
          highlights: [
            `Created ${activityData.posts_created} content pieces`,
            `Worked across ${activityData.content_areas.length} different areas`,
            'Maintained consistent productivity throughout the day'
          ],
          metrics: {
            productivity_score: Math.min(activityData.total_activity_score * 10, 100),
            focus_time: Math.floor(Math.random() * 8) + 1,
            completion_rate: Math.floor(Math.random() * 30) + 70
          },
          insights: [
            'Strong content creation momentum',
            'Consistent work pattern detected',
            'Good cross-functional engagement'
          ],
          recommendations: [
            'Continue current productivity rhythm',
            'Consider scheduling focused deep work blocks',
            'Maintain variety in content areas'
          ]
        }

          // Insert daily work summary with proper column names
          const { data: newSummary, error: insertError } = await supabase
            .from('daily_work_summaries')
            .insert({
              user_id: userId,
              summary_date: today,
              metrics: mockSummary.metrics,
              highlights: mockSummary.highlights,
              insights: mockSummary.insights,
              recommendations: mockSummary.recommendations,
              categories_summary: {
                [category]: {
                  tasks: [`Created ${activityData.posts_created} content pieces`],
                  timeSpent: `${Math.floor(Math.random() * 4) + 2}h`,
                  insights: mockSummary.insights
                }
              },
              productivity_score: mockSummary.metrics.productivity_score,
              generated_summary: `Daily work summary for ${today}: Completed ${activityData.posts_created} content pieces across ${activityData.content_areas.length} areas with strong productivity focus.`,
              summary_type: category
            })
            .select()
            .single()

          if (insertError) {
            console.error(`❌ Error inserting summary for user ${userId}:`, insertError)
            return { userId, success: false, error: insertError.message }
          } else {
            console.log(`✅ Created daily summary for user ${userId}`)
            return { userId, success: true, summaryId: newSummary.id }
          }

        } catch (userError) {
          console.error(`❌ Error processing user ${userId}:`, userError)
          return { userId, success: false, error: userError.message }
        }
      })

      // Wait for the current batch to complete before processing the next
      const batchResults = await Promise.allSettled(batchPromises)
      
      // Add results from this batch
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error('Batch promise rejected:', result.reason)
          results.push({ userId: 'unknown', success: false, error: result.reason?.message || 'Unknown error' })
        }
      })

      // Add a small delay between batches to prevent overwhelming the database
      if (userBatches.indexOf(batch) < userBatches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`📈 Daily work summary generation completed:`)
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Failed: ${failureCount}`)
    console.log(`   📊 Total processed: ${results.length}`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Daily work summary generation completed',
      results: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      },
      details: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('💥 Daily work summary generation failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})