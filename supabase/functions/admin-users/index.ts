import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Client with the user's JWT for role check
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Admin client for privileged queries
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current user
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = userData.user.id;

    // Check admin role
    const { data: isAdminData, error: roleError } = await supabaseAdmin
      .rpc('has_role', { _user_id: userId, _role: 'admin' });

    if (roleError || !isAdminData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch base user list from profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, full_name, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Aggregate image usage per user
    const { data: imageAgg, error: aggError } = await supabaseAdmin
      .from('images')
      .select('user_id, estimated_cost')
      .order('user_id');

    if (aggError) throw aggError;

    const usageMap = new Map<string, { totalImages: number; totalCost: number }>();
    for (const row of imageAgg || []) {
      const uid = row.user_id as string;
      if (!usageMap.has(uid)) usageMap.set(uid, { totalImages: 0, totalCost: 0 });
      const entry = usageMap.get(uid)!;
      entry.totalImages += 1;
      entry.totalCost += Number(row.estimated_cost || 0);
    }

    const result = (profiles || []).map((p) => ({
      user_id: p.user_id,
      email: p.email,
      full_name: (p as any).full_name ?? null,
      created_at: p.created_at,
      total_images: usageMap.get(p.user_id)?.totalImages || 0,
      total_estimated_cost: Number((usageMap.get(p.user_id)?.totalCost || 0).toFixed(4)),
    }));

    return new Response(JSON.stringify({ users: result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error('admin-users error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
