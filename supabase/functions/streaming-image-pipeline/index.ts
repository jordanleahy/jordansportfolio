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
  theme: string;
  category?: string;
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

const generateImagePrompt = async (title: string, description: string, theme: string, aspectRatio: string, category?: string): Promise<string> => {
  console.log(`Generating image prompt for: ${title} (${theme}, ${aspectRatio})`);
  
  const systemPrompt = `You are an expert at creating detailed, professional image generation prompts for ${theme}-themed AI image generators.

Create prompts that will generate:
- Professional, credible visuals suitable for ${theme} content
- Clear focal points that support the content message
- Appropriate industry context and environmental elements
- Balanced composition with good visual hierarchy
- Consistent branding feel across different ${theme} topics
${category ? `- Context-aware visuals that relate to ${category} industry` : ''}

CRITICAL FORMATTING RULES:
- DO NOT include any title, headline, or text overlays in the generated image
- Include the aspect ratio naturally within the prompt description (e.g., "in a ${aspectRatio} landscape format")
- Focus purely on the visual elements, composition, and professional aesthetic
- End the prompt with a period, no additional formatting or labels

Generate professional, high-quality visual prompts that seamlessly integrate the specified aspect ratio without adding formatting labels or hardcoded text.`;

  const userPrompt = `Title: ${title}
Description: ${description}
Theme: ${theme}
${category ? `Category Context: ${category}` : ''}
Aspect Ratio: ${aspectRatio}

Create a detailed image generation prompt for this ${theme} content${category ? ` within the ${category} context` : ''}.`;

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
      max_completion_tokens: 500
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
};

const getAspectRatioSize = (aspectRatio: string): string => {
  // GPT-Image-1 supported sizes
  const sizeMap: Record<string, string> = {
    '16:9': '1536x1024',  // Landscape
    '9:16': '1024x1536',  // Portrait
    '4:3': '1024x1024',   // Square (closest to 4:3)
    '3:4': '1024x1536',   // Portrait (closest to 3:4)
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
        contentType: 'image/jpeg',
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
    const { postId, title, description, theme, category, aspectRatio, colorThemeId, mode, stream = true } = requestData;

    console.log(`Processing ${mode} image generation request for theme: ${theme}${category ? ` (category: ${category})` : ''}`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // NOTE: This function is now focused on individual post images only
    // Theme image generation is handled by the generate-day-1-4-3 function
    if (mode === 'theme') {
      console.log('ℹ️ Theme mode detected - this function now handles individual post images only');
      console.log('ℹ️ For Day 1 theme images, use the generate-day-1-4-3 function instead');
    }

    // Check if streaming is requested
    if (stream) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send progress update with proper SSE formatting
            const sendProgress = (stage: string, progress: number, data?: any) => {
              const message = JSON.stringify({ 
                type: 'progress', 
                stage, 
                progress, 
                postId,
                mode,
                ...data 
              });
              
              const formattedMessage = `data: ${message}\n\n`;
              
              try {
                controller.enqueue(encoder.encode(formattedMessage));
              } catch (error) {
                console.error('Error sending progress update:', error);
              }
            };

            sendProgress('prompt_generation', 10);

            // Generate image prompt
            const prompt = await generateImagePrompt(title, description, theme, aspectRatio, category);
            console.log('Generated prompt:', prompt);

            sendProgress('prompt_generated', 30, { prompt });

            // Generate image with OpenAI
            sendProgress('image_generation', 50);

            const imageSize = getAspectRatioSize(aspectRatio);
            
            const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-image-1',
                prompt: prompt,
                size: imageSize,
                quality: 'high',
                output_format: 'jpeg',
                n: 1
              }),
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
            const finalBase64Image = imageData.data[0].b64_json;

            sendProgress('image_generated', 70, { 
              partialImage: `data:image/jpeg;base64,${finalBase64Image}`,
              isPartial: false
            });

            // Upload to storage if user is authenticated
            let finalImageUrl = `data:image/jpeg;base64,${finalBase64Image}`;
            
            if (userId) {
              sendProgress('uploading', 80);
              
              const fileName = `${theme.replace(/\s+/g, '_')}_${aspectRatio.replace(':', '_')}_${Date.now()}.jpg`;
              const uploadedUrl = await uploadImageToStorage(supabase, finalBase64Image, fileName, userId);
            
              if (uploadedUrl) {
                finalImageUrl = uploadedUrl;
              }
            }

            sendProgress('complete', 100, { 
              imageUrl: finalImageUrl,
              prompt: prompt
            });

            // Track successful API usage
            await trackApiUsage(supabase, 'streaming-image-pipeline', 'gpt-image-1', true, 0.04, userId);

            controller.close();
            
          } catch (error) {
            console.error('Streaming error:', error);
            
            // Track failed API usage
            await trackApiUsage(supabase, 'streaming-image-pipeline', 'gpt-image-1', false, 0, userId, error.message);
            
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
      const prompt = await generateImagePrompt(title, description, theme, aspectRatio, category);
      const imageSize = getAspectRatioSize(aspectRatio);
      
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: prompt,
          size: imageSize,
          quality: 'high',
          output_format: 'jpeg',
          n: 1
        }),
      });

      if (!imageResponse.ok) {
        throw new Error(`OpenAI API error: ${imageResponse.status}`);
      }

      const imageData = await imageResponse.json();
      const base64Image = imageData.data[0].b64_json;
      
      let finalImageUrl = `data:image/jpeg;base64,${base64Image}`;
      
      if (userId) {
        const fileName = `${theme.replace(/\s+/g, '_')}_${aspectRatio.replace(':', '_')}_${Date.now()}.jpg`;
        const uploadedUrl = await uploadImageToStorage(supabase, base64Image, fileName, userId);
        
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      await trackApiUsage(supabase, 'streaming-image-pipeline', 'gpt-image-1', true, 0.04, userId);

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