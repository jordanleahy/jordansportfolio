import { SupabaseClient } from './types.ts';

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
    theme_image_generation_status: status,
    updated_at: new Date().toISOString()
  };
  
  if (imageUrl && status === 'complete') {
    updateData.theme_image_4_3_url = imageUrl;
  }
  
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
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🎨 Generating image prompt for theme:', theme);
  
  const systemPrompt = `You are an expert at creating detailed, professional image generation prompts for ${theme}-themed AI image generators.

Create prompts that will generate:
- Professional, credible visuals suitable for ${theme} content
- Clear focal points that support the content message
- Appropriate industry context and environmental elements
- Balanced composition with good visual hierarchy
- Consistent branding feel across different ${theme} topics

CRITICAL FORMATTING RULES:
- DO NOT include any title, headline, or text overlays in the generated image
- Include "in a 4:3 landscape format" naturally within the prompt description
- Focus purely on the visual elements, composition, and professional aesthetic
- End the prompt with a period, no additional formatting or labels`;

  const userPrompt = `Title: ${title}
Description: ${description}
Theme: ${theme}
Category: ${category}

Create a detailed image generation prompt for this ${theme} theme content.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 1,
      max_tokens: 500
     }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        output_format: 'png'
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