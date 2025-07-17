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

    // For now, just store the audio file as-is since FFmpeg doesn't work in Edge Functions
    // In the future, this could be replaced with a cloud service for audio-to-video conversion
    const audioArrayBuffer = await audioFile.arrayBuffer();
    const audioData = new Uint8Array(audioArrayBuffer);

    // Create a unique filename for the audio file
    const timestamp = Date.now();
    const audioFileName = `audio-${postId}-${timestamp}.${audioFile.name.split('.').pop() || 'wav'}`;
    const audioPath = `audio-files/${audioFileName}`;

    // Upload the audio file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('general')
      .upload(audioPath, audioData, {
        contentType: audioFile.type || 'audio/wav',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(`Upload failed: ${uploadError.message}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Get the public URL for the audio file
    const { data: urlData } = supabase.storage
      .from('general')
      .getPublicUrl(audioPath);

    const audioUrl = urlData.publicUrl;

    // Update the post with the audio URL (stored in audio_to_video_url for now)
    const { error: updateError } = await supabase
      .from('social_media_posts')
      .update({ audio_to_video_url: audioUrl })
      .eq('id', postId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(`Database update failed: ${updateError.message}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('Audio file upload completed for post:', postId);

    return new Response(JSON.stringify({ 
      success: true, 
      audioUrl: audioUrl,
      message: 'Audio file uploaded successfully (video conversion temporarily disabled due to technical limitations)'
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