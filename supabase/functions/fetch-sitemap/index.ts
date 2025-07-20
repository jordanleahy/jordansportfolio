import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface SitemapData {
  urls: SitemapUrl[];
  totalUrls: number;
  lastFetched: string;
}

function parseSitemapXML(xmlContent: string): SitemapUrl[] {
  const urls: SitemapUrl[] = [];
  
  // Simple regex-based XML parsing for sitemap URLs
  const urlMatches = xmlContent.match(/<url[^>]*>[\s\S]*?<\/url>/g) || [];
  
  for (const urlMatch of urlMatches) {
    const loc = urlMatch.match(/<loc[^>]*>(.*?)<\/loc>/)?.[1];
    if (loc) {
      const url: SitemapUrl = { loc: loc.trim() };
      
      // Extract optional fields
      const lastmod = urlMatch.match(/<lastmod[^>]*>(.*?)<\/lastmod>/)?.[1];
      const changefreq = urlMatch.match(/<changefreq[^>]*>(.*?)<\/changefreq>/)?.[1];
      const priority = urlMatch.match(/<priority[^>]*>(.*?)<\/priority>/)?.[1];
      
      if (lastmod) url.lastmod = lastmod.trim();
      if (changefreq) url.changefreq = changefreq.trim();
      if (priority) url.priority = priority.trim();
      
      urls.push(url);
    }
  }
  
  return urls;
}

function findSitemapUrls(websiteUrl: string): string[] {
  const baseUrl = new URL(websiteUrl).origin;
  return [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/robots.txt`, // Check robots.txt for sitemap references
  ];
}

async function fetchRobotsTxt(robotsUrl: string): Promise<string[]> {
  try {
    const response = await fetch(robotsUrl);
    if (!response.ok) return [];
    
    const content = await response.text();
    const sitemapMatches = content.match(/sitemap:\s*(https?:\/\/[^\s]+)/gi) || [];
    
    return sitemapMatches.map(match => 
      match.replace(/sitemap:\s*/i, '').trim()
    );
  } catch (error) {
    console.log(`Failed to fetch robots.txt: ${error}`);
    return [];
  }
}

async function fetchSitemap(sitemapUrl: string): Promise<SitemapUrl[]> {
  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'Sitemap-Fetcher/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    
    // Check if this is a sitemap index (contains other sitemaps)
    if (content.includes('<sitemapindex')) {
      const sitemapMatches = content.match(/<loc[^>]*>(.*?)<\/loc>/g) || [];
      const childSitemaps = sitemapMatches.map(match => 
        match.replace(/<\/?loc[^>]*>/g, '').trim()
      );
      
      // Fetch all child sitemaps (limit to prevent abuse)
      const allUrls: SitemapUrl[] = [];
      for (const childUrl of childSitemaps.slice(0, 10)) { // Limit to 10 sitemaps
        try {
          const childUrls = await fetchSitemap(childUrl);
          allUrls.push(...childUrls);
        } catch (error) {
          console.log(`Failed to fetch child sitemap ${childUrl}: ${error}`);
        }
      }
      return allUrls;
    }
    
    // Parse regular sitemap
    return parseSitemapXML(content);
    
  } catch (error) {
    console.log(`Failed to fetch sitemap ${sitemapUrl}: ${error}`);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteUrl, vendorId } = await req.json();
    
    if (!websiteUrl || !vendorId) {
      return new Response(
        JSON.stringify({ error: 'Website URL and vendor ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Starting sitemap fetch for: ${websiteUrl}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get potential sitemap URLs
    const sitemapUrls = findSitemapUrls(websiteUrl);
    
    // Check robots.txt for additional sitemaps
    const robotsUrl = `${new URL(websiteUrl).origin}/robots.txt`;
    const robotsSitemaps = await fetchRobotsTxt(robotsUrl);
    sitemapUrls.push(...robotsSitemaps);

    // Fetch sitemaps
    let allUrls: SitemapUrl[] = [];
    
    for (const sitemapUrl of sitemapUrls) {
      const urls = await fetchSitemap(sitemapUrl);
      if (urls.length > 0) {
        allUrls.push(...urls);
        console.log(`Found ${urls.length} URLs in ${sitemapUrl}`);
      }
    }

    // Remove duplicates
    const uniqueUrls = Array.from(
      new Map(allUrls.map(url => [url.loc, url])).values()
    );

    const sitemapData: SitemapData = {
      urls: uniqueUrls,
      totalUrls: uniqueUrls.length,
      lastFetched: new Date().toISOString(),
    };

    // Update vendor with sitemap data
    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        sitemap_tree: sitemapData,
        sitemap_fetched_at: new Date().toISOString(),
      })
      .eq('id', vendorId);

    if (updateError) {
      throw new Error(`Failed to update vendor: ${updateError.message}`);
    }

    console.log(`Successfully fetched ${uniqueUrls.length} URLs for vendor ${vendorId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sitemapData,
        message: `Found ${uniqueUrls.length} URLs in sitemap`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Sitemap fetch error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch sitemap',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});