import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types for our events/aggregates
interface ApiUsageEvent {
  id: string;
  created_at: string;
  user_id: string | null;
  provider: string | null;
  service: string | null;
  function_name: string | null;
  model_used: string | null;
  request_type: string | null;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
  estimated_cost: number | null;
  actual_cost?: number | null;
  success: boolean | null;
  response_time_ms?: number | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Supabase env not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.53.0');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    let dateParam: string | undefined;
    try {
      if (req.method !== 'GET') {
        const body = await req.json().catch(() => ({}));
        dateParam = body?.date;
      }
    } catch {}
    if (!dateParam) {
      const url = new URL(req.url);
      dateParam = url.searchParams.get('date') || undefined;
    }

    // Default to today in project timezone (UTC assumed)
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    if (isNaN(targetDate.getTime())) {
      return new Response(JSON.stringify({ error: 'Invalid date parameter' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const yyyy = targetDate.getUTCFullYear();
    const mm = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getUTCDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const fromISO = `${dateStr}T00:00:00.000Z`;
    const toISO = `${dateStr}T23:59:59.999Z`;

    // Fetch all events for the day in pages
    const pageSize = 1000;
    let from = 0;
    let all: ApiUsageEvent[] = [];

    while (true) {
      const { data, error } = await supabase
        .from('api_usage_events')
        .select('*')
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('Failed to fetch events:', error);
        return new Response(JSON.stringify({ error: 'Fetch events failed', details: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const batch = (data || []) as ApiUsageEvent[];
      all = all.concat(batch);
      if (batch.length < pageSize) break;
      from += pageSize;
    }

    // Aggregate in-memory
    type Key = string;
    interface Agg {
      date: string;
      user_id: string | null;
      provider: string | null;
      service: string | null;
      function_name: string | null;
      model_used: string | null;
      request_type: string | null;
      total_requests: number;
      total_success: number;
      total_errors: number;
      total_prompt_tokens: number;
      total_completion_tokens: number;
      total_tokens: number;
      total_estimated_cost: number;
      total_actual_cost: number | null;
      latencies: number[];
    }

    const map = new Map<Key, Agg>();

    const keyOf = (e: ApiUsageEvent): Key => {
      const k = [
        dateStr,
        e.user_id || '-',
        e.provider || '-',
        e.service || '-',
        e.function_name || '-',
        e.model_used || '-',
        e.request_type || '-',
      ].join('|');
      return k;
    };

    for (const e of all) {
      const k = keyOf(e);
      if (!map.has(k)) {
        map.set(k, {
          date: dateStr,
          user_id: e.user_id || null,
          provider: e.provider || 'openai',
          service: e.service || null,
          function_name: e.function_name || null,
          model_used: e.model_used || null,
          request_type: e.request_type || null,
          total_requests: 0,
          total_success: 0,
          total_errors: 0,
          total_prompt_tokens: 0,
          total_completion_tokens: 0,
          total_tokens: 0,
          total_estimated_cost: 0,
          total_actual_cost: 0,
          latencies: [],
        });
      }
      const a = map.get(k)!;
      a.total_requests += 1;
      if (e.success) a.total_success += 1; else a.total_errors += 1;
      a.total_prompt_tokens += e.prompt_tokens || 0;
      a.total_completion_tokens += e.completion_tokens || 0;
      a.total_tokens += e.total_tokens || 0;
      a.total_estimated_cost += e.estimated_cost || 0;
      a.total_actual_cost = (a.total_actual_cost || 0) + (e.actual_cost || 0);
      if (typeof e.response_time_ms === 'number') a.latencies.push(e.response_time_ms);
    }

    // Build upsert rows
    const rows = Array.from(map.values()).map((a) => {
      const n = a.latencies.length;
      let avgLatency: number | null = null;
      let p95Latency: number | null = null;
      if (n > 0) {
        avgLatency = Math.round(a.latencies.reduce((s, v) => s + v, 0) / n);
        const sorted = [...a.latencies].sort((x, y) => x - y);
        const idx = Math.min(sorted.length - 1, Math.floor(0.95 * (sorted.length - 1)));
        p95Latency = sorted[idx];
      }

      const successRate = a.total_requests > 0 ? (a.total_success / a.total_requests) : 0;
      const agg_key = [
        a.date,
        a.user_id ?? '-',
        a.provider ?? '-',
        a.service ?? '-',
        a.function_name ?? '-',
        a.model_used ?? '-',
        a.request_type ?? '-',
      ].join('|');

      return {
        date: a.date,
        user_id: a.user_id,
        provider: a.provider ?? 'openai',
        service: a.service,
        function_name: a.function_name,
        model_used: a.model_used,
        request_type: a.request_type,
        total_requests: a.total_requests,
        total_success: a.total_success,
        total_errors: a.total_errors,
        success_rate: successRate,
        total_prompt_tokens: a.total_prompt_tokens,
        total_completion_tokens: a.total_completion_tokens,
        total_tokens: a.total_tokens,
        total_estimated_cost: a.total_estimated_cost,
        total_actual_cost: a.total_actual_cost || null,
        avg_latency_ms: avgLatency,
        p95_latency_ms: p95Latency,
        agg_key,
      };
    });

    if (rows.length > 0) {
      // Upsert with conflict on agg_key
      const { error: upsertError } = await supabase
        .from('api_usage_daily_aggregates')
        .upsert(rows, { onConflict: 'agg_key' });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        return new Response(JSON.stringify({ error: 'Upsert failed', details: upsertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(
      JSON.stringify({
        date: dateStr,
        events_processed: all.length,
        groups_aggregated: rows.length,
        status: 'ok',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('aggregate-api-usage error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
