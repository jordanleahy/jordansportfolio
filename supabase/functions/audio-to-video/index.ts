import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cloudinaryCloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')!;
const cloudinaryApiKey = Deno.env.get('CLOUDINARY_API_KEY')!;
const cloudinaryApiSecret = Deno.env.get('CLOUDINARY_API_SECRET')!;

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const postId = formData.get('postId') as string;

    if (!audioFile || !postId) {
      return new Response('Missing audio file or post ID', { status: 400, headers: corsHeaders });
    }

    console.log('Processing audio file:', audioFile.name, 'for post:', postId);

    // Convert audio file to array buffer for Cloudinary upload
    const audioArrayBuffer = await audioFile.arrayBuffer();
    
    // Create authentication for signed upload
    const timestamp = Math.round(Date.now() / 1000);
    
    // Create string to sign - ONLY include timestamp for basic upload
    const stringToSign = `timestamp=${timestamp}${cloudinaryApiSecret}`;
    
    console.log('String to sign:', stringToSign);
    
    // Generate signature using crypto
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Generated signature:', signature);

    // Create form data for Cloudinary upload (signed upload)
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', new Blob([audioArrayBuffer], { type: audioFile.type }), audioFile.name);
    cloudinaryFormData.append('api_key', cloudinaryApiKey);
    cloudinaryFormData.append('timestamp', timestamp.toString());
    cloudinaryFormData.append('signature', signature);

    console.log('Uploading audio to Cloudinary...');

    // Upload to Cloudinary
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/video/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData
      }
    );

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error('Cloudinary upload failed:', errorText);
      return new Response(`Cloudinary upload failed: ${errorText}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const cloudinaryResult = await cloudinaryResponse.json();
    console.log('Cloudinary upload successful, public_id:', cloudinaryResult.public_id);

    // Generate video with waveform using Cloudinary's transformation URL
    const videoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/video/upload/f_mp4,fl_waveform,c_scale,w_1280,h_720,b_black,ac_aac,vc_h264/${cloudinaryResult.public_id}.mp4`;
    
    console.log('Generated video URL:', videoUrl);

    // Wait a moment for Cloudinary to process the transformation
    console.log('Waiting for Cloudinary processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Download the processed video from Cloudinary
    console.log('Downloading processed video from Cloudinary...');
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      console.error('Failed to download video from Cloudinary, status:', videoResponse.status);
      // Try without waveform as fallback
      const fallbackUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/video/upload/f_mp4,c_scale,w_1280,h_720,b_black,ac_aac,vc_h264/${cloudinaryResult.public_id}.mp4`;
      console.log('Trying fallback URL:', fallbackUrl);
      const fallbackResponse = await fetch(fallbackUrl);
      if (!fallbackResponse.ok) {
        return new Response('Failed to download processed video from Cloudinary', { 
          status: 500, 
          headers: corsHeaders 
        });
      }
      const videoArrayBuffer = await fallbackResponse.arrayBuffer();
      var videoUint8Array = new Uint8Array(videoArrayBuffer);
    } else {
      const videoArrayBuffer = await videoResponse.arrayBuffer();
      var videoUint8Array = new Uint8Array(videoArrayBuffer);
    }

    console.log('Video downloaded from Cloudinary, size:', videoUint8Array.length);

    // Create a unique filename for the video
    const fileTimestamp = Date.now();
    const videoFileName = `audio-video-${postId}-${fileTimestamp}.mp4`;
    const videoPath = `audio-videos/${videoFileName}`;

    // Upload the real video file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('general')
      .upload(videoPath, videoUint8Array, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(`Upload failed: ${uploadError.message}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('general')
      .getPublicUrl(videoPath);

    const finalVideoUrl = urlData.publicUrl;

    // Update the post with the video URL
    const { error: updateError } = await supabase
      .from('social_media_posts')
      .update({ audio_to_video_url: finalVideoUrl })
      .eq('id', postId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(`Database update failed: ${updateError.message}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('Audio-to-video conversion completed for post:', postId);

    return new Response(JSON.stringify({ 
      success: true, 
      videoUrl: finalVideoUrl,
      message: 'Audio converted to video successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in audio-to-video function:', error);
    return new Response(`Internal server error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});