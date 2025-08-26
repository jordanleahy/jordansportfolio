import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface BookResearchRequest {
  user_input: string;
  user_id: string;
}

interface BookIdentification {
  title: string;
  author: string;
  publication_year: number;
  edition?: string;
  isbn?: string;
  confidence: 'high' | 'medium' | 'low';
  category?: string;
}

interface VerifiedQuote {
  quote_text: string;
  concept_title?: string;
  confidence: 'high' | 'medium' | 'low';
  sources: Array<{
    source_type: string;
    url: string;
    title: string;
  }>;
  page_reference?: string;
  context: string;
  social_media_description?: string;
}

interface BookResearchResponse {
  book_identification: BookIdentification;
  verified_quotes: VerifiedQuote[];
  research_metadata: {
    total_sources_checked: number;
    research_confidence: 'high' | 'medium' | 'low';
    research_timestamp: string;
    verification_notes: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    console.log('🔍 Starting book research process...');
    
    const { user_input, user_id }: BookResearchRequest = await req.json();
    
    if (!user_input || !user_id) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: user_input and user_id are required',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Let highlightRecord be accessible in catch block
    let highlightRecord: any = null;

    // Step 1: Create initial record
    const { data: initialRecord, error: insertError } = await supabase
      .from('verified_book_highlights')
      .insert({
        user_id,
        original_input: user_input,
        book_title: 'Processing...',
        book_author: 'Processing...',
        processing_status: 'researching'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating initial record:', insertError);
      return new Response(JSON.stringify({ error: insertError.message, success: false }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    highlightRecord = initialRecord;
    console.log('✅ Created initial record:', highlightRecord.id);

    // Step 2: Research book using OpenAI with improved prompt
    const researchPrompt = `You are a Book Research & Content Creation Agent. For this request: "${user_input}"

    Please identify the book and extract the most valuable key concepts, quotes, or principles that would make excellent social media content. Determine the optimal number based on the book's core teachings - some books may have 3-4 major concepts while others might have 8-10 key insights.

    Focus on:
    1. Core concepts and frameworks from the book
    2. Memorable quotes that inspire action
    3. Key principles that can be shared as standalone insights
    4. Practical takeaways that provide value

    Return a valid JSON object with this structure:
    {
      "book_identification": {
        "title": "Book Title",
        "author": "Author Name", 
        "publication_year": 2024,
        "confidence": "high",
        "category": "business"
      },
      "verified_quotes": [
        {
          "quote_text": "The core concept or quote",
          "concept_title": "Short title for this concept (e.g., 'The Hedgehog Concept')",
          "confidence": "high",
          "sources": [{"source_type": "book", "url": "", "title": "Book Title"}],
          "context": "Brief explanation of why this concept matters",
          "social_media_description": "Expanded description suitable for social media post (100-200 words)"
        }
      ],
      "research_metadata": {
        "total_sources_checked": 1,
        "research_confidence": "high", 
        "research_timestamp": "${new Date().toISOString()}",
        "verification_notes": "Book research completed for content creation"
      }
    }`;

    console.log('🤖 Making OpenAI research request...');
    
    const openAIResponse = await Promise.race([
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          messages: [
            { role: 'system', content: 'You are a book research and content creation specialist. Always return valid JSON optimized for social media content creation.' },
            { role: 'user', content: researchPrompt }
          ],
          max_completion_tokens: 4000,
        }),
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI request timeout after 45 seconds')), 45000)
      )
    ]) as Response;

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('❌ OpenAI API error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }
    
    const openAIData = await openAIResponse.json();
    console.log('📚 OpenAI research completed');

    if (!openAIData.choices?.[0]?.message?.content) {
      console.error('❌ No content in OpenAI response:', JSON.stringify(openAIData, null, 2));
      throw new Error('No research results from OpenAI');
    }

    let researchResults: BookResearchResponse;
    try {
      researchResults = JSON.parse(openAIData.choices[0].message.content);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid research response format');
    }

    // Step 3: Create theme for the book concepts
    console.log('🎨 Creating theme and social media posts...');
    const themeName = `${researchResults.book_identification.title} Key Concepts`;
    const themeDescription = `Key concepts, quotes, and insights from "${researchResults.book_identification.title}" by ${researchResults.book_identification.author}. Transform your understanding with these powerful principles.`;
    const bookCategory = researchResults.book_identification.category || 'business';

    const { data: createdTheme, error: themeError } = await supabase
      .from('themes')
      .insert({
        user_id,
        theme_name: themeName,
        description: themeDescription,
        category: bookCategory,
        lifecycle_status: 'ready',
        prompt_generation_status: 'not_started',
        user_interaction_required: false,
        background_processing_complete: true
      })
      .select()
      .single();

    if (themeError) {
      console.error('❌ Error creating theme:', themeError);
      throw themeError;
    }

    console.log('✅ Created theme:', createdTheme.id);

    // Step 4: Create social media posts for each concept
    const socialMediaPosts = [];
    for (let i = 0; i < researchResults.verified_quotes.length; i++) {
      const quote = researchResults.verified_quotes[i];
      const postTitle = quote.concept_title || `Concept ${i + 1}`;
      const postDescription = quote.social_media_description || `${quote.context}\n\n"${quote.quote_text}"`;

      const { data: createdPost, error: postError } = await supabase
        .from('social_media_posts')
        .insert({
          user_id,
          theme_id: createdTheme.id,
          title: postTitle,
          description: postDescription,
          category: bookCategory,
          day: i + 1,
          status: 'draft',
          individual_prompt_status: 'not_started'
        })
        .select()
        .single();

      if (postError) {
        console.warn(`⚠️ Warning: Could not create post ${i + 1}:`, postError);
      } else {
        socialMediaPosts.push(createdPost);
        console.log(`✅ Created social media post: ${postTitle}`);
      }
    }

    // Update theme with post count
    await supabase
      .from('themes')
      .update({
        total_posts_count: socialMediaPosts.length,
        prompt_generation_status: 'not_started'
      })
      .eq('id', createdTheme.id);

    // Step 5: Generate visual prompts for the book highlights (for the highlight record)
    console.log('🎨 Generating visual prompts...');
    const visualPrompts: string[] = [];
    const imageUrls: string[] = [];

    for (const quote of researchResults.verified_quotes) {
      // Generate visual prompt using the Book Highlights Visual Style Agent
      const visualPromptRequest = await supabase.functions.invoke('visual-prompt-generator', {
        body: {
          category: 'book_highlights_visual',
          context: `Generate a visual prompt for this book quote: "${quote.quote_text}" from "${researchResults.book_identification.title}" by ${researchResults.book_identification.author}`,
          theme: researchResults.book_identification.title,
          description: quote.context
        }
      });

      if (visualPromptRequest.data?.success) {
        const visualPrompt = visualPromptRequest.data.image_prompt;
        visualPrompts.push(visualPrompt);

        // Generate image using the visual prompt
        const imageResponse = await supabase.functions.invoke('generate-image-gpt', {
          body: {
            prompt: visualPrompt,
            aspectRatio: '1:1'
          }
        });

        if (imageResponse.data?.url) {
          imageUrls.push(imageResponse.data.url);
        } else {
          imageUrls.push(''); // Placeholder for failed generation
        }
      } else {
        visualPrompts.push('');
        imageUrls.push('');
      }
    }

    // Step 4: Update the record with complete results
    const { data: updatedRecord, error: updateError } = await supabase
      .from('verified_book_highlights')
      .update({
        book_title: researchResults.book_identification.title,
        book_author: researchResults.book_identification.author,
        verified_quotes: researchResults.verified_quotes,
        verification_confidence: researchResults.research_metadata.research_confidence,
        source_references: researchResults.verified_quotes.flatMap(q => q.sources),
        visual_prompts: visualPrompts,
        image_urls: imageUrls,
        processing_status: 'completed'
      })
      .eq('id', highlightRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating record:', updateError);
      throw updateError;
    }

    // Step 5: Update or create books catalog entry
    const { error: catalogError } = await supabase
      .from('books_catalog')
      .upsert({
        user_id,
        title: researchResults.book_identification.title,
        author: researchResults.book_identification.author,
        publication_year: researchResults.book_identification.publication_year,
        category: 'business', // Default category, could be enhanced
        total_highlights_count: researchResults.verified_quotes.length
      }, { 
        onConflict: 'user_id,title,author',
        ignoreDuplicates: false 
      });

    if (catalogError) {
      console.warn('⚠️ Warning: Could not update books catalog:', catalogError);
    }

    console.log('✅ Book research completed successfully');

    return new Response(JSON.stringify({
      success: true,
      data: updatedRecord,
      research_results: researchResults,
      theme_created: {
        id: createdTheme.id,
        name: createdTheme.theme_name,
        posts_count: socialMediaPosts.length
      },
      social_media_posts: socialMediaPosts.map(post => ({
        id: post.id,
        title: post.title,
        day: post.day
      })),
      visual_count: visualPrompts.filter(p => p).length,
      image_count: imageUrls.filter(url => url).length,
      message: `Successfully created "${createdTheme.theme_name}" theme with ${socialMediaPosts.length} social media posts ready for image generation`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in research-book-highlights:', error);
    
    // Update the record to failed status if we have highlightRecord
    if (highlightRecord?.id) {
      try {
        await supabase
          .from('verified_book_highlights')
          .update({
            processing_status: 'failed',
            verification_confidence: 'Error occurred during processing'
          })
          .eq('id', highlightRecord.id);
        console.log('🔄 Updated failed record status');
      } catch (updateError) {
        console.error('❌ Failed to update record status:', updateError);
      }
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});