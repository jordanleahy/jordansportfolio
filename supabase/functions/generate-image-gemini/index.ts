import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

interface GeminiImageRequest {
  postId: string;
  prompt: string;
  aspectRatio?: string;
  category?: string | null;
  model?: string;
}

interface GeminiImageResponse {
  success: boolean;
  image?: string;
  aspectRatio?: string;
  size?: string;
  usage?: {
    estimated_cost: number;
  };
  processingTimeMs?: number;
  error?: string;
  message?: string;
  currentStatus?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const calculateGeminiCost = (size: string): number => {
  // Gemini pricing is more competitive - estimated costs
  const baseCosts: Record<string, number> = {
    '1024x1024': 0.025, // Lower cost than OpenAI
    '1536x1024': 0.05,
    '1024x1536': 0.05,
  };
  return baseCosts[size] || 0.025;
};

const getSizeFromAspectRatio = (aspectRatio: string): string => {
  const aspectMap: Record<string, string> = {
    '1:1': '1024x1024',
    '16:9': '1536x1024', 
    '9:16': '1024x1536',
    '4:3': '1536x1024',
    '3:4': '1024x1536'
  };
  return aspectMap[aspectRatio] || '1024x1024';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

  if (!googleApiKey) {
    console.error('❌ GOOGLE_API_KEY environment variable not found');
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Google API key not configured' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { postId, prompt, aspectRatio = '1:1', category, model = 'gemini-2.5-flash-image-preview' } = await req.json() as GeminiImageRequest;

    if (!postId || !prompt) {
      throw new Error('Missing required fields: postId and prompt');
    }

    console.log('🎨 Starting Gemini image generation', {
      postId,
      aspectRatio,
      model,
      promptLength: prompt.length
    });

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    const userId = user.id;
    const size = getSizeFromAspectRatio(aspectRatio);

    // Check if image is already being generated
    const statusField = `image_${aspectRatio.replace(':', '_')}_status`;
    const { data: existingPost } = await supabase
      .from('social_media_posts')
      .select(statusField)
      .eq('id', postId)
      .maybeSingle();

    if (existingPost && (existingPost as any)[statusField] === 'generating') {
      return new Response(JSON.stringify({
        success: false,
        currentStatus: 'generating',
        message: 'Image generation already in progress'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Set status to generating
    await supabase
      .from('social_media_posts')
      .update({ [statusField]: 'generating' })
      .eq('id', postId);

    // Generate image with Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate an image with the following description: ${prompt}. 
                   Aspect ratio: ${aspectRatio}. 
                   Style: Professional, modern, high-quality vector illustration.`
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('🔒 Gemini API error', response.status);
      
      // Track failed usage
      await supabase
        .from('api_usage_tracking')
        .insert({
          user_id: userId,
          function_name: 'generate-image-gemini',
          request_type: 'image_generation',
          model_used: model,
          success: false,
          estimated_cost: 0,
          image_size: size,
          response_time_ms: Date.now() - startTime,
          error_message: `Gemini API error: ${response.status}`,
          request_metadata: { postId, aspectRatio, category }
        });

      // Reset status
      await supabase
        .from('social_media_posts')
        .update({ [statusField]: 'failed' })
        .eq('id', postId);

      throw new Error(`Gemini API request failed with status ${response.status}`);
    }

    const responseData = await response.json();
    
    if (!responseData.candidates || !responseData.candidates[0]?.content?.parts) {
      throw new Error('No image generated by Gemini');
    }

    // Extract image data from response
    let imageData: string;
    const parts = responseData.candidates[0].content.parts;
    
    // Look for image data in the response
    const imagePart = parts.find((part: any) => part.inlineData?.data);
    if (imagePart) {
      imageData = imagePart.inlineData.data;
    } else {
      throw new Error('No image data found in Gemini response');
    }

    // Upload to Supabase Storage
    const fileName = `${postId}_${aspectRatio.replace(':', '_')}_${Date.now()}.png`;
    const filePath = `social-media-images/${fileName}`;

    // Convert base64 to blob
    const imageBlob = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
    
    const { error: uploadError } = await supabase.storage
      .from('social-media-images')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('social-media-images')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    const imageUrl = urlData.publicUrl;
    const processingTimeMs = Date.now() - startTime;
    const estimatedCost = calculateGeminiCost(size);

    // Update post with image URL and status
    const imageField = `image_${aspectRatio.replace(':', '_')}_url`;
    const updateData = {
      [imageField]: imageUrl,
      [statusField]: 'completed',
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('social_media_posts')
      .update(updateData)
      .eq('id', postId);

    if (updateError) {
      console.error('Failed to update post:', updateError);
    }

    // Track successful usage
    await supabase
      .from('api_usage_tracking')
      .insert({
        user_id: userId,
        function_name: 'generate-image-gemini',
        request_type: 'image_generation',
        model_used: model,
        success: true,
        estimated_cost: estimatedCost,
        image_size: size,
        response_time_ms: processingTimeMs,
        request_metadata: {
          postId,
          aspectRatio,
          category,
          imageUrl,
          fileName
        }
      });

    console.log('🎨 Gemini image generation successful', {
      postId,
      aspectRatio,
      processingTimeMs,
      estimatedCost,
      imageUrl: imageUrl.substring(0, 100) + '...'
    });

    const response_data: GeminiImageResponse = {
      success: true,
      image: imageUrl,
      aspectRatio,
      size,
      usage: { estimated_cost: estimatedCost },
      processingTimeMs
    };

    return new Response(JSON.stringify(response_data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    console.error('🚨 Gemini image generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      processingTimeMs
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});