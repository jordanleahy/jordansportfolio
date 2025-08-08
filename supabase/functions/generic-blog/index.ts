import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SocialMediaPost {
  id: string;
  title: string;
  description: string;
  category: string;
  image_16_9_url?: string | null;
  image_4_3_url?: string | null;
}

interface BlogPostInput {
  hero_headline: string;
  hero_subhead: string;
  hero_image_url?: string | null;
  intro_content: string;
  visual_sections: any[];
  tldr_title: string;
  tldr_bullets: string[];
  meta_title: string;
  meta_description: string;
  category: string;
  tags: string[];
  cta_text: string;
  status: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { socialMediaPost, checkExisting = true } = await req.json() as { 
      socialMediaPost: SocialMediaPost;
      checkExisting?: boolean;
    };

    if (!socialMediaPost) {
      throw new Error('Social media post data is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate expanded blog content using OpenAI
    const prompt = `Transform this social media post into a comprehensive blog post. EXPAND the existing content thoughtfully, don't create entirely new content.

Original Title: "${socialMediaPost.title}"
Original Description: "${socialMediaPost.description}"
Category: "${socialMediaPost.category}"

Generate a JSON response with the following structure:
{
  "hero_headline": "Expanded engaging headline (6-8 words max)",
  "hero_subhead": "Supporting subheadline (10-15 words)",
  "intro_content": "Expanded introduction (50-75 words) that builds on the original description",
  "visual_sections": [
    {
      "headline": "Section 1 headline (6 words max)",
      "content": "Content that breaks down part of the main concept (300-480 characters)",
      "image_url": ""
    },
    {
      "headline": "Section 2 headline (6 words max)", 
      "content": "Content that explores another aspect (300-480 characters)",
      "image_url": ""
    },
    {
      "headline": "Section 3 headline (6 words max)",
      "content": "Content that provides practical insights (300-480 characters)", 
      "image_url": ""
    }
  ],
  "tldr_bullets": [
    "Key point 1 (10-15 words)",
    "Key point 2 (10-15 words)", 
    "Key point 3 (10-15 words)",
    "Key point 4 (10-15 words)"
  ],
  "meta_title": "SEO-optimized title (50-60 characters)",
  "meta_description": "SEO description (140-160 characters)",
  "tags": ["tag1", "tag2", "tag3"]
}

Requirements:
- Stay focused on expanding the original concept, don't add unrelated content
- Maintain professional, educational tone
- Use healthcare/business terminology appropriately for the category
- Keep word counts within specified limits
- Make content actionable and informative`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert healthcare content strategist with deep knowledge of clinical documentation, medical coding, and healthcare operations. Transform social media posts into comprehensive, accurate healthcare blog posts. Focus on expanding existing content with specific healthcare insights rather than generic text. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 1,
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const generatedContent = aiData.choices[0].message.content;

    // Parse the generated JSON content
    let blogContent;
    try {
      // Remove markdown code block formatting if present
      let cleanContent = generatedContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      blogContent = JSON.parse(cleanContent);
    } catch (error) {
      console.error('Failed to parse generated content:', generatedContent);
      console.error('Parse error:', error.message);
      throw new Error('Failed to parse generated content');
    }

    // Validate and fix visual_sections to ensure database constraint compliance
    const validateVisualSections = (sections: any[]): any[] => {
      if (!Array.isArray(sections) || sections.length !== 3) {
        // Generate topic-specific fallback sections
        const title = socialMediaPost.title?.toLowerCase() || '';
        if (title.includes('cc') || title.includes('mcc') || title.includes('comorbid')) {
          return [
            {
              headline: "Understanding CCs and MCCs",
              content: "Complications or Comorbidities (CCs) and Major Complications or Comorbidities (MCCs) are secondary diagnoses that significantly impact patient care complexity and hospital reimbursement. These conditions extend beyond the principal diagnosis and require additional clinical attention, resources, and monitoring during the patient's stay.",
              image_url: ""
            },
            {
              headline: "DRG Impact and Reimbursement",
              content: "When properly documented and coded, CCs and MCCs elevate the Diagnostic Related Group (DRG) weight, resulting in higher reimbursement rates. This reflects the increased resources, longer length of stay, and additional clinical complexity associated with treating patients who have these secondary conditions.",
              image_url: ""
            },
            {
              headline: "Documentation Best Practices",
              content: "Successful CC/MCC capture requires precise clinical documentation that clearly establishes the relationship between secondary conditions and the patient's care. Healthcare providers must document how these conditions affect treatment decisions, resource utilization, and clinical outcomes throughout the episode of care.",
              image_url: ""
            }
          ];
        }
        
        // Generic healthcare fallback
        return [
          {
            headline: "Understanding the Basics",
            content: "This section provides foundational knowledge about the healthcare topic, helping professionals understand the core concepts and why they matter in today's healthcare environment. We'll explore the key components and how they impact daily operations and patient outcomes.",
            image_url: ""
          },
          {
            headline: "Practical Applications",
            content: "Here we dive into real-world healthcare scenarios where these principles come into play. From clinical operations to administrative processes, these applications demonstrate the importance of mastering this subject for improved patient care and organizational efficiency.",
            image_url: ""
          },
          {
            headline: "Implementation Strategy",
            content: "The final section focuses on actionable steps healthcare organizations can take to implement these concepts. We'll provide clear guidelines, best practices, and common pitfalls to avoid in healthcare settings, helping translate knowledge into measurable improvements in patient care and operational efficiency.",
            image_url: ""
          }
        ];
      }

      // Validate existing sections with more flexible content requirements
      return sections.map((section, index) => ({
        headline: section.headline && section.headline.length <= 40 
          ? section.headline 
          : `Healthcare Focus ${index + 1}`,
        content: section.content && section.content.length >= 200
          ? section.content
          : `This section provides essential healthcare information and practical guidance for professionals in the field. The content covers important aspects of healthcare operations, clinical practices, and industry best practices that support quality patient care and organizational success.`,
        image_url: section.image_url || ""
      }));
    };

    // Create the blog post input with proper structure
    const blogPostInput: BlogPostInput = {
      hero_headline: blogContent.hero_headline,
      hero_subhead: blogContent.hero_subhead,
      hero_image_url: socialMediaPost.image_16_9_url || null,
      intro_content: blogContent.intro_content,
      visual_sections: validateVisualSections(blogContent.visual_sections),
      tldr_title: 'TL;DR',
      tldr_bullets: blogContent.tldr_bullets,
      meta_title: blogContent.meta_title,
      meta_description: blogContent.meta_description,
      category: socialMediaPost.category,
      tags: blogContent.tags || [],
      cta_text: 'Learn More',
      status: 'draft'
    };

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Extract user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authorization token');
    }

    // Check if a blog post already exists for this social media post
    if (checkExisting) {
      const { data: existingPosts, error: checkError } = await supabase
        .from('blog_posts')
        .select('id, slug, status, hero_headline')
        .eq('user_id', user.id)
        .ilike('hero_headline', `%${socialMediaPost.title.substring(0, 20)}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (checkError) {
        console.error('Error checking existing blog posts:', checkError);
      } else if (existingPosts && existingPosts.length > 0) {
        const existingPost = existingPosts[0];
        return new Response(
          JSON.stringify({ 
            success: true, 
            blogPost: existingPost,
            message: 'Found existing blog post',
            redirectUrl: `/blog-editor/${existingPost.id}`,
            isExisting: true
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
    }

    // Generate unique slug from title
    const generateSlug = (title: string): string => {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 40); // Leave room for timestamp
      
      // Add timestamp to ensure uniqueness
      const timestamp = Date.now();
      return `${baseSlug}-${timestamp}`;
    };

    const slug = generateSlug(blogPostInput.hero_headline);

    // Insert blog post into database
    const { data: blogPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        user_id: user.id,
        social_media_post_id: socialMediaPost.id,
        hero_headline: blogPostInput.hero_headline,
        hero_subhead: blogPostInput.hero_subhead,
        hero_image_url: blogPostInput.hero_image_url,
        intro_content: blogPostInput.intro_content,
        visual_sections: blogPostInput.visual_sections,
        tldr_title: blogPostInput.tldr_title,
        tldr_bullets: blogPostInput.tldr_bullets,
        meta_title: blogPostInput.meta_title,
        meta_description: blogPostInput.meta_description,
        category: blogPostInput.category,
        tags: blogPostInput.tags,
        cta_text: blogPostInput.cta_text,
        cta_url: null,
        slug: slug,
        status: 'draft',
        word_count: 0, // Will be calculated later
        read_time: 1, // Will be calculated later
        featured: false,
        share_enabled: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to create blog post: ${insertError.message}`);
    }

    // Start background image generation and storage
    const generateVisualSectionImages = async () => {
      try {
        console.log('🎨 Starting background image generation for blog post:', blogPost.id);
        
        // Update status to generating
        await supabase
          .from('blog_posts')
          .update({ 
            image_generation_status: 'generating',
            updated_at: new Date().toISOString()
          })
          .eq('id', blogPost.id);
        
        const visualSections = blogPostInput.visual_sections;
        const updatedSections = [...visualSections];
        const generatedPrompts = [];
        let hasUpdates = false;
        
        for (let i = 0; i < visualSections.length; i++) {
          const section = visualSections[i];
          
          try {
            console.log(`🚀 Processing visual section ${i + 1}: ${section.headline}`);
            
            // Step 1: Generate prompt using the dynamic function
            const promptResponse = await fetch(`${supabaseUrl}/functions/v1/generate-image-prompt-dynamic`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: section.headline,
                description: section.content,
                category: socialMediaPost.category
              })
            });

            if (!promptResponse.ok) {
              console.warn(`⚠️ Failed to generate prompt for section ${i + 1}:`, await promptResponse.text());
              continue;
            }

            const promptData = await promptResponse.json();
            if (!promptData.generatedPrompt) {
              console.warn(`⚠️ No prompt generated for section ${i + 1}`);
              continue;
            }

            const imagePrompt = `${promptData.generatedPrompt.trim()}, professional 4:3 aspect ratio composition`;
            generatedPrompts.push(imagePrompt);
            console.log(`✅ Generated prompt for section ${i + 1}:`, imagePrompt.substring(0, 100) + '...');

            // Step 2: Generate actual image using the prompt
            const imageResponse = await fetch(`${supabaseUrl}/functions/v1/generate-image-gpt`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: imagePrompt,
                aspectRatio: "4:3"
              })
            });

            if (!imageResponse.ok) {
              console.warn(`⚠️ Failed to generate image for section ${i + 1}:`, await imageResponse.text());
              continue;
            }

            const imageData = await imageResponse.json();
            if (!imageData.image) {
              console.warn(`⚠️ No image data returned for section ${i + 1}`);
              continue;
            }

            console.log(`🎨 Image generated for section ${i + 1}, uploading to storage...`);

            // Step 3: Convert base64 to file and upload to storage
            const base64Data = imageData.image.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            const fileName = `blog_${blogPost.id}_section_${i + 1}_${Date.now()}.png`;
            const filePath = `visual-sections/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('blog-images')
              .upload(filePath, buffer, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error(`❌ Failed to upload image for section ${i + 1}:`, uploadError);
              continue;
            }

            // Step 4: Get public URL and update section
            const { data: publicUrlData } = supabase.storage
              .from('blog-images')
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              updatedSections[i] = {
                ...section,
                image_url: publicUrlData.publicUrl
              };
              hasUpdates = true;
              console.log(`✅ Image uploaded for section ${i + 1}:`, publicUrlData.publicUrl);
            }

          } catch (error) {
            console.error(`❌ Error processing section ${i + 1}:`, error.message);
          }
          
          // Add delay between requests to respect rate limits
          if (i < visualSections.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }

        // Update the blog post with generated images and prompts
        const finalStatus = hasUpdates ? 'completed' : 'failed';
        const updateData: any = {
          image_generation_status: finalStatus,
          visual_section_prompts: generatedPrompts,
          updated_at: new Date().toISOString()
        };

        if (hasUpdates) {
          updateData.visual_sections = updatedSections;
        }

        const { error: updateError } = await supabase
          .from('blog_posts')
          .update(updateData)
          .eq('id', blogPost.id);

        if (updateError) {
          console.error('❌ Failed to update blog post with generated content:', updateError);
        } else {
          console.log(`✅ Blog post updated with ${hasUpdates ? 'generated images' : 'prompts only'} (status: ${finalStatus})`);
        }

      } catch (error) {
        console.error('❌ Background image generation failed:', error);
        
        // Update status to failed
        await supabase
          .from('blog_posts')
          .update({ 
            image_generation_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', blogPost.id);
      }
    };

    // Use EdgeRuntime.waitUntil for background processing
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(generateVisualSectionImages());
    } else {
      // Fallback for environments without EdgeRuntime
      generateVisualSectionImages().catch(error => {
        console.error('Background task failed:', error);
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        blogPost: blogPost,
        message: 'Blog post draft created successfully. Visual section images are being generated in the background.',
        redirectUrl: `/blog-editor/${blogPost.id}`,
        imageGeneration: 'in_progress'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generic-blog function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});