import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helpers
function b64ToUint8Array(b64: string): Uint8Array {
  const cleaned = b64.includes(",") ? b64.split(",")[1] : b64; // strip data URL prefix if present
  const binary = atob(cleaned);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getUser(authToken: string, supabaseUrl: string, anonKey: string) {
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authToken } },
  });
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, themeId } = await req.json();
    if (!category) {
      return new Response(JSON.stringify({ error: "Missing category" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error("Supabase environment not configured");
    }

    // Get auth token and verify user
    const authToken = req.headers.get("Authorization") || "";
    if (!authToken) {
      throw new Error("Missing authorization header");
    }

    const user = await getUser(authToken, supabaseUrl, anonKey);
    const userId = user.id;

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch posts for this user, category (+ optional theme) missing 16:9
    let query = supabase
      .from("social_media_posts")
      .select("id, title, description, category, theme_id, image_16_9_url")
      .eq("user_id", userId)
      .eq("category", category)
      .is("image_16_9_url", null)
      .neq("status", "deleted")
      .or('image_16_9_status.is.null,image_16_9_status.neq.processing');

    if (themeId) query = query.eq("theme_id", themeId);

    const { data: posts, error: postsError } = await query;
    if (postsError) throw postsError;

    const toProcess = (posts || []);

    if (!toProcess.length) {
      return new Response(
        JSON.stringify({
          success: true,
          summary: { processed: 0, successCount: 0, failureCount: 0, skipped: 0 },
          message: "No posts need 16:9 generation",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Processing with small concurrency to avoid timeouts
    const concurrency = 3;
    let index = 0;
    let successCount = 0;
    let failureCount = 0;

    async function processOne(post: any) {
      try {
        // Mark as processing
        await supabase
          .from("social_media_posts")
          .update({ image_16_9_status: "processing", updated_at: new Date().toISOString() })
          .eq("id", post.id)
          .eq("user_id", userId);

        // Step 1: Generate prompt for the post
        const promptPayload = {
          category,
          title: post.title,
          description: post.description,
          context: "table",
          aspect_ratio: "16:9",
        } as Record<string, unknown>;

        const promptResp = await supabase.functions.invoke("generate-image-prompt-dynamic", {
          body: promptPayload,
          headers: { Authorization: authToken },
        });
        if (promptResp.error) throw promptResp.error;

        // Try to find prompt text in various shapes
        const promptData: any = promptResp.data || {};
        const prompt: string =
          promptData.image_prompt ||
          promptData.prompt ||
          promptData?.data?.image_prompt ||
          promptData?.result?.image_prompt ||
          JSON.stringify(promptData); // fallback to something

        // Step 2: Generate a 16:9 image
        const genResp = await supabase.functions.invoke("generate-image-gpt", {
          body: { prompt, aspectRatio: "16:9" },
          headers: { Authorization: authToken },
        });
        if (genResp.error) throw genResp.error;
        const genData: any = genResp.data || {};

        // Common possible keys
        const b64:
          | string
          = genData.image
          || genData.base64
          || genData.image_base64
          || genData.b64
          || genData?.data?.image
          || genData?.data?.b64
          || genData?.result?.image
          || genData?.result?.b64;

        if (!b64) throw new Error("No image base64 returned by generator");

        const bytes = b64ToUint8Array(b64);
        const filePath = `post-images/${userId}/${post.id}/16_9_${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("social-media-images")
          .upload(filePath, new Blob([bytes], { type: "image/png" }), {
            contentType: "image/png",
            upsert: true,
            cacheControl: "3600",
          });
        if (uploadError) throw uploadError;

        const { data: pub } = supabase.storage
          .from("social-media-images")
          .getPublicUrl(filePath);
        const publicUrl = pub?.publicUrl;
        if (!publicUrl) throw new Error("Failed to get public URL");

        const { error: updateErr } = await supabase
          .from("social_media_posts")
          .update({ image_16_9_url: publicUrl, image_16_9_status: "complete", updated_at: new Date().toISOString() })
          .eq("id", post.id)
          .eq("user_id", userId);
        if (updateErr) throw updateErr;

        successCount++;
      } catch (e) {
        console.error("Failed to process post", post?.id, e);
        failureCount++;
        try {
          await supabase
            .from("social_media_posts")
            .update({ image_16_9_status: "failed", updated_at: new Date().toISOString() })
            .eq("id", post.id)
            .eq("user_id", userId);
        } catch (_) {
          // ignore secondary errors
        }
      }
    }

    async function runPool() {
      const workers: Promise<void>[] = [];
      while (index < toProcess.length) {
        while (workers.length < concurrency && index < toProcess.length) {
          const p = processOne(toProcess[index++]);
          workers.push(p.then(() => {
            const i = workers.indexOf(p as any);
            if (i >= 0) workers.splice(i, 1);
          }));
        }
        // wait a bit before spawning new ones
        if (workers.length) await Promise.race(workers);
      }
      await Promise.allSettled(workers);
    }

    await runPool();

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          processed: toProcess.length,
          successCount,
          failureCount,
          skipped: 0,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("bulk-generate-16-9 error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
