import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ATS-specific parsing configurations
const ATS_CONFIGS = {
  greenhouse: {
    jobListSelector: '.opening',
    titleSelector: 'a',
    locationSelector: '.location',
    linkSelector: 'a',
    baseUrl: '',
  },
  lever: {
    jobListSelector: '.posting',
    titleSelector: '.posting-title h5',
    locationSelector: '.posting-categories .location',
    linkSelector: 'a.posting-title',
    baseUrl: '',
  },
  workable: {
    jobListSelector: '[data-ui="job"]',
    titleSelector: '[data-ui="job-title"]',
    locationSelector: '[data-ui="job-location"]',
    linkSelector: 'a',
    baseUrl: '',
  },
  bamboohr: {
    jobListSelector: '.BambooHR-ATS-Jobs-Item',
    titleSelector: '.BambooHR-ATS-Jobs-Item-Title',
    locationSelector: '.BambooHR-ATS-Jobs-Item-Location',
    linkSelector: 'a',
    baseUrl: '',
  },
  smartrecruiters: {
    jobListSelector: '.openings-job',
    titleSelector: '.job-title a',
    locationSelector: '.job-location',
    linkSelector: '.job-title a',
    baseUrl: '',
  },
  default: {
    jobListSelector: '.job, .opening, .posting',
    titleSelector: 'h1, h2, h3, .title, .job-title',
    locationSelector: '.location, .job-location',
    linkSelector: 'a',
    baseUrl: '',
  }
};

// Create job fingerprint for duplicate detection
function createJobFingerprint(title, company, location) {
  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedLocation = location.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${normalizedCompany}-${normalizedTitle}-${normalizedLocation}`;
}

// Rate limiting helper
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Safe fetch with timeout and headers
async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get active job targets
    const { data: targets, error: targetsError } = await supabase
      .from('job_targets')
      .select('*')
      .eq('is_active', true);

    if (targetsError) {
      throw new Error(`Failed to fetch targets: ${targetsError.message}`);
    }

    if (!targets || targets.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active targets found', newJobs: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalNewJobs = 0;
    let processedTargets = 0;

    // Get existing job fingerprints for duplicate detection
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('title, company, location')
      .eq('is_active', true);

    const existingFingerprints = new Set(
      existingJobs?.map(job => createJobFingerprint(job.title, job.company, job.location)) || []
    );

    for (const target of targets) {
      console.log(`Processing target: ${target.name} (${target.url})`);
      processedTargets++;
      
      try {
        // Rate limiting - wait between requests
        if (processedTargets > 1) {
          await sleep(2000); // 2 second delay between targets
        }

        // Fetch the job board page with safe fetch
        const response = await safeFetch(target.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        console.log(`Fetched HTML for ${target.name}, length: ${html.length}`);
        
        // Parse HTML and extract jobs
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        if (!doc) {
          throw new Error('Failed to parse HTML');
        }

        // Get ATS config or use default
        const config = ATS_CONFIGS[target.ats_platform] || ATS_CONFIGS.default;
        
        // Find all job elements
        const jobElements = doc.querySelectorAll(config.jobListSelector);
        console.log(`Found ${jobElements.length} job elements for ${target.name}`);
        
        const jobsToInsert = [];
        
        for (const jobElement of jobElements) {
          try {
            // Extract job details
            const titleElement = jobElement.querySelector(config.titleSelector);
            const locationElement = jobElement.querySelector(config.locationSelector);
            const linkElement = jobElement.querySelector(config.linkSelector);
            
            if (!titleElement) continue;
            
            const title = titleElement.textContent?.trim() || '';
            const location = locationElement?.textContent?.trim() || 'Not specified';
            const link = linkElement?.getAttribute('href') || target.url;
            
            // Extract company name from target name or URL
            const company = target.name.replace(/\s+(Greenhouse|Lever|Workable|BambooHR|SmartRecruiters|Jobs Board)$/i, '').trim();
            
            // Create full URL if link is relative
            let fullUrl = link;
            if (link.startsWith('/')) {
              const baseUrl = new URL(target.url);
              fullUrl = `${baseUrl.protocol}//${baseUrl.host}${link}`;
            } else if (!link.startsWith('http')) {
              fullUrl = target.url;
            }
            
            // Skip if no title or duplicate
            if (!title) continue;
            
            const fingerprint = createJobFingerprint(title, company, location);
            if (existingFingerprints.has(fingerprint)) {
              console.log(`Skipping duplicate job: ${title} at ${company}`);
              continue;
            }
            
            // Add to fingerprints to avoid duplicates within this scrape
            existingFingerprints.add(fingerprint);
            
            jobsToInsert.push({
              title,
              company,
              platform: target.ats_platform,
              location,
              date_posted: new Date().toISOString().split('T')[0],
              application_url: fullUrl,
              description: `${title} position at ${company} in ${location}`,
              job_type: 'Full-time',
              is_active: true,
              scraped_at: new Date().toISOString()
            });
            
          } catch (jobError) {
            console.error(`Error parsing individual job:`, jobError);
            continue;
          }
        }
        
        // Insert jobs in batch if any found
        if (jobsToInsert.length > 0) {
          console.log(`Inserting ${jobsToInsert.length} jobs from ${target.name}`);
          
          const { data, error } = await supabase
            .from('jobs')
            .insert(jobsToInsert)
            .select('id, title, company');

          if (error) {
            console.error(`Error inserting jobs for ${target.name}:`, error);
          } else {
            totalNewJobs += jobsToInsert.length;
            console.log(`Successfully inserted ${jobsToInsert.length} jobs from ${target.name}`);
            data?.forEach(job => console.log(`- ${job.title} at ${job.company}`));
          }
        } else {
          console.log(`No new jobs found for ${target.name}`);
        }
        
      } catch (error) {
        console.error(`Error processing target ${target.name}:`, error.message);
        
        // Update monitoring state with error
        await supabase
          .from('job_monitoring_state')
          .upsert({
            target_id: target.id,
            last_scraped_at: new Date().toISOString(),
            last_error: error.message,
            error_count: 1, // Could be incremented based on existing count
            last_job_count: 0
          }, { onConflict: 'target_id' });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Job scraping completed`,
        targetsProcessed: targets.length,
        newJobs: totalNewJobs
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Job monitor error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});