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
    const { imageUrl, postId, aspectRatio, watermarkText = 'www.jordanleahy.com' } = await req.json();
    
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
    
    // Create a canvas for image processing
    const canvas = new OffscreenCanvas(1920, 1080); // Default size, will be adjusted
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Create image from blob
    const img = new Image();
    const imageDataUrl = `data:${imageBlob.type};base64,${btoa(String.fromCharCode(...new Uint8Array(imageArrayBuffer)))}`;
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageDataUrl;
    });

    // Calculate optimal dimensions (max 1920px on either side)
    let { width, height } = img;
    const maxDimension = 1920;
    
    if (width > maxDimension || height > maxDimension) {
      const scaleFactor = Math.min(maxDimension / width, maxDimension / height);
      width = Math.floor(width * scaleFactor);
      height = Math.floor(height * scaleFactor);
    }

    // Resize canvas to optimal dimensions
    canvas.width = width;
    canvas.height = height;

    // Draw the resized image
    ctx.drawImage(img, 0, 0, width, height);

    // Add watermark
    const fontSize = Math.max(14, Math.min(width * 0.025, 28));
    ctx.font = `${fontSize}px Arial`;
    
    // Measure text to center it
    const textMetrics = ctx.measureText(watermarkText);
    const textWidth = textMetrics.width;
    
    // Position at center
    const centerX = width / 2;
    const centerY = height / 2;

    // Save context for rotation
    ctx.save();
    
    // Rotate 15 degrees for diagonal effect
    ctx.translate(centerX, centerY);
    ctx.rotate(-15 * Math.PI / 180);
    
    // Set subtle styling
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 0.5;
    
    // Draw watermark text at origin (now rotated center)
    ctx.fillText(watermarkText, -textWidth / 2, fontSize / 3);
    ctx.strokeText(watermarkText, -textWidth / 2, fontSize / 3);
    
    // Restore context
    ctx.restore();

    // Convert canvas to blob
    const processedBlob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.9
    });

    // Generate unique filename for processed image
    const timestamp = Date.now();
    const originalFilename = imageUrl.split('/').pop()?.split('?')[0] || 'image.jpg';
    const extension = originalFilename.split('.').pop() || 'jpg';
    const baseName = originalFilename.replace(`.${extension}`, '');
    const processedFilename = `${baseName}_watermarked_${aspectRatio}_${timestamp}.${extension}`;
    const filePath = `general/${processedFilename}`;

    // Upload processed image to storage
    console.log('Uploading processed image to storage:', filePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, processedBlob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload processed image: ${uploadError.message}`);
    }

    // Get public URL for processed image
    const { data: urlData } = supabase.storage
      .from('images')
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