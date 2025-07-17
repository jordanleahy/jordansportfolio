import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FFmpeg } from "https://esm.sh/@ffmpeg/ffmpeg@0.12.10";
import { toBlobURL } from "https://esm.sh/@ffmpeg/util@0.12.1";

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

    // Initialize FFmpeg
    const ffmpeg = new FFmpeg();
    
    // Load FFmpeg core
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    console.log('FFmpeg loaded successfully');

    // Convert audio file to Uint8Array
    const audioArrayBuffer = await audioFile.arrayBuffer();
    const audioData = new Uint8Array(audioArrayBuffer);

    // Write audio file to FFmpeg filesystem
    const inputFileName = 'input_audio.wav';
    const outputFileName = 'output_video.mp4';
    
    await ffmpeg.writeFile(inputFileName, audioData);

    // Create a video with a static background and the audio
    // This creates a proper MP4 video file with both video and audio streams
    await ffmpeg.exec([
      '-f', 'lavfi',
      '-i', 'color=c=black:size=1280x720:duration=10',
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-shortest',
      '-y',
      outputFileName
    ]);

    console.log('Video generation completed');

    // Read the generated video file
    const videoData = await ffmpeg.readFile(outputFileName);
    const videoUint8Array = new Uint8Array(videoData as ArrayBuffer);

    // Create a unique filename for the video
    const timestamp = Date.now();
    const videoFileName = `audio-video-${postId}-${timestamp}.mp4`;
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