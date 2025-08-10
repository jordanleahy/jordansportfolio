/**
 * EDGE FUNCTION: Process Uploaded Images
 * 
 * PURPOSE:
 * Downloads external images and processes them for storage in Supabase Storage with watermarking.
 * Handles the complete image processing pipeline for social media posts by downloading from external URLs,
 * applying optional watermarks, uploading to managed storage, and updating database records.
 * 
 * INPUTS:
 * - imageUrl: string - External image URL to download and process
 * - postId: string - Social media post ID to associate with processed image
 * - aspectRatio: string - Target aspect ratio for image processing and filename
 * - watermarkText: string (optional, default: 'www.jordanleahy.com') - Watermark text overlay
 * 
 * OUTPUTS:
 * - Success: { success: true, processedImageUrl: string, message: string }
 * - Error: { success: false, error: string }
 * 
 * DEPENDENCIES:
 * - Supabase Storage (social-media-images bucket for file storage)
 * - Supabase Database (social_media_posts table for status and URL tracking)
 * 
 * USAGE:
 * Called from: Image upload workflows, social media content processing, external image integration
 * Authentication: Service role access for storage operations and database updates
 * 
 * FLOW:
 * 1. Update post status to 'processing' with aspect ratio specific field
 * 2. Download original image from provided external URL
 * 3. Process image (currently re-uploads as-is, TODO: implement server-side processing)
 * 4. Generate unique filename with watermark prefix and timestamp
 * 5. Upload processed image to Supabase Storage bucket
 * 6. Update social media post with processed image URL and 'complete' status
 * 7. Handle errors by updating status to 'failed' for proper error tracking
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { postId, watermarkText = 'www.jordanleahy.com' } = body;
    const imageUrl: string | undefined = body.imageUrl ?? (Array.isArray(body.imageUrls) ? body.imageUrls[0] : undefined);
    const aspectRatio: string | undefined = body.aspectRatio ?? (Array.isArray(body.aspectRatios) ? body.aspectRatios[0] : undefined);

    if (!imageUrl || !postId || !aspectRatio) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields: imageUrl, postId, aspectRatio' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`Processing image for post ${postId}, aspect ratio ${aspectRatio}`);
    // Update status to processing
    const statusField = `image_${aspectRatio}_status`;
    await supabase
      .from('social_media_posts')
      .update({ [statusField]: 'processing' })
      .eq('id', postId);

    // Download the original image
    console.log('Downloading original image from:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }
    
    const imageBlob = await imageResponse.blob();
    const imageArrayBuffer = await imageBlob.arrayBuffer();
    
    // For now, we'll just upload the original image as "processed"
    // TODO: Implement server-side image processing when canvas support is available
    console.log('Processing image by renaming and re-uploading...');
    
    const processedBlob = imageBlob;

    // Generate unique filename for processed image
    const timestamp = Date.now();
    const originalFilename = imageUrl.split('/').pop()?.split('?')[0] || 'image.jpg';
    const extension = originalFilename.split('.').pop() || 'jpg';
    const baseName = originalFilename.replace(`.${extension}`, '');
    const processedFilename = `${baseName}_watermarked_${aspectRatio}_${timestamp}.${extension}`;
    const filePath = processedFilename;

    // Upload processed image to storage
    console.log('Uploading processed image to storage:', filePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('social-media-images')
      .upload(filePath, processedBlob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload processed image: ${uploadError.message}`);
    }

    // Get public URL for processed image
    const { data: urlData } = supabase.storage
      .from('social-media-images')
      .getPublicUrl(uploadData.path);

    const processedImageUrl = urlData.publicUrl;

    // Update the database with processed image URL and status
    const imageUrlField = `image_${aspectRatio}_url`;
    const updateData = {
      [imageUrlField]: processedImageUrl,
      [statusField]: 'complete'
    };

    const { error: updateError } = await supabase
      .from('social_media_posts')
      .update(updateData)
      .eq('id', postId);

    if (updateError) {
      throw new Error(`Failed to update post: ${updateError.message}`);
    }

    console.log(`Successfully processed image for post ${postId}, aspect ratio ${aspectRatio}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedImageUrl,
        message: 'Image processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing image:', error);
    
    // Try to update status to failed if we have the necessary data
    try {
      const body = await req.clone().json();
      if (body.postId && body.aspectRatio) {
        const statusField = `image_${body.aspectRatio}_status`;
        await supabase
          .from('social_media_posts')
          .update({ [statusField]: 'failed' })
          .eq('id', body.postId);
      }
    } catch (updateError) {
      console.error('Failed to update status to failed:', updateError);
    }

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