/**
 * EDGE FUNCTION: Generate Daily Work Summary
 * 
 * PURPOSE:
 * Automatically generates daily work summaries for all active users based on their social media
 * content creation activity. Creates personalized productivity insights, metrics, and recommendations
 * using AI analysis of daily work patterns and content output.
 * 
 * INPUTS:
 * - No direct inputs (triggered as scheduled function or manual execution)
 * 
 * OUTPUTS:
 * - Success: { success: true, message: string, results: { total: number, successful: number, failed: number }, details: array }
 * - Error: { success: false, error: string }
 * 
 * DEPENDENCIES:
 * - Supabase Database (social_media_posts, openai_agents, system_prompts, daily_work_summaries tables)
 * - Daily Work Summary Agent (database function: insert_daily_work_summary_agent)
 * 
 * USAGE:
 * Called from: Scheduled cron jobs, manual admin triggers, daily automation workflows
 * Authentication: Service role access for cross-user operations
 * 
 * FLOW:
 * 1. Fetch all users with content creation activity
 * 2. Process users in batches to prevent database overload
 * 3. For each user, check if today's summary already exists
 * 4. Analyze user's daily activity (posts created, categories, engagement)
 * 5. Find user's Daily Work Summary Agent and appropriate system prompt
 * 6. Generate summary data (highlights, metrics, insights, recommendations)
 * 7. Insert structured summary into daily_work_summaries table
 * 8. Return batch processing results with success/failure counts
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    // Initialize Supabase client with proper authentication
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
if (!openAIApiKey) {
  console.error('OPENAI_API_KEY not configured');
  return new Response(JSON.stringify({
    success: false,
    error: 'OPENAI_API_KEY is not set in Supabase functions secrets.'
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
}
    // Get user ID from JWT token for single-user operation
    const authHeader = req.headers.get('Authorization')
    let targetUserId = null
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (user && !authError) {
          targetUserId = user.id
          console.log(`🔐 Authenticated user request for: ${targetUserId}`)
        }
      } catch (authError) {
        console.error('❌ Auth token validation failed:', authError)
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid authentication token'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        })
      }
    }

    // Determine which users to process
    let uniqueUserIds = []
    
    if (targetUserId) {
      // Single user mode (UI-triggered)
      uniqueUserIds = [targetUserId]
      console.log(`👤 Processing single user summary for: ${targetUserId}`)
    } else {
      // Batch mode (scheduled/admin)
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
        return new Response(JSON.stringify({
          success: true,
          message: 'No active users found',
          results: { total: 0, successful: 0, failed: 0 }
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      uniqueUserIds = [...new Set(activeUsers.map(u => u.user_id))]
      console.log(`👥 Processing daily summaries for ${uniqueUserIds.length} users`)
    }

    // Get the date from request body or default to today
    const requestBody = await req.json().catch(() => ({}));
    const targetDate = requestBody.date || new Date().toISOString().split('T')[0];
    const summaryDate = targetDate; // YYYY-MM-DD format
    
    const results = []

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

          // Check if summary already exists for the target date
          const { data: existingSummary } = await supabase
            .from('daily_work_summaries')
            .select('id')
            .eq('user_id', userId)
            .eq('summary_date', summaryDate)
            .single()

          if (existingSummary) {
            console.log(`✅ Summary already exists for user ${userId} on ${summaryDate}`)
            return { userId, success: true, message: 'Summary already exists' }
          }

        // Get user's activity data for the selected date
        const targetDateStart = `${summaryDate}T00:00:00Z`
        const targetDateEnd = `${summaryDate}T23:59:59Z`
        const { data: posts } = await supabase
          .from('social_media_posts')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', targetDateStart)
          .lte('created_at', targetDateEnd)

        // Check if no activity exists for the date
        if (!posts || posts.length === 0) {
          console.log(`ℹ️ No activity found for user ${userId} on ${summaryDate}`)
          return { userId, success: false, error: `No posts found for ${summaryDate}` }
        }

        // Try to get Daily Work Summary Agent for this user (optional)
        const { data: agent } = await supabase
          .from('openai_agents')
          .select('id')
          .eq('user_id', userId)
          .eq('name', 'Daily Work Summary Agent')
          .eq('status', 'active')
          .single()

        // Agent is optional - we can generate summaries without it

        // Generate summary based on activity
        const activityData = {
          date: summaryDate,
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

        // Get system prompt for the category (optional - fallback to basic summary if not found)
        let systemPromptData = null
        if (agent) {
          const { data } = await supabase
            .from('system_prompts')
            .select('prompt_text')
            .eq('agent_id', agent.id)
            .eq('category', category)
            .eq('is_active', true)
            .single()
          systemPromptData = data
        }
        
        if (!systemPromptData) {
          console.log(`ℹ️ Using basic summary generation (no system prompt found for category ${category})`)
        }

        // Build a system prompt (use agent prompt if available, otherwise fallback)
        const baseSystemPrompt = systemPromptData?.prompt_text || `You are an expert daily work analyst. Produce a concise JSON summary for a user's work on a given date. Only return strict JSON; no prose.

Schema:
{
  "highlights": string[],
  "insights": string[],
  "recommendations": string[],
  "categories_summary": {
    "technical"?: { "tasks": string[], "insights": string[] },
    "creative"?: { "tasks": string[], "insights": string[] },
    "productivity"?: { "tasks": string[], "insights": string[] },
    "insights"?: { "tasks": string[], "insights": string[] }
  },
  "generated_summary": string,
  "summary_type": "technical" | "creative" | "productivity" | "insights"
}`;

        const inputPayload = {
          date: summaryDate,
          category,
          activity: {
            total_posts: activityData.posts_created,
            content_areas: activityData.content_areas,
            samples: posts.slice(0, 10).map((p: any) => ({
              title: p.title,
              description: p.description,
              category: p.category,
              created_at: p.created_at
            }))
          }
        };

        // Call OpenAI for structured JSON output
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            temperature: 0.3,
            messages: [
              { role: 'system', content: baseSystemPrompt },
              { role: 'user', content: `Generate the JSON summary for:\n${JSON.stringify(inputPayload)}` }
            ]
          })
        });

        if (!aiRes.ok) {
          console.error('OpenAI request failed', await aiRes.text());
        }
        const aiData = await aiRes.json().catch(() => ({} as any));
        let content: string = aiData?.choices?.[0]?.message?.content || '';
        if (content.startsWith('```')) {
          content = content.replace(/```json|```/g, '').trim();
        }

        let aiJson: any = null;
        try { aiJson = JSON.parse(content); } catch (_) { aiJson = null; }

        // Fallbacks if model returns unexpected shape
        const highlights = aiJson?.highlights || [
          `Created ${activityData.posts_created} content pieces`,
          `Worked across ${activityData.content_areas.length} different areas`,
        ];
        const insights = aiJson?.insights || [
          'Consistent work pattern detected',
        ];
        const recommendations = aiJson?.recommendations || [
          'Schedule focused deep work blocks',
        ];
        const categories_summary = aiJson?.categories_summary || {
          [category]: {
            tasks: posts.map((p: any) => p.title).filter(Boolean).slice(0, 10),
            insights,
          }
        };
        const generated_summary = aiJson?.generated_summary || `Daily work summary for ${summaryDate}: ${posts.length} items across ${activityData.content_areas.length} areas.`;
        const summary_type = aiJson?.summary_type || category;

        // Insert daily work summary with AI-generated content
        const { data: newSummary, error: insertError } = await supabase
          .from('daily_work_summaries')
          .insert({
            user_id: userId,
            summary_date: summaryDate,
            highlights,
            insights,
            recommendations,
            categories_summary,
            generated_summary,
            summary_type,
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