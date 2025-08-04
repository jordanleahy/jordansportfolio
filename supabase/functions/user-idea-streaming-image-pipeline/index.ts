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

interface UserIdeaRequest {
  description: string;
  userId: string;
  stream?: boolean;
}

interface StreamingEvent {
  type: string;
  progress: number;
  data?: any;
  error?: string;
}

const sendStreamEvent = (controller: ReadableStreamDefaultController, event: StreamingEvent) => {
  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(event)}\n\n`;
  try {
    controller.enqueue(encoder.encode(message));
  } catch (error) {
    console.error('Error sending stream event:', error);
  }
};

const generateTheme = async (description: string): Promise<any> => {
  console.log('🎯 Generating theme for description:', description);

  const systemPrompt = `You are a professional social media content strategist. Convert user descriptions into structured theme JSON for social media calendar generation.

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no explanations or markdown
- Category must be lowercase, no spaces, use hyphens for separation
- Theme should be title case with proper spacing
- Generate exactly 10 posts with days 1-10
- Each post needs: day (number), title (engaging, professional), description (informative, 2-3 sentences)
- All content should be professional and industry-appropriate

JSON STRUCTURE REQUIRED:
{
  "category": "lowercase-category-name",
  "theme": "Professional Theme Title",
  "description": "Brief description of the theme focus",
  "posts": [
    {
      "day": 1,
      "title": "Engaging Post Title",
      "description": "Professional description explaining the topic clearly and providing value. Keep it informative and actionable."
    }
  ]
}`;

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
        { role: 'user', content: `Generate a social media theme for: ${description}` }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const generatedContent = data.choices[0].message.content.trim();
  
  return JSON.parse(generatedContent);
};

const importThemeToDatabase = async (supabase: any, themeData: any, userId: string): Promise<number> => {
  console.log('💾 Importing theme to database:', themeData.category);
  
  const { data, error } = await supabase.rpc('insert_category_content', {
    category_name: themeData.category,
    posts_data: themeData.posts,
    theme_description_param: themeData.description
  });

  if (error) {
    throw new Error(`Database import failed: ${error.message}`);
  }

  return data || themeData.posts.length;
};

const generateSystemPrompt = async (supabase: any, themeData: any, userId: string): Promise<void> => {
  console.log('🤖 Generating system prompt for theme:', themeData.theme);
  
  const { error } = await supabase.functions.invoke('invoke-system-prompt-agent', {
    body: {
      theme: themeData.theme,
      category: themeData.category,
      description: themeData.description,
      sample_posts: themeData.posts.slice(0, 3), // First 3 posts as samples
      user_id: userId
    }
  });

  if (error) {
    console.warn('System prompt generation warning:', error);
    // Non-critical error, continue pipeline
  }
};

const generateImagePrompt = async (title: string, description: string, theme: string, category: string): Promise<string> => {
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

const generateThemeImage = async (supabase: any, prompt: string, theme: string, userId: string): Promise<string> => {
  console.log('🖼️ Generating theme image');
  
  // Update posts to indicate image generation has started
  await supabase
    .from('social_media_posts')
    .update({ theme_image_generation_status: 'generating' })
    .eq('theme', theme)
    .eq('user_id', userId);

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      size: '1024x1024',
      quality: 'high',
      n: 1
    }),
  });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const data = await response.json();
  const base64Image = data.data[0].b64_json;

  // Upload to storage
  const fileName = `${theme.replace(/\s+/g, '_')}_theme_${Date.now()}.png`;
  const filePath = `${userId}/${fileName}`;
  
  const byteCharacters = atob(base64Image);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);

  const { error: uploadError } = await supabase.storage
    .from('social-media-images')
    .upload(filePath, byteArray, {
      contentType: 'image/png',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('social-media-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

const updatePostsWithImage = async (supabase: any, imageUrl: string, theme: string, userId: string): Promise<void> => {
  console.log('🔄 Updating posts with theme image');
  
  const { error } = await supabase
    .from('social_media_posts')
    .update({
      theme_image_4_3_url: imageUrl,
      theme_image_generation_status: 'complete'
    })
    .eq('theme', theme)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { description, userId, stream = true }: UserIdeaRequest = await req.json();

    if (!description || !userId) {
      throw new Error('Description and authentication required');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`🚀 Starting user idea pipeline for: ${description.substring(0, 50)}...`);

    if (stream) {
      const encoder = new TextEncoder();
      
      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            // Step 1: Generate Theme (20% progress)
            sendStreamEvent(controller, {
              type: 'theme_generation_start',
              progress: 10,
              data: { status: 'Generating theme and posts...' }
            });

            const themeData = await generateTheme(description);
            
            sendStreamEvent(controller, {
              type: 'theme_generation_complete',
              progress: 20,
              data: { 
                theme: themeData.theme,
                category: themeData.category,
                postCount: themeData.posts.length
              }
            });

            // Step 2: Import to Database (40% progress)
            sendStreamEvent(controller, {
              type: 'database_import_start',
              progress: 25,
              data: { status: 'Importing posts to database...' }
            });

            const insertedCount = await importThemeToDatabase(supabase, themeData, userId);
            
            sendStreamEvent(controller, {
              type: 'database_import_complete',
              progress: 40,
              data: { insertedCount }
            });

            // Step 3: Generate System Prompt (60% progress)
            sendStreamEvent(controller, {
              type: 'system_prompt_start',
              progress: 45,
              data: { status: 'Generating AI system prompts...' }
            });

            await generateSystemPrompt(supabase, themeData, userId);
            
            sendStreamEvent(controller, {
              type: 'system_prompt_complete',
              progress: 60,
              data: { promptGenerated: true }
            });

            // Step 4: Generate Image Prompt (70% progress)
            sendStreamEvent(controller, {
              type: 'image_prompt_start',
              progress: 65,
              data: { status: 'Creating visual prompt...' }
            });

            const firstPost = themeData.posts[0];
            const imagePrompt = await generateImagePrompt(
              firstPost.title,
              firstPost.description,
              themeData.theme,
              themeData.category
            );
            
            sendStreamEvent(controller, {
              type: 'image_prompt_complete',
              progress: 70,
              data: { imagePrompt }
            });

            // Step 5: Generate Theme Image (80-90% progress)
            sendStreamEvent(controller, {
              type: 'image_generation_start',
              progress: 75,
              data: { status: 'Generating theme image...' }
            });

            const imageUrl = await generateThemeImage(supabase, imagePrompt, themeData.theme, userId);
            
            sendStreamEvent(controller, {
              type: 'image_generation_complete',
              progress: 90,
              data: { imageUrl }
            });

            // Step 6: Update Database (95% progress)
            sendStreamEvent(controller, {
              type: 'database_update_start',
              progress: 92,
              data: { status: 'Finalizing...' }
            });

            await updatePostsWithImage(supabase, imageUrl, themeData.theme, userId);
            
            sendStreamEvent(controller, {
              type: 'database_update_complete',
              progress: 95,
              data: { status: 'Database updated' }
            });

            // Step 7: Pipeline Complete (100% progress)
            sendStreamEvent(controller, {
              type: 'pipeline_complete',
              progress: 100,
              data: {
                success: true,
                category: themeData.category,
                theme: themeData.theme,
                themeImageUrl: imageUrl,
                postCount: insertedCount,
                message: 'User idea pipeline completed successfully!'
              }
            });

            controller.close();

          } catch (error) {
            console.error('Pipeline error:', error);
            sendStreamEvent(controller, {
              type: 'pipeline_error',
              progress: 0,
              error: error.message
            });
            controller.close();
          }
        }
      });

      return new Response(streamResponse, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
        },
      });
    } else {
      // Non-streaming response
      const themeData = await generateTheme(description);
      const insertedCount = await importThemeToDatabase(supabase, themeData, userId);
      await generateSystemPrompt(supabase, themeData, userId);
      
      const firstPost = themeData.posts[0];
      const imagePrompt = await generateImagePrompt(
        firstPost.title,
        firstPost.description,
        themeData.theme,
        themeData.category
      );
      
      const imageUrl = await generateThemeImage(supabase, imagePrompt, themeData.theme, userId);
      await updatePostsWithImage(supabase, imageUrl, themeData.theme, userId);

      return new Response(JSON.stringify({
        success: true,
        category: themeData.category,
        theme: themeData.theme,
        themeImageUrl: imageUrl,
        postCount: insertedCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Pipeline error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});