import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

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

// Safe fetch with timeout and headers
async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
  
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

// Simple regex-based HTML parsing to avoid DOMParser issues
function parseJobsWithRegex(html, config, targetName) {
  const jobs = [];
  
  // Common patterns for different ATS platforms
  const patterns = {
    greenhouse: {
      container: /<div[^>]*class="[^"]*opening[^"]*"[^>]*>(.*?)<\/div>/gs,
      title: /<a[^>]*>(.*?)<\/a>/s,
      location: /<div[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)<\/div>/s,
      link: /<a[^>]*href="([^"]*)"[^>]*>/s
    },
    lever: {
      container: /<div[^>]*class="[^"]*posting[^"]*"[^>]*>(.*?)<\/div>/gs,
      title: /<h5[^>]*>(.*?)<\/h5>/s,
      location: /<span[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)<\/span>/s,
      link: /<a[^>]*href="([^"]*)"[^>]*>/s
    },
    default: {
      container: /<div[^>]*(?:class="[^"]*(?:job|opening|posting)[^"]*")[^>]*>(.*?)<\/div>/gs,
      title: /<(?:h[1-6]|a)[^>]*>(.*?)<\/(?:h[1-6]|a)>/s,
      location: /<[^>]*(?:class="[^"]*location[^"]*")[^>]*>(.*?)<\/[^>]*>/s,
      link: /<a[^>]*href="([^"]*)"[^>]*>/s
    }
  };
  
  const platform = config.platform || 'default';
  const pattern = patterns[platform] || patterns.default;
  
  const containers = [...html.matchAll(pattern.container)];
  console.log(`Found ${containers.length} job containers for ${targetName} using regex`);
  
  for (let i = 0; i < Math.min(containers.length, 50); i++) { // Limit to 50 jobs per target
    const container = containers[i][1];
    
    const titleMatch = container.match(pattern.title);
    const locationMatch = container.match(pattern.location);
    const linkMatch = container.match(pattern.link);
    
    if (titleMatch) {
      const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
      const location = locationMatch ? locationMatch[1].replace(/<[^>]*>/g, '').trim() : 'Not specified';
      const link = linkMatch ? linkMatch[1] : '';
      
      if (title && title.length > 2) {
        jobs.push({ title, location, link });
      }
    }
  }
  
  return jobs;
}

serve(async (req) => {
  // Always handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 25000; // 25 seconds max

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get active job targets (limit to 2 for performance)
    const { data: targets, error: targetsError } = await supabase
      .from('job_targets')
      .select('*')
      .eq('is_active', true)
      .limit(2);

    if (targetsError) {
      console.error('Failed to fetch targets:', targetsError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch targets: ${targetsError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!targets || targets.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active targets found', newJobs: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${targets.length} targets with ${MAX_EXECUTION_TIME}ms time limit`);
    
    let totalNewJobs = 0;
    const results = [];

    // Get existing job fingerprints for duplicate detection (last 1000 jobs only)
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('title, company, location')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1000);

    const existingFingerprints = new Set(
      existingJobs?.map(job => createJobFingerprint(job.title, job.company, job.location)) || []
    );

    // Process targets with parallel execution (limited concurrency)
    const processTarget = async (target) => {
      const targetStartTime = Date.now();
      console.log(`Processing target: ${target.name} (${target.url})`);
      
      try {
        // Check execution time limit
        if (Date.now() - startTime > MAX_EXECUTION_TIME) {
          throw new Error('Execution time limit exceeded');
        }

        // Fetch the job board page with safe fetch
        const response = await safeFetch(target.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        console.log(`Fetched HTML for ${target.name}, length: ${html.length}`);
        
        // Use regex parsing instead of DOMParser
        const config = { platform: target.ats_platform };
        const jobs = parseJobsWithRegex(html, config, target.name);
        
        const jobsToInsert = [];
        const company = target.name.replace(/\s+(Greenhouse|Lever|Workable|BambooHR|SmartRecruiters|Jobs Board)$/i, '').trim();
        
        for (const job of jobs) {
          try {
            // Create full URL if link is relative
            let fullUrl = job.link;
            if (job.link && job.link.startsWith('/')) {
              const baseUrl = new URL(target.url);
              fullUrl = `${baseUrl.protocol}//${baseUrl.host}${job.link}`;
            } else if (!job.link || !job.link.startsWith('http')) {
              fullUrl = target.url;
            }
            
            // Skip if no title or duplicate
            if (!job.title || job.title.length < 3) continue;
            
            const fingerprint = createJobFingerprint(job.title, company, job.location);
            if (existingFingerprints.has(fingerprint)) {
              continue;
            }
            
            // Add to fingerprints to avoid duplicates within this scrape
            existingFingerprints.add(fingerprint);
            
            jobsToInsert.push({
              title: job.title,
              company,
              platform: target.ats_platform,
              location: job.location,
              date_posted: new Date().toISOString().split('T')[0],
              application_url: fullUrl,
              description: `${job.title} position at ${company} in ${job.location}`,
              job_type: 'Full-time',
              is_active: true,
              scraped_at: new Date().toISOString()
            });
            
          } catch (jobError) {
            console.error(`Error processing individual job:`, jobError);
            continue;
          }
        }
        
        // Batch upsert jobs if any found
        let insertedCount = 0;
        if (jobsToInsert.length > 0) {
          console.log(`Upserting ${jobsToInsert.length} jobs from ${target.name}`);
          
          const { data, error } = await supabase
            .from('jobs')
            .upsert(jobsToInsert, { 
              onConflict: 'title,company,location',
              ignoreDuplicates: true 
            })
            .select('id');

          if (error) {
            console.error(`Error upserting jobs for ${target.name}:`, error);
          } else {
            insertedCount = data?.length || 0;
            console.log(`Successfully upserted ${insertedCount} jobs from ${target.name}`);
          }
        } else {
          console.log(`No new jobs found for ${target.name}`);
        }

        // Update monitoring state with success
        await supabase
          .from('job_monitoring_state')
          .upsert({
            target_id: target.id,
            last_scraped_at: new Date().toISOString(),
            last_job_count: insertedCount,
            last_error: null,
            error_count: 0
          }, { onConflict: 'target_id' });
        
        const processingTime = Date.now() - targetStartTime;
        console.log(`Completed ${target.name} in ${processingTime}ms`);
        
        return { target: target.name, newJobs: insertedCount, success: true, processingTime };
        
      } catch (error) {
        console.error(`Error processing target ${target.name}:`, error.message);
        
        // Update monitoring state with error
        await supabase
          .from('job_monitoring_state')
          .upsert({
            target_id: target.id,
            last_scraped_at: new Date().toISOString(),
            last_error: error.message,
            error_count: 1,
            last_job_count: 0
          }, { onConflict: 'target_id' });
          
        return { target: target.name, newJobs: 0, success: false, error: error.message };
      }
    };

    // Process targets in parallel with limited concurrency
    const results = await Promise.allSettled(
      targets.map(target => processTarget(target))
    );

    // Calculate totals
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        totalNewJobs += result.value.newJobs;
      }
    }

    const totalExecutionTime = Date.now() - startTime;
    console.log(`Total execution time: ${totalExecutionTime}ms`);
    
    // Prepare response with detailed results
    const successfulTargets = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failedTargets = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Job scraping completed in ${totalExecutionTime}ms`,
        targetsProcessed: targets.length,
        successfulTargets,
        failedTargets,
        newJobs: totalNewJobs,
        executionTime: totalExecutionTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Job monitor error:', error);
    // Always return CORS headers even on error
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});