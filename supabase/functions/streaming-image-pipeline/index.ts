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
    const { postId, title, description, theme, category, aspectRatio, colorThemeId, mode, stream = true } = requestData;

    console.log(`Processing ${mode} image generation request for theme: ${theme}${category ? ` (category: ${category})` : ''}`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Check if streaming is requested
    if (stream) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send progress update with proper SSE formatting for large payloads
            const sendProgress = (stage: string, progress: number, data?: any) => {
              const message = JSON.stringify({ 
                type: 'progress', 
                stage, 
                progress, 
                postId,
                mode,
                ...data 
              });
              
              // For large messages (like base64 images), ensure proper chunk boundaries
              const formattedMessage = `data: ${message}\n\n`;
              
              try {
                controller.enqueue(encoder.encode(formattedMessage));
              } catch (error) {
                console.error('Error sending progress update:', error);
                // Try to send without the large data payload as fallback
                if (data && (data.partialImage || data.imageUrl)) {
                  const fallbackMessage = JSON.stringify({ 
                    type: 'progress', 
                    stage, 
                    progress, 
                    postId,
                    mode,
                    error: 'Image data too large for streaming'
                  });
                  controller.enqueue(encoder.encode(`data: ${fallbackMessage}\n\n`));
                }
              }
            };

            sendProgress('prompt_generation', 10);

            // Generate image prompt
            const prompt = await generateImagePrompt(title, description, theme, aspectRatio, category);
            console.log('Generated prompt:', prompt);

            sendProgress('prompt_generated', 30, { prompt });

            // Generate image with OpenAI Responses API
            sendProgress('image_generation', 50);

            const imageSize = getAspectRatioSize(aspectRatio);
            
            const requestBody = {
              model: 'gpt-4.1-mini',
              input: prompt,
              stream: true,
              tools: [{ 
                type: "image_generation", 
                partial_images: 2,
                size: imageSize,
                quality: 'high'
              }]
            };
            
            console.log('Making OpenAI Responses API request with:', {
              model: requestBody.model,
              promptLength: prompt.length,
              size: imageSize,
              partialImages: 2
            });

            const imageResponse = await fetch('https://api.openai.com/v1/responses', {
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

            if (!imageResponse.body) {
              throw new Error('No response body received');
            }

            const reader = imageResponse.body.getReader();
            const decoder = new TextDecoder();
            let finalBase64Image = '';
            let partialCount = 0;
            let buffer = ''; // Buffer for incomplete lines

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                
                // Add chunk to buffer
                buffer += chunk;
                
                // Split buffer by newlines, but keep the last incomplete line
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the last potentially incomplete line

                for (const line of lines) {
                  if (line.startsWith('data: ') && line.length > 6) {
                    const dataContent = line.slice(6).trim();
                    if (dataContent === '[DONE]') {
                      console.log('Received [DONE] signal from OpenAI');
                      continue;
                    }

                    if (!dataContent) {
                      continue; // Skip empty data lines
                    }

                    try {
                      const data = JSON.parse(dataContent);
                      console.log('Received streaming data:', { type: data.type });
                      
                      if (data.type === 'response.image_generation_call.partial_image') {
                        partialCount++;
                        const progressPercent = 60 + (partialCount * 5);
                        const imageBase64 = data.partial_image_b64;
                        
                        sendProgress(`partial_${partialCount}`, progressPercent, { 
                          partialImage: `data:image/png;base64,${imageBase64}`,
                          isPartial: true
                        });
                        
                        console.log(`Sent partial image ${partialCount}`);
                      } else if (data.type === 'response.image_generation_call.done') {
                        // Final image in result field
                        if (data.result) {
                          finalBase64Image = data.result;
                          
                          sendProgress('image_generated', 70, { 
                            partialImage: `data:image/png;base64,${finalBase64Image}`,
                            isPartial: false
                          });
                          
                          console.log('Received final image from result field');
                        }
                      } else if (data.output && Array.isArray(data.output)) {
                        // Check if output contains image generation results
                        for (const outputItem of data.output) {
                          if (outputItem.type === 'image_generation_call' && outputItem.result) {
                            finalBase64Image = outputItem.result;
                            
                            sendProgress('image_generated', 70, { 
                              partialImage: `data:image/png;base64,${finalBase64Image}`,
                              isPartial: false
                            });
                            
                            console.log('Received final image from output array');
                            break;
                          }
                        }
                      }
                    } catch (parseError) {
                      console.log('Could not parse JSON, skipping line:', line.substring(0, 100) + (line.length > 100 ? '...' : ''));
                      console.log('Parse error:', parseError.message);
                    }
                  }
                }
              }
              
              // Process any remaining data in buffer after stream ends
              if (buffer.trim() && buffer.startsWith('data: ')) {
                const dataContent = buffer.slice(6).trim();
                if (dataContent && dataContent !== '[DONE]') {
                  try {
                    const data = JSON.parse(dataContent);
                    console.log('Processed final buffered data:', { type: data.type });
                    
                    if (data.type === 'response.image_generation_call.done' && data.result) {
                      finalBase64Image = data.result;
                      console.log('Received final image from buffered data');
                    }
                  } catch (parseError) {
                    console.log('Could not parse final buffered JSON:', buffer.substring(0, 100));
                  }
                }
              }
            } finally {
              reader.releaseLock();
            }

            // If we still don't have a final image, try non-streaming fallback
            if (!finalBase64Image) {
              console.log('No final image from streaming, trying non-streaming fallback');
              
              const fallbackResponse = await fetch('https://api.openai.com/v1/images/generations', {
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
                  n: 1
                }),
              });

              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                if (fallbackData.data && fallbackData.data[0] && fallbackData.data[0].b64_json) {
                  finalBase64Image = fallbackData.data[0].b64_json;
                  console.log('Successfully generated image via fallback');
                  
                  sendProgress('image_generated', 70, { 
                    partialImage: `data:image/png;base64,${finalBase64Image}`,
                    isPartial: false
                  });
                }
              }
            }

            if (!finalBase64Image) {
              throw new Error('No final image received from OpenAI after trying both streaming and fallback methods');
            }

            // Upload to storage if user is authenticated
            let finalImageUrl = `data:image/png;base64,${finalBase64Image}`;
            
            if (userId) {
              sendProgress('uploading', 80);
              
              const fileName = `${theme.replace(/\s+/g, '_')}_theme_${aspectRatio.replace(':', '_')}_${Date.now()}.png`;
              const uploadedUrl = await uploadImageToStorage(supabase, finalBase64Image, fileName, userId);
            
              if (uploadedUrl) {
                finalImageUrl = uploadedUrl;
                
                // Update database if this is for a theme
                if (mode === 'theme' && theme && userId) {
                  console.log('🔄 Updating database for theme image generation:', {
                    theme,
                    category,
                    userId,
                    finalImageUrl
                  });
                  
                  const { data: updateData, error: updateError } = await supabase
                    .from('social_media_posts')
                    .update({
                      theme_image_4_3_url: finalImageUrl,
                      theme_image_generation_status: 'complete'
                    })
                    .eq('theme', theme)
                    .eq('user_id', userId)
                    .select();
                  
                  if (updateError) {
                    console.error('❌ Database update failed:', updateError);
                    throw new Error(`Database update failed: ${updateError.message}`);
                  } else {
                    console.log('✅ Database updated successfully:', {
                      updatedRows: updateData?.length || 0,
                      data: updateData
                    });
                  }
                }
              }
            }

            sendProgress('complete', 100, { 
              imageUrl: finalImageUrl,
              prompt: prompt
            });

            // Track successful API usage
            await trackApiUsage(supabase, 'streaming-image-pipeline', 'dall-e-3', true, 0.04, userId);

            controller.close();
            
          } catch (error) {
            console.error('Streaming error:', error);
            
            // Update status to failed in database
            if (mode === 'theme' && theme && userId) {
              console.log('❌ Updating database status to failed for:', { theme, category, userId });
              
              const { error: failError } = await supabase
                .from('social_media_posts')
                .update({ theme_image_generation_status: 'failed' })
                .eq('theme', theme)
                .eq('user_id', userId);
              
              if (failError) {
                console.error('❌ Failed to update status to failed:', failError);
              } else {
                console.log('✅ Successfully updated status to failed');
              }
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
      const prompt = await generateImagePrompt(title, description, theme, aspectRatio, category);
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
        const fileName = `${theme.replace(/\s+/g, '_')}_theme_${aspectRatio.replace(':', '_')}_${Date.now()}.png`;
        const uploadedUrl = await uploadImageToStorage(supabase, base64Image, fileName, userId);
        
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
          
          // Update database for non-streaming theme mode
          if (mode === 'theme' && theme) {
            console.log('🔄 Non-streaming: Updating database for theme image:', {
              theme,
              category,
              userId,
              finalImageUrl
            });
            
            const { data: updateData, error: updateError } = await supabase
              .from('social_media_posts')
              .update({
                theme_image_4_3_url: finalImageUrl,
                theme_image_generation_status: 'complete'
              })
              .eq('theme', theme)
              .eq('user_id', userId)
              .select();
            
            if (updateError) {
              console.error('❌ Non-streaming database update failed:', updateError);
            } else {
              console.log('✅ Non-streaming database updated successfully:', {
                updatedRows: updateData?.length || 0
              });
            }
          }
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