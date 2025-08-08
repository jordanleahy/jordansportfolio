import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type UsageDetailRequest = {
  userId: string;
  dateFrom?: string; // ISO
  dateTo?: string;   // ISO
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as UsageDetailRequest;
    if (!body?.userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    const dateTo = body.dateTo ? new Date(body.dateTo) : new Date();
    const dateFrom = body.dateFrom ? new Date(body.dateFrom) : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, full_name, created_at')
      .eq('user_id', body.userId)
      .maybeSingle();
    if (profileErr) throw profileErr;

    // Fetch usage within range from api_usage_tracking
    const { data: usageRows, error: usageErr } = await supabaseAdmin
      .from('api_usage_tracking')
      .select('id, created_at, estimated_cost, request_type, function_name, success, user_id')
      .eq('user_id', body.userId)
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString());
    if (usageErr) throw usageErr;

    // Filter to image generation operations
    const imageEvents = (usageRows || []).filter((row: any) =>
      row.request_type === 'image_generation' || String(row.function_name || '').includes('image')
    );

    // Build daily aggregates
    const byDay = new Map<string, { images: number; cost: number }>();
    let totalImages = 0;
    let totalCost = 0;

    for (const row of imageEvents || []) {
      const d = new Date(row.created_at);
      const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0,10);
      if (!byDay.has(key)) byDay.set(key, { images: 0, cost: 0 });
      const e = byDay.get(key)!;
      e.images += 1;
      e.cost += Number((row as any).estimated_cost || 0);
      totalImages += 1;
      totalCost += Number((row as any).estimated_cost || 0);
    }

    // Sort daily data
    const days: { date: string; images: number; cost: number }[] = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, images: v.images, cost: Number(v.cost.toFixed(4)) }));

    // Recent items
    const recent = (imageEvents || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return new Response(JSON.stringify({
      user: profile,
      range: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
      totals: { images: totalImages, cost: Number(totalCost.toFixed(4)) },
      daily: days,
      recent,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error('user-usage-detail error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
