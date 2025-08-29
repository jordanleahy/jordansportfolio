import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildGPT5Params, GPT5_MODELS } from '../_shared/gpt5-params.ts';

// CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PostStatus = "draft" | "scheduled" | "published";

interface ThemePost {
  day?: number; // 1-365 optional
  title: string; // 1-500
  story_description: string; // 1-2000
  status?: PostStatus; // default draft
}

interface ThemeImportData {
  category?: string; // 1-100 optional
  theme: string; // 1-200
  theme_description?: string; // <=1000
  posts: ThemePost[]; // 1-100
}

interface ProcessingResult {
  success: boolean;
  data?: ThemeImportData;
  errors: string[];
  warnings: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const text: string = typeof body.text === "string" ? body.text : "";

    if (!text || !text.trim()) {
      return json({ success: false, errors: ["Missing 'text'"], warnings: [] }, 400);
    }

    // If the user already pasted JSON, try to normalize locally without AI
    const normalized = await tryNormalizeLocal(text);
    if (normalized?.success) {
      return json(normalized);
    }

    // Otherwise call OpenAI to structure it
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      return json({ success: false, errors: ["OPENAI_API_KEY not configured"], warnings: [] }, 500);
    }

    const system = `You are a strict data structuring agent. Convert user text into EXACT JSON that matches this schema and constraints. Output ONLY raw JSON (no code fences, no commentary).

SCHEMA:
{
  "category": "string (1-100, optional)",
  "theme": "string (1-200, required)",
  "theme_description": "string (<=1000, optional)",
  "posts": [
    {
      "day": number (1-365, optional),
      "title": "string (1-500, required)",
      "story_description": "string (1-2000, required)",
      "status": "draft" | "scheduled" | "published" (default "draft")
    }
  ]
}

REQUIREMENTS:
- posts length: 1-100 max
- Trim whitespace, remove empty strings
- If category missing: set to "general"
- If status missing/invalid: set to "draft"
- If day missing: auto-increment starting at 1
- Map any fields like description -> story_description
- NEVER include markdown, explanations, or keys not in schema.
`;

    const user = `User text:\\n\\n${text}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGPT5Params({
        model: GPT5_MODELS.FLAGSHIP,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_completion_tokens: 2500,
      })),
    });

    if (!response.ok) {
      const errText = await response.text();
      return json({ success: false, errors: [
        `OpenAI error ${response.status}: ${errText}`
      ], warnings: [] }, 502);
    }

    const result = await response.json();
    const content = String(result?.choices?.[0]?.message?.content || "").trim();
    const cleaned = content.replace(/^```json\s*|\s*```$/g, "");

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return json({ success: false, errors: ["Model did not return valid JSON"], warnings: [] }, 500);
    }

    const { data, errors, warnings } = validateAndCoerce(parsed);
    const success = errors.length === 0;
    return json({ success, data: success ? data : undefined, errors, warnings }, success ? 200 : 400);
  } catch (e) {
    return json({ success: false, errors: [e instanceof Error ? e.message : "Unknown error"], warnings: [] }, 500);
  }
});

function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function tryNormalizeLocal(input: string): Promise<ProcessingResult | null> {
  try {
    const maybe = JSON.parse(input);
    const { data, errors, warnings } = validateAndCoerce(maybe);
    if (errors.length === 0) {
      return { success: true, data, errors, warnings };
    }
    return { success: false, errors, warnings };
  } catch {
    return null;
  }
}

function validateAndCoerce(obj: any): { data?: ThemeImportData; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const trim = (s: any) => (typeof s === "string" ? s.trim() : s);
  const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

  const out: ThemeImportData = {
    category: undefined,
    theme: "",
    theme_description: undefined,
    posts: [],
  };

  // category (optional, default general)
  if (obj?.category != null) {
    const c = String(obj.category).trim();
    if (c.length === 0) {
      warnings.push("Empty category removed; defaulting to 'general'.");
    } else if (c.length > 100) {
      out.category = c.slice(0, 100);
      warnings.push("Category truncated to 100 chars");
    } else {
      out.category = c;
    }
  }
  if (!out.category) out.category = "general";

  // theme (required)
  if (obj?.theme == null || String(obj.theme).trim().length === 0) {
    errors.push("theme is required");
  } else {
    const t = String(obj.theme).trim();
    out.theme = t.length > 200 ? (warnings.push("Theme truncated to 200 chars"), t.slice(0, 200)) : t;
  }

  // theme_description (optional)
  if (obj?.theme_description != null) {
    const d = String(obj.theme_description);
    out.theme_description = d.length > 1000 ? (warnings.push("theme_description truncated to 1000 chars"), d.slice(0, 1000)) : d;
  }

  // posts array (required 1-100)
  if (!Array.isArray(obj?.posts)) {
    errors.push("posts must be an array");
  } else if (obj.posts.length === 0) {
    errors.push("posts must contain at least 1 item");
  } else {
    let posts = obj.posts;

    if (posts.length > 100) {
      posts = posts.slice(0, 100);
      warnings.push("Limited posts to 100");
    }

    out.posts = posts.map((p: any, idx: number) => {
      const mapped: ThemePost = {
        title: "",
        story_description: "",
        status: "draft",
      };

      // day
      const dayVal = p?.day != null ? Number(p.day) : idx + 1;
      if (!Number.isFinite(dayVal)) {
        mapped.day = idx + 1;
        warnings.push(`Post ${idx + 1}: invalid day, auto-set`);
      } else {
        mapped.day = clamp(Math.round(dayVal), 1, 365);
      }

      // title
      const titleSrc = trim(p?.title);
      if (!titleSrc || typeof titleSrc !== "string" || titleSrc.length === 0) {
        errors.push(`Post ${idx + 1}: title is required`);
      } else {
        mapped.title = titleSrc.length > 500 ? (warnings.push(`Post ${idx + 1}: title truncated`), titleSrc.slice(0, 500)) : titleSrc;
      }

      // story_description (map description → story_description if needed)
      const descSrc = trim(p?.story_description ?? p?.description);
      if (!descSrc || typeof descSrc !== "string" || descSrc.length === 0) {
        errors.push(`Post ${idx + 1}: story_description is required`);
      } else {
        mapped.story_description = descSrc.length > 2000 ? (warnings.push(`Post ${idx + 1}: story_description truncated`), descSrc.slice(0, 2000)) : descSrc;
      }

      // status
      const statusSrc = String(p?.status || "draft").toLowerCase();
      mapped.status = (statusSrc === "draft" || statusSrc === "scheduled" || statusSrc === "published") ? (statusSrc as PostStatus) : "draft";
      if (mapped.status === "draft" && statusSrc !== "draft") {
        warnings.push(`Post ${idx + 1}: invalid status, set to draft`);
      }

      return mapped;
    });
  }

  if (out.posts.length === 0) {
    // Ensure type stability
    delete (out as any).posts;
  }

  return { data: out, errors, warnings };
}
