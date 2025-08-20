import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check admin access
    const { data: me, error: meErr } = await supabaseUser.auth.getUser();
    if (meErr || !me.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: isAdmin, error: roleError } = await supabaseAdmin
      .rpc('has_role', { _user_id: me.user.id, _role: 'admin' });
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Calculate date ranges
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('Fetching all-time image generation data...');

    // Get all-time image generation data
    const { data: allTimeData, error: allTimeError } = await supabaseAdmin
      .from('api_usage_tracking')
      .select('estimated_cost, created_at, user_id')
      .eq('request_type', 'image_generation')
      .limit(100000);
    
    if (allTimeError) {
      console.error('AllTime error:', allTimeError);
      throw allTimeError;
    }

    console.log(`Fetched ${allTimeData?.length || 0} records`);

    // Calculate aggregates
    const allTimeImages = allTimeData?.length || 0;
    const allTimeCost = allTimeData?.reduce((sum, record) => sum + Number(record.estimated_cost || 0), 0) || 0;

    // Filter for weekly data
    const weekData = allTimeData?.filter(record => 
      new Date(record.created_at) >= weekAgo
    ) || [];
    
    const weekImages = weekData.length;
    const weekCost = weekData.reduce((sum, record) => sum + Number(record.estimated_cost || 0), 0);

    // Filter for monthly data
    const monthData = allTimeData?.filter(record => 
      new Date(record.created_at) >= monthAgo
    ) || [];
    
    const monthImages = monthData.length;
    const monthCost = monthData.reduce((sum, record) => sum + Number(record.estimated_cost || 0), 0);

    // Get daily aggregates for the chart (last 30 days)
    const dailyAggregates = new Map<string, { images: number; cost: number }>();
    
    monthData.forEach(record => {
      const date = new Date(record.created_at).toISOString().slice(0, 10);
      if (!dailyAggregates.has(date)) {
        dailyAggregates.set(date, { images: 0, cost: 0 });
      }
      const entry = dailyAggregates.get(date)!;
      entry.images += 1;
      entry.cost += Number(record.estimated_cost || 0);
    });

    // Convert to array and sort by date
    const dailyData = Array.from(dailyAggregates.entries())
      .map(([date, data]) => ({
        date,
        images: data.images,
        cost: Number(data.cost.toFixed(4))
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get unique user count
    const uniqueUsers = new Set(allTimeData?.map(record => record.user_id) || []).size;

    console.log('Returning aggregated data:', {
      totalImages: allTimeImages,
      totalCost: allTimeCost,
      uniqueUsers,
      weekData: { images: weekImages, cost: weekCost },
      monthData: { images: monthImages, cost: monthCost },
      dailyDataLength: dailyData.length
    });

    return new Response(JSON.stringify({
      totals: {
        images: allTimeImages,
        cost: Number(allTimeCost.toFixed(4)),
        users: uniqueUsers
      },
      periods: {
        week: {
          images: weekImages,
          cost: Number(weekCost.toFixed(4))
        },
        month: {
          images: monthImages,
          cost: Number(monthCost.toFixed(4))
        },
        allTime: {
          images: allTimeImages,
          cost: Number(allTimeCost.toFixed(4))
        }
      },
      daily: dailyData
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (e: any) {
    console.error('aggregate-api-usage error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});