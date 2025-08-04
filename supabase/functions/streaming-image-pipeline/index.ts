import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

interface StreamingImageRequest {
  postId?: string;
  title: string;
  description: string;
  category: string;
  aspectRatio: '4:3' | '16:9' | '9:16' | '3:4';
  colorThemeId?: string;
  mode: 'theme' | 'single' | 'bulk';
  stream?: boolean;
}

const trackApiUsage = async (supabase: any, functionName: string, model: string, success: boolean, cost: number, userId?: string, error?: string) => {
  await supabase.from('api_usage_tracking').insert({
    user_id: userId,
    function_name: functionName,
    model_used: model,
    request_type: 'image_generation',
    success,
    estimated_cost: cost,
    error_message: error
  });
};

const generateImagePrompt = async (title: string, description: string, category: string, aspectRatio: string): Promise<string> => {
  console.log(`Generating image prompt for: ${title} (${category}, ${aspectRatio})`);
  
  const systemPrompt = `You are an expert at creating detailed, professional image generation prompts for ${category}-themed AI image generators.

Create prompts that will generate:
- Professional, credible visuals suitable for ${category} content
- Clear focal points that support the content message
- Appropriate industry context and environmental elements
- Balanced composition with good visual hierarchy
- Consistent branding feel across different ${category} topics

CRITICAL FORMATTING RULES:
- DO NOT include any title, headline, or text overlays in the generated image
- Include the aspect ratio naturally within the prompt description (e.g., "in a ${aspectRatio} landscape format")
- Focus purely on the visual elements, composition, and professional aesthetic
- End the prompt with a period, no additional formatting or labels

Generate professional, high-quality visual prompts that seamlessly integrate the specified aspect ratio without adding formatting labels or hardcoded text.`;

  const userPrompt = `Title: ${title}
Description: ${description}
Aspect Ratio: ${aspectRatio}

Create a detailed image generation prompt for this ${category} content.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 500
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
};

const getAspectRatioSize = (aspectRatio: string): string => {
  // DALL-E 3 only supports these specific sizes
  const sizeMap: Record<string, string> = {
    '16:9': '1792x1024',  // Landscape
    '9:16': '1024x1792',  // Portrait
    '4:3': '1024x1024',   // Square (closest to 4:3)
    '3:4': '1024x1792',   // Portrait (closest to 3:4)
    '1:1': '1024x1024'    // Square
  };
  return sizeMap[aspectRatio] || '1024x1024';
};

const uploadImageToStorage = async (supabase: any, imageData: string, fileName: string, userId: string): Promise<string | null> => {
  try {
    // Convert base64 to file
    const byteCharacters = atob(imageData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    const filePath = `${userId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('social-media-images')
      .upload(filePath, byteArray, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('social-media-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }

    const requestData: StreamingImageRequest = await req.json();
    const { postId, title, description, category, aspectRatio, colorThemeId, mode, stream = true } = requestData;

    console.log(`Processing ${mode} image generation request for category: ${category}`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Check if streaming is requested
    if (stream) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send progress update
            const sendProgress = (stage: string, progress: number, data?: any) => {
              const message = JSON.stringify({ 
                type: 'progress', 
                stage, 
                progress, 
                postId,
                mode,
                ...data 
              });
              controller.enqueue(encoder.encode(`data: ${message}\n\n`));
            };

            sendProgress('prompt_generation', 10);

            // Generate image prompt
            const prompt = await generateImagePrompt(title, description, category, aspectRatio);
            console.log('Generated prompt:', prompt);

            sendProgress('prompt_generated', 30, { prompt });

            // Generate image with OpenAI
            sendProgress('image_generation', 50);

            const imageSize = getAspectRatioSize(aspectRatio);
            
            const requestBody = {
              model: 'gpt-image-1',
              prompt: prompt,
              size: imageSize,
              quality: 'high',
              n: 1
            };
            
            console.log('Making OpenAI request with:', {
              model: requestBody.model,
              promptLength: prompt.length,
              size: requestBody.size,
              quality: requestBody.quality
            });

            const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            if (!imageResponse.ok) {
              const errorText = await imageResponse.text();
              console.error('OpenAI API error details:', {
                status: imageResponse.status,
                statusText: imageResponse.statusText,
                error: errorText
              });
              throw new Error(`OpenAI API error: ${imageResponse.status} - ${errorText}`);
            }

            const imageData = await imageResponse.json();
            
            // Handle partial images for smooth streaming
            if (imageData.data && imageData.data.length > 0) {
              const images = imageData.data;
              
              // Send partial images with smooth progression
              for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const isPartial = i < images.length - 1;
                const progressPercent = isPartial ? 60 + (i * 5) : 70;
                const stage = isPartial ? `partial_${i + 1}` : 'image_generated';
                
                sendProgress(stage, progressPercent, { 
                  partialImage: `data:image/png;base64,${image.b64_json}`,
                  isPartial: isPartial
                });
                
                console.log(`Sent ${isPartial ? 'partial' : 'final'} image ${i + 1}/${images.length}`);
              }
              
              // Use the final image for storage
              const finalBase64Image = images[images.length - 1].b64_json;

              // Upload to storage if user is authenticated
              let finalImageUrl = `data:image/png;base64,${finalBase64Image}`;
              
              if (userId) {
                sendProgress('uploading', 80);
                
                const fileName = `${category}_theme_${aspectRatio.replace(':', '_')}_${Date.now()}.png`;
                const uploadedUrl = await uploadImageToStorage(supabase, finalBase64Image, fileName, userId);
              
                if (uploadedUrl) {
                  finalImageUrl = uploadedUrl;
                  
                  // Update database if this is for a theme
                  if (mode === 'theme' && category && userId) {
                    await supabase
                      .from('social_media_posts')
                      .update({
                        theme_image_4_3_url: finalImageUrl,
                        theme_image_generation_status: 'complete'
                      })
                      .eq('category', category)
                      .eq('user_id', userId);
                  }
                }
              }

              sendProgress('complete', 100, { 
                imageUrl: finalImageUrl,
                prompt: prompt
              });
            } else {
              throw new Error('No image data received from OpenAI');
            }

            // Track successful API usage
            await trackApiUsage(supabase, 'streaming-image-pipeline', 'dall-e-3', true, 0.04, userId);

            controller.close();
            
          } catch (error) {
            console.error('Streaming error:', error);
            
            // Update status to failed in database
            if (mode === 'theme' && category && userId) {
              await supabase
                .from('social_media_posts')
                .update({ theme_image_generation_status: 'failed' })
                .eq('category', category)
                .eq('user_id', userId);
            }
            
            // Track failed API usage
            await trackApiUsage(supabase, 'streaming-image-pipeline', 'dall-e-3', false, 0, userId, error.message);
            
            const errorMessage = JSON.stringify({
              type: 'error',
              message: error.message,
              postId,
              mode
            });
            controller.enqueue(encoder.encode(`data: ${errorMessage}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
        },
      });
    } else {
      // Non-streaming response for backwards compatibility
      const prompt = await generateImagePrompt(title, description, category, aspectRatio);
      const imageSize = getAspectRatioSize(aspectRatio);
      
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          size: imageSize,
          quality: 'hd',
          response_format: 'b64_json',
          n: 1
        }),
      });

      if (!imageResponse.ok) {
        throw new Error(`OpenAI API error: ${imageResponse.status}`);
      }

      const imageData = await imageResponse.json();
      const base64Image = imageData.data[0].b64_json;
      
      let finalImageUrl = `data:image/png;base64,${base64Image}`;
      
      if (userId) {
        const fileName = `${category}_theme_${aspectRatio.replace(':', '_')}_${Date.now()}.png`;
        const uploadedUrl = await uploadImageToStorage(supabase, base64Image, fileName, userId);
        
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      await trackApiUsage(supabase, 'streaming-image-pipeline', 'dall-e-3', true, 0.04, userId);

      return new Response(JSON.stringify({
        success: true,
        imageUrl: finalImageUrl,
        prompt: prompt
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in streaming-image-pipeline:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});