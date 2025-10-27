import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogoFetchResult {
  vendor_id: string;
  company_name: string;
  social_logo_url: string | null;
  landscape_logo_url: string | null;
  source: 'clearbit' | 'website' | 'failed';
  status: 'success' | 'partial' | 'failed';
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { vendor_id, vendor_ids, force = false } = await req.json();
    const ids = vendor_ids || (vendor_id ? [vendor_id] : []);

    if (ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'vendor_id or vendor_ids required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching logos for ${ids.length} vendors`);
    const results: LogoFetchResult[] = [];

    for (const id of ids) {
      const result = await fetchLogosForVendor(id, supabaseClient, force);
      results.push(result);
      
      // Add small delay between requests to be respectful
      if (ids.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-vendor-logos:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchLogosForVendor(
  vendorId: string,
  supabaseClient: any,
  force: boolean
): Promise<LogoFetchResult> {
  try {
    // Fetch vendor details
    const { data: vendor, error: fetchError } = await supabaseClient
      .from('vendors')
      .select('id, company_name, slug, website_url, social_logo_url, landscape_logo_url')
      .eq('id', vendorId)
      .single();

    if (fetchError || !vendor) {
      return {
        vendor_id: vendorId,
        company_name: 'Unknown',
        social_logo_url: null,
        landscape_logo_url: null,
        source: 'failed',
        status: 'failed',
        error: 'Vendor not found',
      };
    }

    // Skip if logos already exist and not forcing
    if (!force && vendor.social_logo_url && vendor.landscape_logo_url) {
      console.log(`Skipping ${vendor.company_name} - logos already exist`);
      return {
        vendor_id: vendor.id,
        company_name: vendor.company_name,
        social_logo_url: vendor.social_logo_url,
        landscape_logo_url: vendor.landscape_logo_url,
        source: 'clearbit',
        status: 'success',
        error: 'Skipped - logos already exist',
      };
    }

    const domain = extractDomain(vendor.website_url);
    if (!domain) {
      return {
        vendor_id: vendor.id,
        company_name: vendor.company_name,
        social_logo_url: null,
        landscape_logo_url: null,
        source: 'failed',
        status: 'failed',
        error: 'No valid domain found',
      };
    }

    console.log(`Fetching logos for ${vendor.company_name} (${domain})`);

    // Try Clearbit Logo API (free, no auth needed)
    const clearbitUrl = `https://logo.clearbit.com/${domain}`;
    const logoBlob = await fetchWithRetry(clearbitUrl);

    if (!logoBlob) {
      return {
        vendor_id: vendor.id,
        company_name: vendor.company_name,
        social_logo_url: null,
        landscape_logo_url: null,
        source: 'failed',
        status: 'failed',
        error: 'No logo found from Clearbit',
      };
    }

    // Upload to Supabase Storage
    const fileName = `${vendor.slug}-logo-${Date.now()}.png`;
    const filePath = `vendor-logos/${vendor.slug}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('images')
      .upload(filePath, logoBlob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        vendor_id: vendor.id,
        company_name: vendor.company_name,
        social_logo_url: null,
        landscape_logo_url: null,
        source: 'clearbit',
        status: 'failed',
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('images')
      .getPublicUrl(uploadData.path);

    const logoUrl = urlData.publicUrl;

    // Update vendor with both social and landscape logo URLs
    // (In reality, you'd want to create a landscape version, but for MVP we use same image)
    const { error: updateError } = await supabaseClient
      .from('vendors')
      .update({
        social_logo_url: logoUrl,
        landscape_logo_url: logoUrl, // Using same image for both for now
      })
      .eq('id', vendor.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return {
        vendor_id: vendor.id,
        company_name: vendor.company_name,
        social_logo_url: logoUrl,
        landscape_logo_url: logoUrl,
        source: 'clearbit',
        status: 'partial',
        error: `Logo fetched but update failed: ${updateError.message}`,
      };
    }

    console.log(`✅ Successfully fetched logo for ${vendor.company_name}`);
    return {
      vendor_id: vendor.id,
      company_name: vendor.company_name,
      social_logo_url: logoUrl,
      landscape_logo_url: logoUrl,
      source: 'clearbit',
      status: 'success',
    };
  } catch (error) {
    console.error(`Error processing vendor ${vendorId}:`, error);
    return {
      vendor_id: vendorId,
      company_name: 'Unknown',
      social_logo_url: null,
      landscape_logo_url: null,
      source: 'failed',
      status: 'failed',
      error: error.message,
    };
  }
}

function extractDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Blob | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LogoFetchBot/1.0)',
        },
      });

      if (response.ok) {
        return await response.blob();
      }

      if (response.status === 404) {
        return null; // Logo not found, don't retry
      }

      console.log(`Attempt ${i + 1} failed with status ${response.status}`);
    } catch (error) {
      console.error(`Attempt ${i + 1} error:`, error);
    }

    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }

  return null;
}
