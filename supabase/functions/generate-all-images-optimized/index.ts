import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

// Text sanitization utility to handle Unicode characters safely
const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Map of common accented characters to their ASCII equivalents
  const accentMap: Record<string, string> = {
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
    'ý': 'y', 'ÿ': 'y', 'ñ': 'n', 'ç': 'c',
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
    'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O',
    'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
    'Ý': 'Y', 'Ÿ': 'Y', 'Ñ': 'N', 'Ç': 'C'
  };
  
  let sanitized = text;
  
  // Convert accented characters to ASCII equivalents
  for (const [accented, ascii] of Object.entries(accentMap)) {
    sanitized = sanitized.replace(new RegExp(accented, 'g'), ascii);
  }
  
  // Remove emojis and special Unicode characters
  sanitized = sanitized
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // symbols & pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // transport & map symbols
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // alchemical symbols
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // geometric shapes extended
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // supplemental arrows C
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // supplemental symbols and pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // chess symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // symbols and pictographs extended A
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // miscellaneous symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '');  // dingbats
  
  // Keep only alphanumeric characters, spaces, and basic punctuation
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.,!?()]/g, '');
  
  // Clean up multiple spaces and trim
  return sanitized.replace(/\s+/g, ' ').trim();
};

// Type definitions for better type safety
interface AspectRatioConfig {
  ratio: string;
  width: number;
  height: number;
}

interface GenerationResult {
  aspectRatio: string;
  url?: string;
  prompt?: string;
  fileName?: string;
  success: boolean;
  error?: string;
  cost: number;
  tokens: number;
}

interface BulkImageGenerationRequest {
  postId: string;
  title: string;
  description: string;
  category?: string;
  context?: 'card' | 'table';
  prompt?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Optimized aspect ratio configurations
const ASPECT_RATIOS: AspectRatioConfig[] = [
  { ratio: '16:9', width: 1792, height: 1024 },
  { ratio: '9:16', width: 1024, height: 1792 },
  { ratio: '4:3', width: 1536, height: 1024 },
  { ratio: '3:4', width: 1024, height: 1536 },
];

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const requestBody: BulkImageGenerationRequest = await req.json();
    let { postId, title, description, category = 'general', context, prompt } = requestBody;
    
    // Sanitize text inputs to prevent Unicode encoding issues
    title = sanitizeText(title || '');
    description = sanitizeText(description || '');
    category = sanitizeText(category);
    
    // Auth validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const userSupabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!postId || !title || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PERFORMANCE IMPROVEMENT #1: Generate single master prompt first
    let masterPrompt: string;
    let promptUsage = { estimated_cost: 0, total_tokens: 0 };

