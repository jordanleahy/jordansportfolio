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
}

interface VerifiedQuote {
  quote_text: string;
  confidence: 'high' | 'medium' | 'low';
  sources: Array<{
    source_type: string;
    url: string;
    title: string;
  }>;
  page_reference?: string;
  context: string;
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

    // Step 1: Create initial record
    const { data: highlightRecord, error: insertError } = await supabase
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

    console.log('✅ Created initial record:', highlightRecord.id);

    // Step 2: Research book using OpenAI
    const researchPrompt = `You are a Book Research & Verification Agent. Research and verify book quotes for this request: "${user_input}"

    Please follow these steps:
    1. Identify the specific book from the user's request
    2. Find 5-10 key quotes or highlights from that book
    3. Provide confidence scores based on source verification
    4. Include source references where possible

    Return your response as a valid JSON object matching this structure:
    {
      "book_identification": {
        "title": "Book Title",
        "author": "Author Name", 
        "publication_year": 2024,
        "confidence": "high"
      },
      "verified_quotes": [
        {
          "quote_text": "The actual quote text",
          "confidence": "high",
          "sources": [{"source_type": "publisher", "url": "https://example.com", "title": "Source"}],
          "context": "Context around the quote"
        }
      ],
      "research_metadata": {
        "total_sources_checked": 5,
        "research_confidence": "high", 
        "research_timestamp": "${new Date().toISOString()}",
        "verification_notes": "Research notes"
      }
    }`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are a book research specialist. Always return valid JSON.' },
          { role: 'user', content: researchPrompt }
        ],
        max_completion_tokens: 4000,
      }),
    });

    const openAIData = await openAIResponse.json();
    console.log('📚 OpenAI research completed');

    if (!openAIData.choices?.[0]?.message?.content) {
      throw new Error('No research results from OpenAI');
    }

    let researchResults: BookResearchResponse;
    try {
      researchResults = JSON.parse(openAIData.choices[0].message.content);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid research response format');
    }

    // Step 3: Generate visual prompts for each quote
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
      visual_count: visualPrompts.filter(p => p).length,
      image_count: imageUrls.filter(url => url).length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in research-book-highlights:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});