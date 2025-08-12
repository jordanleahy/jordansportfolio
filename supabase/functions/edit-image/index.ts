import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function mapSize(aspect?: string): string {
  const a = (aspect || "1:1").trim();
  if (a === "9:16") return "1024x1536"; // portrait
  if (a === "16:9") return "1536x1024"; // landscape (closest supported)
  return "1024x1024"; // square or fallback
}

function b64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not set in Supabase secrets' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase service credentials' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  try {
    const { prompt, imageUrl, aspectRatio, postId, userId } = await req.json();
    if (!prompt || !imageUrl) {
      return new Response(JSON.stringify({ error: 'Missing required fields: prompt and imageUrl' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const size = mapSize(aspectRatio);
    const correlationId = crypto.randomUUID();
    console.log(`✏️ edit-image start: ${correlationId}`);

    // Fetch the source image
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) throw new Error(`Failed to fetch source image: ${imgResp.status}`);
    const imgArrayBuffer = await imgResp.arrayBuffer();
    const imgBlob = new Blob([imgArrayBuffer], { type: 'image/png' });

    // Try OpenAI image edit first
    let b64: string | null = null;
    try {
      const form = new FormData();
      form.append('model', 'gpt-image-1');
      form.append('prompt', prompt);
      form.append('size', size);
      form.append('image', imgBlob, 'source.png');

      const aiResp = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openAIApiKey}` },
        body: form,
      });

      const aiJson = await aiResp.json();
      if (!aiResp.ok) {
        console.warn('OpenAI edits failed, falling back to generations:', aiJson);
      } else {
        b64 = aiJson?.data?.[0]?.b64_json || null;
      }
    } catch (e) {
      console.warn('Edits call threw, will try generations:', e);
    }

    // Fallback to generation referencing the image
    if (!b64) {
      const genBody = {
        model: 'gpt-image-1',
        prompt: `Edit this image: ${imageUrl}. ${prompt}`,
        size,
        response_format: 'b64_json',
        n: 1,
      };
      const genResp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(genBody),
      });
      const genJson = await genResp.json();
      if (!genResp.ok) {
        console.error('OpenAI generation failed:', genJson);
        return new Response(JSON.stringify({ error: 'OpenAI request failed', details: genJson }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      b64 = genJson?.data?.[0]?.b64_json || null;
      if (!b64) throw new Error('No image returned by OpenAI');
    }

    // Upload to storage (ensure bucket exists)
    const bucket = 'edited-images';
    try {
      const { error: bucketErr } = await supabaseAdmin.storage.createBucket(bucket, { public: true });
      if (bucketErr && !bucketErr.message?.includes('already exists')) {
        console.warn('createBucket error:', bucketErr);
      }
    } catch (_) {}

    const bytes = b64ToUint8Array(b64);
    const filePath = `edits/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.webp`;

    const { error: uploadErr } = await supabaseAdmin.storage.from(bucket).upload(filePath, bytes, {
      contentType: 'image/webp', upsert: true,
    });
    if (uploadErr) throw uploadErr;

    const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

    // Save version to database if postId and userId are provided
    if (postId && userId) {
      try {
        // Get next version number
        const { data: existingVersions } = await supabaseAdmin
          .from('image_versions')
          .select('version_number')
          .eq('post_id', postId)
          .eq('aspect_ratio', aspectRatio || '1:1')
          .order('version_number', { ascending: false })
          .limit(1);
        
        const nextVersionNumber = (existingVersions?.[0]?.version_number || 0) + 1;
        
        // Insert new version
        const { error: insertError } = await supabaseAdmin
          .from('image_versions')
          .insert({
            post_id: postId,
            aspect_ratio: aspectRatio || '1:1',
            original_url: imageUrl,
            edited_url: pub.publicUrl,
            edit_prompt: prompt,
            version_number: nextVersionNumber,
            user_id: userId
          });
          
        if (insertError) {
          console.error('Error saving image version:', insertError);
        } else {
          console.log(`✅ Saved version ${nextVersionNumber} for post ${postId}`);
        }
      } catch (saveError) {
        console.error('Error saving to database:', saveError);
        // Don't fail the whole request if database save fails
      }
    }

    const result = {
      url: pub.publicUrl,
      size,
      correlationId,
      costEstimate: 0.06,
      status: 'completed',
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('edit-image error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
