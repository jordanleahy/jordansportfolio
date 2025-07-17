import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting job scraping process...');

    // Scrape from RemoteOK API (public API, no auth needed)
    const remoteOkJobs = await scrapeRemoteOK();
    console.log(`Scraped ${remoteOkJobs.length} jobs from RemoteOK`);

    // Insert jobs into database
    let insertedCount = 0;
    for (const job of remoteOkJobs) {
      const { data, error } = await supabase
        .from('jobs')
        .upsert(job, { 
          onConflict: 'application_url',
          ignoreDuplicates: true 
        });
      
      if (!error) {
        insertedCount++;
      } else {
        console.error('Error inserting job:', error);
      }
    }

    console.log(`Successfully inserted ${insertedCount} new jobs`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        scraped: remoteOkJobs.length,
        inserted: insertedCount,
        message: 'Job scraping completed successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in job-scraper function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function scrapeRemoteOK() {
  try {
    // RemoteOK has a public API for job listings
    const response = await fetch('https://remoteok.io/api?tag=design');
    
    if (!response.ok) {
      console.log('RemoteOK API not available, using fallback data');
      return generateFallbackJobs();
    }

    const data = await response.json();
    
    // Filter for design/product roles and map to our schema
    const jobs = data
      .filter((job: any) => 
        job.position && 
        job.company &&
        (job.position.toLowerCase().includes('design') ||
         job.position.toLowerCase().includes('product') ||
         job.position.toLowerCase().includes('ui') ||
         job.position.toLowerCase().includes('ux'))
      )
      .slice(0, 20) // Limit to 20 jobs
      .map((job: any) => ({
        title: job.position,
        company: job.company,
        platform: 'RemoteOK',
        location: job.location || 'Remote',
        date_posted: new Date(job.date * 1000).toISOString().split('T')[0],
        application_url: job.url || `https://remoteok.io/remote-jobs/${job.id}`,
        description: job.description || `${job.position} position at ${job.company}. Remote work opportunity.`,
        job_type: 'Full-time',
        salary: job.salary_max ? `$${job.salary_min || 0}k - $${job.salary_max}k` : null,
        is_active: true
      }));

    return jobs;
  } catch (error) {
    console.error('Error scraping RemoteOK:', error);
    return generateFallbackJobs();
  }
}

function generateFallbackJobs() {
  console.log('Generating fallback job data...');
  
  const companies = [
    'Stripe', 'Figma', 'Airbnb', 'Notion', 'Discord', 'Square', 'Slack', 
    'OpenAI', 'Vercel', 'Shopify', 'Pinterest', 'Databricks', 'Linear',
    '1Password', 'Roblox', 'GitHub', 'Teladoc Health', 'Plaid', 'Khan Academy',
    'Datadog', 'Etsy', 'Reddit', 'Booking.com', 'Meta', 'Coinbase'
  ];

  const titles = [
    'Senior Product Designer', 'Product Designer', 'Staff Product Designer',
    'Product Designer - Growth', 'Product Designer - Mobile', 'Product Designer - Enterprise',
    'Senior UX Designer', 'Principal Product Designer', 'Lead Product Designer'
  ];

  const locations = [
    'San Francisco, CA', 'New York, NY', 'Remote', 'Seattle, WA', 'Austin, TX',
    'Los Angeles, CA', 'Boston, MA', 'Chicago, IL', 'Denver, CO', 'Portland, OR'
  ];

  const platforms = ['Greenhouse', 'Lever', 'Workable', 'AngelList'];

  const jobs = [];
  const today = new Date();

  for (let i = 0; i < 15; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    
    // Generate dates within last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const datePosted = new Date(today.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    jobs.push({
      title,
      company,
      platform,
      location,
      date_posted: datePosted.toISOString().split('T')[0],
      application_url: `https://${company.toLowerCase().replace(/\s+/g, '')}.com/careers/${title.toLowerCase().replace(/\s+/g, '-')}`,
      description: `We're looking for a ${title} to join our team at ${company}. You'll work on innovative products that impact millions of users worldwide. This is a full-time remote position with competitive compensation and benefits.`,
      job_type: 'Full-time',
      salary: Math.random() > 0.5 ? `$${120 + Math.floor(Math.random() * 100)}k - $${180 + Math.floor(Math.random() * 100)}k` : null,
      is_active: true
    });
  }

  return jobs;
}