    // Use provided prompt if available, otherwise generate new one
    if (prompt) {
      masterPrompt = prompt;
    } else {
      // Step 1: Generate master prompt once
      const promptResponse = await supabase.functions.invoke('generate-image-prompt-dynamic', {
        body: { title, description, category }
      });

      if (promptResponse.error) {
        return new Response(JSON.stringify({ error: `Prompt generation failed: ${promptResponse.error.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      masterPrompt = promptResponse.data?.generatedPrompt;
      promptUsage = promptResponse.data?.usage || { estimated_cost: 0, total_tokens: 0 };

      if (!masterPrompt) {
        return new Response(JSON.stringify({ error: 'No prompt generated' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Step 2: Generate images in parallel using single master prompt with aspect ratio enhancements
    const generationPromises = ASPECT_RATIOS.map(async (aspectConfig): Promise<GenerationResult> => {
      const { ratio } = aspectConfig;
      
      try {
        // Enhance master prompt with aspect ratio context
        const enhancedPrompt = `${masterPrompt}

Composition optimized for ${ratio} aspect ratio format.`;

        // Step 2: Generate image using enhanced prompt
        const imageResponse = await supabase.functions.invoke('generate-image-gpt', {
          body: { 
            prompt: enhancedPrompt, 
            aspectRatio: ratio,
            category
          }
        });

        if (imageResponse.error) {
          throw new Error(`Image generation failed: ${imageResponse.error.message}`);
        }

        const base64Image = imageResponse.data?.image;
        const imageCost = imageResponse.data?.cost || 0;
        // Cost calculation: divide prompt cost among all 4 images for accurate tracking
        const promptCostPerImage = promptUsage?.estimated_cost / ASPECT_RATIOS.length || 0;
        const promptTokensPerImage = Math.ceil((promptUsage?.total_tokens || 0) / ASPECT_RATIOS.length);

        if (!base64Image) {
          throw new Error('No image generated');
        }

        // PERFORMANCE IMPROVEMENT #2: Optimized image processing
        // Create optimized file path structure
        const timestamp = Date.now();
        const fileName = `social-media/${user.id}/${postId}/${ratio.replace(':', 'x')}-${timestamp}.png`;
        
        // More efficient base64 conversion
        const imageData = base64Image.includes(',') 
          ? base64Image.split(',')[1] 
          : base64Image;
        
        const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('social-media-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('social-media-images')
          .getPublicUrl(fileName);

        return {
          aspectRatio: ratio,
          url: publicUrl,
          prompt: masterPrompt,
          fileName,
          success: true,
          cost: promptCostPerImage + imageCost,
          tokens: promptTokensPerImage
        };

      } catch (error) {
        return {
          aspectRatio: ratio,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          cost: 0,
          tokens: 0
        };
      }
    });

    // PERFORMANCE IMPROVEMENT #3: Wait for all operations, don't fail on single errors
    const results = await Promise.allSettled(generationPromises);
    const successfulResults: GenerationResult[] = [];
    const failedResults: GenerationResult[] = [];
    let totalCost = 0;
    let totalTokens = 0;

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const generationResult = result.value;
        totalCost += generationResult.cost;
        totalTokens += generationResult.tokens;
        
        if (generationResult.success) {
          successfulResults.push(generationResult);
        } else {
          failedResults.push(generationResult);
        }
      }
    });

    // PERFORMANCE IMPROVEMENT #4: Batch database updates
    if (successfulResults.length > 0) {
      // Build update object for all successful results
      const updateData: Record<string, any> = {
        generated_image_prompt: successfulResults[0]?.prompt || null
      };

      successfulResults.forEach(result => {
        const aspectKey = `image_${result.aspectRatio.replace(':', '_')}_url`;
        const statusKey = `image_${result.aspectRatio.replace(':', '_')}_status`;
        updateData[aspectKey] = result.url;
        updateData[statusKey] = 'complete';
      });

      // Single database update instead of multiple
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update(updateData)
        .eq('id', postId);

      if (updateError) {
        // Don't fail the entire operation for DB update issues
      }
    }

    // PERFORMANCE IMPROVEMENT #5: Background processing for non-critical operations
    // Use EdgeRuntime.waitUntil for non-blocking operations
    const backgroundTasks = async () => {
      // Track API usage
      try {
        await supabase
          .from('api_usage_tracking')
          .insert({
            user_id: user.id,
            function_name: 'generate-all-images-optimized',
            model_used: 'batch-operation',
            request_type: 'image_generation',
            success: successfulResults.length > 0,
            estimated_cost: totalCost,
            tokens_used: totalTokens,
            response_time_ms: Date.now() - startTime,
            request_metadata: {
              post_id: postId,
              successful_images: successfulResults.length,
              failed_images: failedResults.length,
              aspect_ratios: ASPECT_RATIOS.map(r => r.ratio),
              results: [...successfulResults, ...failedResults]
            }
          });
      } catch (error) {
        // API usage tracking failed
      }

      // Trigger background processing
      if (successfulResults.length > 0) {
        try {
          await supabase.functions.invoke('process-uploaded-images', {
            body: { 
              postId,
              imageUrls: successfulResults.map(r => r.url!),
              aspectRatios: successfulResults.map(r => r.aspectRatio)
            }
          });
        } catch (error) {
          // Background processing failed
        }
      }
    };

    // Use waitUntil if available (Edge Runtime), otherwise run in background
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(backgroundTasks());
    } else {
      backgroundTasks().catch(console.error);
    }

    const processingTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      results: successfulResults,
      failures: failedResults,
      totalCost,
      totalTokens,
      imagesGenerated: successfulResults.length,
      processingTimeMs: processingTime,
      aspectRatiosProcessed: ASPECT_RATIOS.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});