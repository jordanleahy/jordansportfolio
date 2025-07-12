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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();

    console.log(`SEC Analytics request: ${req.method} ${endpoint}`);

    switch (endpoint) {
      case 'industry-trends':
        return await handleIndustryTrends(supabase, url);
      case 'geographic-distribution':
        return await handleGeographicDistribution(supabase, url);
      case 'timeline-analysis':
        return await handleTimelineAnalysis(supabase, url);
      case 'amount-distribution':
        return await handleAmountDistribution(supabase, url);
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('SEC Analytics error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleIndustryTrends(supabase: any, url: URL) {
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  // Build query with optional date filters
  let query = supabase
    .from('offerings')
    .select(`
      INDUSTRYGROUPTYPE,
      TOTALOFFERINGAMOUNT,
      SALE_DATE
    `)
    .not('INDUSTRYGROUPTYPE', 'is', null)
    .not('TOTALOFFERINGAMOUNT', 'is', null)
    .order('SALE_DATE', { ascending: false });

  if (startDate && endDate) {
    query = query.gte('SALE_DATE', startDate).lte('SALE_DATE', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch industry trends: ${error.message}`);
  }

  // Aggregate by industry
  const industryMap = new Map();
  data.forEach((offering: any) => {
    const industry = offering.INDUSTRYGROUPTYPE;
    const amount = offering.TOTALOFFERINGAMOUNT || 0;
    
    if (!industryMap.has(industry)) {
      industryMap.set(industry, {
        industry,
        count: 0,
        totalAmount: 0,
        offerings: []
      });
    }
    
    const current = industryMap.get(industry);
    current.count++;
    current.totalAmount += amount;
    current.offerings.push({
      amount,
      date: offering.SALE_DATE
    });
  });

  // Convert to array and add calculated fields
  const trends = Array.from(industryMap.values()).map((item: any) => ({
    ...item,
    averageAmount: item.count > 0 ? item.totalAmount / item.count : 0,
    offerings: undefined // Remove detailed offerings from response
  })).sort((a, b) => b.totalAmount - a.totalAmount);

  return new Response(
    JSON.stringify({ data: trends }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGeographicDistribution(supabase: any, url: URL) {
  const { data, error } = await supabase
    .from('offerings')
    .select(`
      TOTALOFFERINGAMOUNT,
      issuers!inner(
        CITY,
        STATEORCOUNTRY,
        STATEORCOUNTRYDESCRIPTION
      )
    `)
    .not('TOTALOFFERINGAMOUNT', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch geographic distribution: ${error.message}`);
  }

  // Aggregate by state/country
  const geoMap = new Map();
  data.forEach((offering: any) => {
    offering.issuers.forEach((issuer: any) => {
      const state = issuer.STATEORCOUNTRY || 'Unknown';
      const description = issuer.STATEORCOUNTRYDESCRIPTION || state;
      const amount = offering.TOTALOFFERINGAMOUNT || 0;
      
      if (!geoMap.has(state)) {
        geoMap.set(state, {
          state,
          description,
          count: 0,
          totalAmount: 0
        });
      }
      
      const current = geoMap.get(state);
      current.count++;
      current.totalAmount += amount;
    });
  });

  const distribution = Array.from(geoMap.values())
    .map((item: any) => ({
      ...item,
      averageAmount: item.count > 0 ? item.totalAmount / item.count : 0
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return new Response(
    JSON.stringify({ data: distribution }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleTimelineAnalysis(supabase: any, url: URL) {
  const period = url.searchParams.get('period') || 'month'; // month, quarter, year
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  let query = supabase
    .from('offerings')
    .select('SALE_DATE, TOTALOFFERINGAMOUNT')
    .not('SALE_DATE', 'is', null)
    .not('TOTALOFFERINGAMOUNT', 'is', null)
    .order('SALE_DATE', { ascending: true });

  if (startDate && endDate) {
    query = query.gte('SALE_DATE', startDate).lte('SALE_DATE', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch timeline data: ${error.message}`);
  }

  // Aggregate by time period
  const timelineMap = new Map();
  data.forEach((offering: any) => {
    const date = new Date(offering.SALE_DATE);
    let key: string;

    switch (period) {
      case 'year':
        key = date.getFullYear().toString();
        break;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'month':
      default:
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
    }

    if (!timelineMap.has(key)) {
      timelineMap.set(key, {
        period: key,
        count: 0,
        totalAmount: 0
      });
    }

    const current = timelineMap.get(key);
    current.count++;
    current.totalAmount += offering.TOTALOFFERINGAMOUNT;
  });

  const timeline = Array.from(timelineMap.values())
    .map((item: any) => ({
      ...item,
      averageAmount: item.count > 0 ? item.totalAmount / item.count : 0
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return new Response(
    JSON.stringify({ data: timeline }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAmountDistribution(supabase: any, url: URL) {
  const { data, error } = await supabase
    .from('offerings')
    .select('TOTALOFFERINGAMOUNT')
    .not('TOTALOFFERINGAMOUNT', 'is', null)
    .order('TOTALOFFERINGAMOUNT', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch amount distribution: ${error.message}`);
  }

  const amounts = data.map((item: any) => item.TOTALOFFERINGAMOUNT);
  
  // Create amount ranges
  const ranges = [
    { min: 0, max: 100000, label: 'Under $100K' },
    { min: 100000, max: 500000, label: '$100K - $500K' },
    { min: 500000, max: 1000000, label: '$500K - $1M' },
    { min: 1000000, max: 5000000, label: '$1M - $5M' },
    { min: 5000000, max: 10000000, label: '$5M - $10M' },
    { min: 10000000, max: 50000000, label: '$10M - $50M' },
    { min: 50000000, max: Infinity, label: 'Over $50M' }
  ];

  const distribution = ranges.map(range => {
    const inRange = amounts.filter(amount => 
      amount >= range.min && amount < range.max
    );
    
    return {
      range: range.label,
      count: inRange.length,
      totalAmount: inRange.reduce((sum, amount) => sum + amount, 0),
      averageAmount: inRange.length > 0 ? inRange.reduce((sum, amount) => sum + amount, 0) / inRange.length : 0,
      percentage: (inRange.length / amounts.length) * 100
    };
  });

  // Add summary statistics
  const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
  const summary = {
    totalOfferings: amounts.length,
    totalAmount,
    averageAmount: totalAmount / amounts.length,
    medianAmount: amounts[Math.floor(amounts.length / 2)],
    minAmount: amounts[0],
    maxAmount: amounts[amounts.length - 1]
  };

  return new Response(
    JSON.stringify({ 
      distribution,
      summary
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}