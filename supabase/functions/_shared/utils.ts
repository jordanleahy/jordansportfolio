import { SupabaseClient } from './types.ts';
import { createLogger, AdvancedLogger } from './advanced-logger.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const streamingCorsHeaders = {
  ...corsHeaders,
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

// Helper function to safely update generation status
export const updateThemeImageStatus = async (
  supabase: SupabaseClient, 
  status: string, 
  themeId: string, 
  userId: string, 
  imageUrl?: string
): Promise<void> => {
  console.log(`🔄 Updating theme image status to '${status}' for theme ID: ${themeId}`);
  
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('social_media_posts')
    .update(updateData)
    .eq('theme_id', themeId)
    .eq('user_id', userId)
    .select('id, title');

  if (error) {
    console.error(`❌ Failed to update theme image status:`, error);
    throw new Error(`Database update failed: ${error.message}`);
  }
  
  console.log(`✅ Updated ${data?.length || 0} posts to status '${status}' for theme ID: ${themeId}`);
};

// Helper function to generate image prompt using OpenAI
export const generateImagePrompt = async (
  title: string, 
  description: string, 
  theme: string, 
  category: string
): Promise<string> => {
  const correlationId = `img-prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const logger = createLogger({
    correlationId,
    functionName: 'generateImagePrompt',
    operation: 'openai_chat_completion',
    metadata: { theme, category }
  });

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    logger.error('OpenAI API key not configured');
    throw new Error('OpenAI API key not configured');
  }

  logger.info('Starting image prompt generation', {
    theme,
    category,
    titleLength: title.length,
    descriptionLength: description.length
  });
  
  const systemPrompt = `You are an expert at creating clear, professional image generation prompts for ${theme}.

Private Safe Space principles:
- Supportive, inclusive, non-judgmental tone
- Respect privacy: no PII or identifiable people; use abstract or generic figures when needed
- No text overlays, headlines, or logos in the generated image

Create prompts that will generate:
- Professional visuals suitable for ${theme}
- Clear focal points that support the message
- Appropriate context and environment
- Balanced composition and approachable aesthetic

Formatting:
- Output only the final prompt as plain text
- Do not add markdown or labels
- If an aspect ratio is known, mention it naturally in the composition.`;

  const userPrompt = `Title: ${title}
Description: ${description}
Theme: ${theme}
Category: ${category}

Create a detailed image generation prompt for this ${theme} theme content.`;

  const requestBody = {
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_completion_tokens: 500
  };

  logger.info('OpenAI chat request prepared', {
    model: requestBody.model,
    max_completion_tokens: requestBody.max_completion_tokens,
    systemPromptLength: systemPrompt.length,
    userPromptLength: userPrompt.length,
    correlationId
  });

  const startTime = Date.now();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('OpenAI API error response', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorBody.substring(0, 500),
        processingTimeMs: processingTime,
        requestModel: requestBody.model,
        requestParams: {
          max_completion_tokens: requestBody.max_completion_tokens
        }
      });
      throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    
    logger.success('OpenAI chat completion successful', {
      processingTimeMs: processingTime,
      responseLength: data.choices?.[0]?.message?.content?.length || 0,
      finishReason: data.choices?.[0]?.finish_reason,
      usage: data.usage
    });

    return data.choices[0].message.content;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('OpenAI request failed', {
      error: error.message,
      processingTimeMs: processingTime,
      requestModel: requestBody.model
    });
    throw error;
  }
};

// Helper function to generate theme image using OpenAI
export const generateThemeImage = async (
  supabase: SupabaseClient, 
  prompt: string, 
  theme: string, 
  userId: string
): Promise<string> => {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🖼️ Generating theme image for:', theme);

  try {
    // Generate image using OpenAI
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd'
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI Image API Error Details:', errorData);
      throw new Error(`OpenAI Image API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const base64Image = data.data[0].b64_json;

    // Convert to blob for upload
    const imageData = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
    const blob = new Blob([imageData], { type: 'image/png' });

    // Upload to Supabase Storage
    const fileName = `theme-images/${userId}/${theme.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('social-media-images')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error uploading image:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('social-media-images')
      .getPublicUrl(fileName);

    console.log('✅ Theme image uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;

  } catch (error) {
    console.error('❌ Error generating theme image:', error);
    throw error;
  }
};

export const sendStreamEvent = (controller: ReadableStreamDefaultController, event: any) => {
  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(event)}\n\n`;
  try {
    controller.enqueue(encoder.encode(message));
  } catch (error) {
    console.error('Error sending stream event:', error);
  }
};