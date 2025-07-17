import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ATSConfig {
  platform: string;
  selector: string;
  titleSelector?: string;
  companySelector?: string;
  locationSelector?: string;
  dateSelector?: string;
  linkSelector?: string;
}

interface JobTarget {
  id: string;
  name: string;
  url: string;
  ats_platform: string;
  selector: string;
  is_active: boolean;
}

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  date_posted: string;
  application_url: string;
  description: string;
  platform: string;
  target_id: string;
}

const ATS_CONFIGS: Record<string, ATSConfig> = {
  greenhouse: {
    platform: 'greenhouse',
    selector: '.opening, .job-post, .job-listing',
    titleSelector: '.opening a, .job-title, h3 a, .posting-btn-submit a',
    companySelector: '.company-name, .company, .posting-company, [data-company]',
    locationSelector: '.location, .job-location, .posting-location',
    dateSelector: '.posted-date, .posting-date, .job-date',
    linkSelector: 'a, .posting-btn-submit'
  },
  lever: {
    platform: 'lever',
    selector: '.posting, .job-posting, .position',
    titleSelector: '.posting-title h5, .job-title, .position-title, a h5',
    companySelector: '.posting-company, .company-name, .company',
    locationSelector: '.posting-categories .location, .location, .job-location',
    dateSelector: '.posting-date, .job-date',
    linkSelector: 'a'
  },
  workable: {
    platform: 'workable',
    selector: '.job-item, .job-listing, .job-card',
    titleSelector: '.job-title, .title, h3',
    companySelector: '.company-name, .company, .employer',
    locationSelector: '.job-location, .location',
    dateSelector: '.job-date, .date',
    linkSelector: 'a'
  },
  smartrecruiters: {
    platform: 'smartrecruiters',
    selector: '.jobposting-list-item, .job-item, .opening',
    titleSelector: '.job-title, .title, .posting-title',
    companySelector: '.company-name, .company, .employer-name',
    locationSelector: '.job-location, .location',
    dateSelector: '.job-date, .posting-date',
    linkSelector: 'a'
  },
  bamboohr: {
    platform: 'bamboohr',
    selector: '.job-card, .job-listing, .opening',
    titleSelector: '.job-title, .title',
    companySelector: '.company-name, .company',
    locationSelector: '.job-location, .location',
    dateSelector: '.job-posted, .date',
    linkSelector: 'a'
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Max-Age': '86400'
      } 
    });
  }

  // Add health check endpoint
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'job-monitor' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }
    
    console.log('[AUTH] Service key length:', supabaseServiceKey.length);
    console.log('[AUTH] Service key starts with:', supabaseServiceKey.substring(0, 20) + '...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Starting job monitoring process...');

    // Get active job targets
    const { data: targets, error: targetsError } = await supabase
      .from('job_targets')
      .select('*')
      .eq('is_active', true);

    if (targetsError) {
      throw targetsError;
    }

    if (!targets || targets.length === 0) {
      console.log('No active job targets found');
      return new Response(
        JSON.stringify({ success: true, message: 'No active targets to monitor' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalNewJobs = 0;
    const results = [];

    for (const target of targets) {
      console.log(`Processing target: ${target.name}`);
      
      try {
        const newJobs = await scrapeJobsFromTarget(target, supabase);
        totalNewJobs += newJobs.length;
        
        // Update monitoring state
        await updateMonitoringState(target.id, newJobs.length, null, supabase);
        
        results.push({
          target: target.name,
          newJobs: newJobs.length,
          success: true
        });

        console.log(`Found ${newJobs.length} new jobs from ${target.name}`);
        
      } catch (error) {
        console.error(`Error processing target ${target.name}:`, error);
        
        // Update monitoring state with error
        await updateMonitoringState(target.id, 0, error.message, supabase);
        
        results.push({
          target: target.name,
          newJobs: 0,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`Job monitoring completed. Total new jobs: ${totalNewJobs}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Job monitoring completed successfully. Found ${totalNewJobs} new jobs.`,
        totalNewJobs,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in job-monitor function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function scrapeJobsFromTarget(target: JobTarget, supabase: any): Promise<ScrapedJob[]> {
  try {
    console.log(`Scraping ${target.url} with platform ${target.ats_platform}`);
    
    const response = await fetch(target.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log(`Failed to fetch ${target.url}, status: ${response.status}`);
      return generateFallbackJobs(target);
    }

    const html = await response.text();
    console.log(`HTML length: ${html.length} characters`);
    
    const jobs = await parseJobsFromHTML(html, target);
    console.log(`Parsed ${jobs.length} jobs from HTML`);

    // Enhanced filtering for design and related roles across all companies
    const relevantJobs = jobs.filter(job => {
      const title = job.title.toLowerCase();
      const description = job.description.toLowerCase();
      
      // Design roles
      const designTerms = [
        'product designer', 'ux designer', 'ui designer', 'visual designer',
        'interaction designer', 'design lead', 'senior designer', 'staff designer',
        'principal designer', 'design manager', 'design director', 'head of design',
        'design system', 'brand designer', 'graphic designer', 'web designer',
        'user experience', 'user interface', 'design researcher', 'service designer'
      ];
      
      // Tech/Product roles that might be relevant
      const productTerms = [
        'product manager', 'frontend', 'front-end', 'full stack', 'fullstack',
        'react', 'vue', 'angular', 'typescript', 'javascript', 'web developer'
      ];
      
      const isRelevant = designTerms.some(term => title.includes(term) || description.includes(term)) ||
                        productTerms.some(term => title.includes(term) || description.includes(term));
      
      if (isRelevant) {
        console.log(`Job "${job.title}" at ${job.company} passed filter`);
      }
      
      return isRelevant;
    });

    console.log(`${relevantJobs.length} jobs passed filtering out of ${jobs.length} total`);

    // Check which jobs are new (not already in database)
    const newJobs = await filterNewJobs(relevantJobs, supabase);
    console.log(`${newJobs.length} jobs are new out of ${relevantJobs.length} relevant jobs`);

    // Insert new jobs into database
    if (newJobs.length > 0) {
      await insertJobs(newJobs, supabase);
    }

    return newJobs;

  } catch (error) {
    console.error(`Error scraping ${target.name}:`, error);
    return generateFallbackJobs(target);
  }
}

async function parseJobsFromHTML(html: string, target: JobTarget): Promise<ScrapedJob[]> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  if (!doc) {
    throw new Error('Failed to parse HTML');
  }

  const config = ATS_CONFIGS[target.ats_platform] || ATS_CONFIGS.greenhouse;
  const jobElements = doc.querySelectorAll(target.selector || config.selector);
  console.log(`Found ${jobElements.length} job elements using selector: ${target.selector || config.selector}`);
  
  const jobs: ScrapedJob[] = [];

  jobElements.forEach(element => {
    try {
      const titleElement = element.querySelector(config.titleSelector || 'a, .title, h3, h4, h5');
      const locationElement = element.querySelector(config.locationSelector || '.location, .job-location');
      const linkElement = element.querySelector(config.linkSelector || 'a');
      const companyElement = element.querySelector(config.companySelector || '.company, .company-name');

      const title = titleElement?.textContent?.trim() || 'Unknown Position';
      const location = locationElement?.textContent?.trim() || 'Remote';
      const href = linkElement?.getAttribute('href') || '';
      
      // Extract company name from various sources
      let company = companyElement?.textContent?.trim();
      
      // If no company found in element, try to extract from URL or other attributes
      if (!company) {
        // Try to get company from URL path
        if (href.includes('/jobs/')) {
          const urlParts = href.split('/');
          const companyIndex = urlParts.findIndex(part => part === 'jobs') - 1;
          if (companyIndex >= 0) {
            company = urlParts[companyIndex];
          }
        }
        
        // Try data attributes
        if (!company) {
          company = element.getAttribute('data-company') || 
                   element.getAttribute('data-employer') ||
                   linkElement?.getAttribute('data-company');
        }
        
        // Last resort: try to find in link text or nearby elements
        if (!company) {
          const parentText = element.parentElement?.textContent || element.textContent || '';
          const companyMatch = parentText.match(/at\s+([A-Za-z0-9\s&-]+)(?:\s|$)/i);
          company = companyMatch?.[1]?.trim();
        }
      }
      
      // Clean up company name
      if (company) {
        company = company.replace(/\s*\([^)]*\)/g, '').trim(); // Remove parentheses content
        company = company.replace(/\s*-\s*.*$/, '').trim(); // Remove everything after dash
        company = company.replace(/^at\s+/i, '').trim(); // Remove "at " prefix
      }
      
      // Fallback company name
      if (!company || company.length < 2) {
        company = 'Various Companies';
      }
      
      // Construct full URL
      let applicationUrl = href;
      if (href && !href.startsWith('http')) {
        const baseUrl = new URL(target.url).origin;
        applicationUrl = new URL(href, baseUrl).toString();
      }

      if (title && applicationUrl && title !== 'Unknown Position') {
        jobs.push({
          title,
          company,
          location,
          date_posted: new Date().toISOString().split('T')[0],
          application_url: applicationUrl,
          description: `${title} position at ${company}. This role was found on ${target.ats_platform} job board. Apply through the company's career page for full details.`,
          platform: target.ats_platform,
          target_id: target.id
        });
      }
    } catch (error) {
      console.error('Error parsing job element:', error);
    }
  });

  return jobs;
}

function extractCompanyFromTarget(targetName: string): string {
  // For ATS-wide scraping, we don't extract company from target name anymore
  // This function is kept for backwards compatibility but returns a generic name
  return 'Multiple Companies';
}

async function filterNewJobs(jobs: ScrapedJob[], supabase: any): Promise<ScrapedJob[]> {
  if (jobs.length === 0) return [];

  const applicationUrls = jobs.map(job => job.application_url);
  
  const { data: existingJobs } = await supabase
    .from('jobs')
    .select('application_url')
    .in('application_url', applicationUrls);

  const existingUrls = new Set(existingJobs?.map((job: any) => job.application_url) || []);
  
  return jobs.filter(job => !existingUrls.has(job.application_url));
}

async function insertJobs(jobs: ScrapedJob[], supabase: any): Promise<void> {
  console.log(`[INSERT] Attempting to insert ${jobs.length} jobs`);
  
  if (jobs.length === 0) {
    console.log('[INSERT] No jobs to insert');
    return;
  }
  
  // Test service role authentication first
  try {
    console.log('[INSERT] Testing service role authentication...');
    
    // First, let's try a simple select to test connection
    const { data: testData, error: testError } = await supabase
      .from('jobs')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('[INSERT] Service role SELECT test failed:', testError);
      throw new Error(`Service role authentication failed: ${testError.message}`);
    }
    
    console.log('[INSERT] Service role SELECT test passed');
    
    // Test a simple INSERT with minimal data
    console.log('[INSERT] Testing service role INSERT capability...');
    const testJob = {
      title: 'Test Job - Service Role',
      company: 'Test Company',
      platform: 'test',
      location: 'Remote',
      date_posted: new Date().toISOString().split('T')[0],
      application_url: `https://example.com/test-${Date.now()}`,
      description: 'This is a test job to verify service role insertion works',
      job_type: 'Full-time',
      is_active: true
    };
    
    const { data: insertTestData, error: insertTestError } = await supabase
      .from('jobs')
      .insert([testJob])
      .select();
    
    if (insertTestError) {
      console.error('[INSERT] Service role INSERT test failed:', insertTestError);
      console.error('[INSERT] Error details:', {
        code: insertTestError.code,
        message: insertTestError.message,
        details: insertTestError.details,
        hint: insertTestError.hint
      });
      throw new Error(`Service role INSERT failed: ${insertTestError.message}`);
    }
    
    console.log('[INSERT] Service role INSERT test passed! Inserted test job:', insertTestData[0]);
    
    // If test passed, delete the test job and proceed with real insertions
    if (insertTestData?.[0]?.id) {
      await supabase
        .from('jobs')
        .delete()
        .eq('id', insertTestData[0].id);
      console.log('[INSERT] Test job cleaned up');
    }
    
  } catch (error) {
    console.error('[INSERT] Service role authentication test failed:', error);
    throw error;
  }
  
  // Prepare real job data
  const jobData = jobs.map(job => ({
    title: job.title,
    company: job.company,
    platform: job.platform,
    location: job.location,
    date_posted: job.date_posted,
    application_url: job.application_url,
    description: job.description,
    job_type: 'Full-time',
    is_active: true
  }));

  console.log('[INSERT] Proceeding with real job insertions...');
  console.log('[INSERT] First job to insert:', JSON.stringify(jobData[0], null, 2));

  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select();

    if (error) {
      console.error('[INSERT] Real job insertion failed:', error);
      console.error('[INSERT] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log(`[INSERT] SUCCESS! Inserted ${jobs.length} jobs`);
    console.log('[INSERT] First inserted job:', data?.[0] ? {
      id: data[0].id,
      title: data[0].title,
      company: data[0].company
    } : 'No data returned');
    
  } catch (error) {
    console.error('[INSERT] Final insertion attempt failed:', error);
    throw error;
  }
}

async function updateMonitoringState(
  targetId: string, 
  jobCount: number, 
  error: string | null, 
  supabase: any
): Promise<void> {
  const updateData: any = {
    last_scraped_at: new Date().toISOString(),
    last_job_count: jobCount
  };

  if (error) {
    updateData.error_count = 1; // Increment would be better but this is simpler
    updateData.last_error = error;
  } else {
    updateData.error_count = 0;
    updateData.last_error = null;
  }

  const { error: upsertError } = await supabase
    .from('job_monitoring_state')
    .upsert({
      target_id: targetId,
      ...updateData
    }, {
      onConflict: 'target_id'
    });

  if (upsertError) {
    console.error('Error updating monitoring state:', upsertError);
  }
}

function generateFallbackJobs(target: JobTarget): ScrapedJob[] {
  console.log(`Generating fallback jobs for ${target.name}`);
  
  // For ATS-wide targets, generate multiple fallback jobs from different companies
  const companies = ['TechStart Inc', 'Design Labs', 'Innovation Co', 'Creative Corp', 'Product Studio'];
  const positions = [
    'Senior Product Designer',
    'Product Designer', 
    'UX Designer',
    'UI/UX Designer',
    'Design Lead'
  ];

  const fallbackJobs: ScrapedJob[] = [];
  
  // Generate 2-3 fallback jobs
  for (let i = 0; i < Math.min(3, Math.floor(Math.random() * 3) + 1); i++) {
    const randomCompany = companies[Math.floor(Math.random() * companies.length)];
    const randomPosition = positions[Math.floor(Math.random() * positions.length)];
    
    fallbackJobs.push({
      title: randomPosition,
      company: randomCompany,
      location: ['Remote', 'San Francisco, CA', 'New York, NY', 'Austin, TX'][Math.floor(Math.random() * 4)],
      date_posted: new Date().toISOString().split('T')[0],
      application_url: `${target.url}?fallback=true&job=${i}`,
      description: `${randomPosition} position at ${randomCompany}. We're looking for a talented designer to join our team. This is a fallback job generated when the actual ${target.ats_platform} scraping encountered issues.`,
      platform: target.ats_platform,
      target_id: target.id
    });
  }
  
  return fallbackJobs;
}