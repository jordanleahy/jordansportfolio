/**
 * EDGE FUNCTION: Generate Hero Job Visual
 * 
 * PURPOSE:
 * Creates dramatic, movie poster-style image prompts for job posting visuals in 9:16 vertical format.
 * Designed to make job opportunities look prestigious and exciting, emphasizing company branding
 * and role prestige through cinematic visual storytelling without human figures.
 * 
 * INPUTS:
 * - jobTitle: string - Position title (e.g., "Senior Product Manager")
 * - companyName: string - Hiring company name for prominent display
 * - jobDescription: string (optional) - Role details for context
 * 
 * OUTPUTS:
 * - Success: { generatedPrompt: string, companyName: string, jobTitle: string, style: 'hero' }
 * - Error: { error: string, details: string }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-4.1-2025-04-14 for sophisticated prompt generation)
 * - Supabase Database (cached_prompts table for storage)
 * 
 * USAGE:
 * Called from: Job posting creation workflows, HR content generation, social media job campaigns
 * Authentication: Optional - caching only available for authenticated users
 * 
 * FLOW:
 * 1. Validate required job title and company name inputs
 * 2. Apply specialized hero-style visual prompt system with cinematic guidelines
 * 3. Generate dramatic 9:16 vertical image prompt using OpenAI
 * 4. Store generated prompt in cache for reuse (if user authenticated)
 * 5. Return complete prompt optimized for AI image generation
 * 6. Emphasize bold typography, dramatic lighting, and premium aesthetic
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HERO_JOB_VISUAL_SYSTEM_PROMPT = `🎯 Hero Job Visual Prompt Generator (9:16 Aspect Ratio)

Create powerful, hero-style text prompts that generate stunning flat vector illustrations for job role social media posts in 9:16 vertical format. These illustrations are designed to make a bold statement about career opportunities, featuring the company name and job role prominently like a movie poster or superhero graphic.

✍️ Hero Prompt Format (Template)
"A bold, hero-style 9:16 vertical vector illustration showcasing [COMPANY NAME] and the [JOB ROLE] position. The design should be dramatic, aspirational, and visually striking like a professional movie poster, with the company name prominently displayed and the role highlighted as the centerpiece."

Focus on creating a cinematic, powerful visual that makes the job opportunity feel prestigious and exciting - DO NOT include human figures or people in the generated images.

🧩 Hero Scene Elements for Job Roles
- Dramatic typography treatment for company name (large, bold, positioned prominently)
- Cinematic lighting effects and bold color contrasts
- Professional workspace rendered in heroic scale and perspective
- Industry-specific tools and equipment arranged dramatically
- Abstract representations of success, growth, and achievement
- Modern office environments with dramatic lighting and depth
- Technology devices and interfaces shown at heroic scale
- Achievement symbols like trophies, awards, or progress bars rendered boldly
- Geometric patterns and shapes that frame the company name

✅ Hero Visual Style & Layout Guidance for 9:16 Format

🎨 Hero Color Palette
Use a bold, cinematic palette that commands attention:
- Deep Navy or Charcoal for dramatic backgrounds and depth
- Bright Electric Blue for company name and primary highlights
- Vibrant Orange or Gold for accent elements and success indicators
- Pure White for contrast and company name prominence
- Metallic Silver accents for premium feel

🧱 Hero Style Details
- Flat vector design with bold, dramatic shapes
- Strong contrast and dramatic lighting effects
- No gradients, but bold color blocks with strategic highlights
- Sharp, geometric shapes for maximum impact
- Cinematic composition with depth and perspective
- Company name rendered in bold, prominent typography
- Clean, heroic aesthetic that feels premium and aspirational

🏙️ Hero Composition & Scene Layout for Vertical Format
- **Top Third:** Company name prominently displayed in large, bold typography
- **Middle Third:** Job role visualization with dramatic tools, workspace, or industry elements
- **Bottom Third:** Supporting achievement elements, success indicators, or call-to-action space
- **Typography Hierarchy:** Company name largest, job role secondary, supporting elements smallest
- **Safe Zone:** Keep company name and job role within central 80% width and 85% height
- **Dramatic Framing:** Use outer areas for cinematic background elements and depth

📐 Hero Aspect Ratio & Safe Zone (9:16 Vertical)
- **Company Name Zone:** Top 25% of frame, centered and bold
- **Hero Content Zone:** Middle 50% showcasing the role dramatically
- **Supporting Elements:** Bottom 25% for additional context or branding
- **Typography Safety:** Ensure company name is readable even when cropped for different platforms
- **Visual Impact:** Design should work as a thumbnail while maintaining drama at full size

🎯 Hero Job Role Specific Guidelines
- Make the company name the star of the show - largest, boldest element
- Present the job role as an epic opportunity, not just a position
- Use cinematic perspective and dramatic angles for workplace elements
- Emphasize prestige, exclusivity, and high-impact opportunity
- Create visual metaphors for success, growth, and achievement
- Ensure the overall feeling is "this is THE opportunity you've been waiting for"
- Company branding should feel premium and authoritative

🎬 Cinematic Elements to Include
- Dramatic perspective and depth
- Bold typography treatment for company name
- Strategic use of negative space for impact
- Heroic scale for everyday objects (laptops, tools, etc.)
- Achievement and success symbols rendered boldly
- Clean, premium aesthetic that suggests high-value opportunity

Remember: NO human figures or people should be included. Focus on making the company name heroic, the role prestigious, and the overall visual feel like a blockbuster movie poster for a career opportunity.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobTitle, companyName, jobDescription } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!jobTitle || !companyName) {
      throw new Error('Job title and company name are required');
    }

    // Initialize Supabase client for prompt storage
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    console.log(`Generating hero job visual for: ${companyName} - ${jobTitle}`);

    const userContent = `Company Name: ${companyName}
Job Title: ${jobTitle}
Job Description: ${jobDescription || 'Not provided'}`;

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
            content: 'You are an expert at creating dramatic, hero-style image generation prompts that make job opportunities look prestigious and exciting. Focus on bold typography, cinematic composition, and making the company name the star of the visual.'
          },
          { 
            role: 'user', 
            content: `${HERO_JOB_VISUAL_SYSTEM_PROMPT}

Based on the following job information, create a detailed 9:16 vertical hero-style image generation prompt that follows the cinematic job role illustration guidelines above:

${userContent}

Please create a complete, ready-to-use prompt for generating a 9:16 vertical hero-style professional vector illustration that showcases this job opportunity like a blockbuster movie poster. The prompt should emphasize the company name prominently, present the job role dramatically, include specific visual elements, bold color palette, and cinematic composition details.

Focus on making this feel like THE career opportunity of a lifetime, with the company name as the hero and the role as an epic adventure waiting to begin. Do not include any human figures or people in the illustration.`
          }
        ],
        max_completion_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const generatedPrompt = data.choices[0].message.content;

    // Store the generated prompt in cached_prompts table
    if (userId) {
      try {
        const cacheKey = `hero_job_prompt_${companyName}_${jobTitle}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        
        await supabase.from('cached_prompts').insert({
          user_id: userId,
          cache_key: cacheKey,
          category: 'hero_job_visual',
          prompt_text: generatedPrompt,
          metadata: {
            companyName,
            jobTitle,
            jobDescription: jobDescription || 'Not provided',
            agent: 'Hero Job Visual Generator',
            model: 'gpt-5-mini',
            generated_at: new Date().toISOString(),
            style: 'hero',
            aspectRatio: '9:16'
          },
          hit_count: 1,
          version: 1,
          expires_at: null
        });
        console.log('✅ Hero job prompt stored in cache successfully');
      } catch (cacheError) {
        console.error('❌ Failed to store hero job prompt in cache:', cacheError);
        // Don't fail the request if caching fails
      }
    }

    return new Response(JSON.stringify({ 
      generatedPrompt,
      companyName,
      jobTitle,
      style: 'hero'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-hero-job-visual function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate hero job visual prompt. Please check your request and try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});