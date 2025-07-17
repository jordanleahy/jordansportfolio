import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleApiKey = Deno.env.get('GOOGLE_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface DiscoveredBoard {
  name: string;
  url: string;
  company: string;
  jobCount: number;
  validated: boolean;
}

async function searchGreenhouseBoards(): Promise<string[]> {
  const queries = [
    'site:boards.greenhouse.io "product designer"',
    'site:boards.greenhouse.io "design lead"', 
    'site:boards.greenhouse.io "senior designer"',
    'site:boards.greenhouse.io "ux designer"',
    'site:boards.greenhouse.io "ui designer"'
  ];

  const allUrls = new Set<string>();

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=017576662512468239146:omuauf_lfve&q=${encodeURIComponent(query)}&num=10`
      );
      
      if (!response.ok) {
        console.log(`Search API error for query "${query}": ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      if (data.items) {
        for (const item of data.items) {
          const url = item.link;
          if (url.includes('boards.greenhouse.io/')) {
            // Extract company board URL (remove job-specific paths)
            const match = url.match(/https:\/\/boards\.greenhouse\.io\/([^\/]+)/);
            if (match) {
              const boardUrl = `https://boards.greenhouse.io/${match[1]}`;
              allUrls.add(boardUrl);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error searching for query "${query}":`, error);
    }
  }

  return Array.from(allUrls);
}

async function validateBoard(url: string): Promise<DiscoveredBoard | null> {
  try {
    console.log(`Validating board: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log(`Board validation failed for ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Use flexible selectors to find job listings
    const jobSelectors = [
      '[class*="opening"]',
      '[class*="job"]', 
      '[class*="position"]',
      '.job-post',
      '.position',
      '.opening'
    ];

    let jobCount = 0;
    let hasDesignJobs = false;
    const companyMatch = url.match(/boards\.greenhouse\.io\/([^\/]+)/);
    const company = companyMatch ? companyMatch[1] : 'Unknown';

    // Look for design-related job titles
    const designRegex = /(?i)product\s+designer|design\s+lead|senior\s+designer|ux\s+designer|ui\s+designer|design\s+manager/i;
    
    // Simple job counting by looking for job-related patterns in HTML
    const jobMatches = html.match(/<[^>]*class="[^"]*(?:opening|job|position)[^"]*"[^>]*>/gi);
    if (jobMatches) {
      jobCount = jobMatches.length;
    }

    // Check if any design jobs exist
    hasDesignJobs = designRegex.test(html);

    // Only consider valid if it has jobs and at least some design-related content
    if (jobCount > 0 && hasDesignJobs) {
      return {
        name: `${company.charAt(0).toUpperCase() + company.slice(1)} (Greenhouse)`,
        url,
        company,
        jobCount,
        validated: true
      };
    }

    return null;
  } catch (error) {
    console.error(`Error validating board ${url}:`, error);
    return null;
  }
}

async function storeDiscoveredBoard(board: DiscoveredBoard): Promise<boolean> {
  try {
    // Check if this board already exists
    const { data: existing } = await supabase
      .from('job_targets')
      .select('id')
      .eq('url', board.url)
      .maybeSingle();

    if (existing) {
      console.log(`Board already exists: ${board.url}`);
      return false;
    }

    // Insert new job target
    const { error } = await supabase
      .from('job_targets')
      .insert({
        name: board.name,
        url: board.url,
        ats_platform: 'greenhouse',
        selector: '[class*="opening"]', // Flexible selector
        is_active: true
      });

    if (error) {
      console.error('Error storing board:', error);
      return false;
    }

    console.log(`Successfully stored board: ${board.name}`);
    return true;
  } catch (error) {
    console.error('Error in storeDiscoveredBoard:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Greenhouse board discovery...');

    // Step 1: Search for Greenhouse boards
    const boardUrls = await searchGreenhouseBoards();
    console.log(`Found ${boardUrls.length} potential Greenhouse boards`);

    if (boardUrls.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No Greenhouse boards found via search',
        discovered: 0,
        stored: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Validate each board (limit to first 20 to avoid timeouts)
    const boardsToValidate = boardUrls.slice(0, 20);
    const validatedBoards: DiscoveredBoard[] = [];

    for (const url of boardsToValidate) {
      const board = await validateBoard(url);
      if (board) {
        validatedBoards.push(board);
      }
      
      // Small delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Validated ${validatedBoards.length} boards out of ${boardsToValidate.length} checked`);

    // Step 3: Store valid boards
    let storedCount = 0;
    for (const board of validatedBoards) {
      const stored = await storeDiscoveredBoard(board);
      if (stored) {
        storedCount++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `Discovery completed successfully`,
      searched: boardUrls.length,
      validated: validatedBoards.length,
      stored: storedCount,
      boards: validatedBoards.map(b => ({ name: b.name, url: b.url, jobCount: b.jobCount }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in discover-job-boards function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      discovered: 0,
      stored: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});