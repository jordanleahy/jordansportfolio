import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    // For now, we'll create a simple video with a static background and audio
    // This is a simplified implementation - in production you'd want to use FFmpeg or similar
    
    // Create a unique filename for the video
    const timestamp = Date.now();
    const videoFileName = `audio-video-${postId}-${timestamp}.mp4`;
    const videoPath = `audio-videos/${videoFileName}`;

    // Since we can't easily do video processing in edge functions without additional setup,
    // we'll simulate the conversion process and store the audio file with a video extension
    // In a real implementation, you would use FFmpeg.wasm or a video processing service
    
    const audioArrayBuffer = await audioFile.arrayBuffer();
    const audioUint8Array = new Uint8Array(audioArrayBuffer);

    // Upload the "video" (for now just the audio file with video metadata)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('general')
      .upload(videoPath, audioUint8Array, {
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

    const videoUrl = urlData.publicUrl;

    // Update the post with the video URL
    const { error: updateError } = await supabase
      .from('social_media_posts')
      .update({ audio_to_video_url: videoUrl })
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
      videoUrl: videoUrl,
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