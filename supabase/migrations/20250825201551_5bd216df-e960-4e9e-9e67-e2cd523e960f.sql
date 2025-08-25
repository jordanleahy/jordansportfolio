-- Create book highlights and catalog tables
CREATE TABLE public.verified_book_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  original_input TEXT NOT NULL,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  verified_quotes JSONB DEFAULT '[]',
  verification_confidence TEXT NOT NULL DEFAULT 'pending',
  source_references JSONB DEFAULT '[]',
  visual_prompts JSONB DEFAULT '[]',
  image_urls JSONB DEFAULT '[]',
  processing_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.books_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publication_year INTEGER,
  category TEXT DEFAULT 'business',
  total_highlights_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.verified_book_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books_catalog ENABLE ROW LEVEL SECURITY;

-- Create policies for verified_book_highlights
CREATE POLICY "Users can view their own book highlights" 
ON public.verified_book_highlights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own book highlights" 
ON public.verified_book_highlights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book highlights" 
ON public.verified_book_highlights 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book highlights" 
ON public.verified_book_highlights 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for books_catalog
CREATE POLICY "Users can view their own books catalog" 
ON public.books_catalog 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own books catalog" 
ON public.books_catalog 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books catalog" 
ON public.books_catalog 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books catalog" 
ON public.books_catalog 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_book_highlights_user_id ON public.verified_book_highlights(user_id);
CREATE INDEX idx_book_highlights_status ON public.verified_book_highlights(processing_status);
CREATE INDEX idx_books_catalog_user_id ON public.books_catalog(user_id);
CREATE INDEX idx_books_catalog_author ON public.books_catalog(author);

-- Create function to insert Book Research Agent
CREATE OR REPLACE FUNCTION public.insert_book_research_agent()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  agent_exists boolean;
  insert_result uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 'ERROR: No authenticated user found';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'Book Research & Verification Agent'
  ) INTO agent_exists;
  
  IF agent_exists THEN
    RETURN 'Agent already exists for this user';
  END IF;

  INSERT INTO public.openai_agents (
    user_id, name, purpose, model_version, trigger, input_source, output_target, schedule,
    owner, status, tags, notes, supported_categories, temperature, max_tokens
  ) VALUES (
    current_user_id,
    'Book Research & Verification Agent',
    'Research and verify book quotes through web search, identify books from user descriptions, and cross-reference quotes against authoritative sources.',
    'gpt-4.1-2025-04-14',
    'api_call',
    'User book research requests (natural language)',
    'Structured book data with verified quotes and sources (JSON)',
    'on-demand',
    'Content Research Team',
    'active',
    ARRAY['book-research', 'quote-verification', 'web-search', 'source-validation'],
    'Specialized agent for researching books and verifying quotes. Performs web searches to identify specific books from descriptions and validates quote authenticity against multiple sources.',
    ARRAY['book_research_verification'],
    0.3,
    4000
  ) RETURNING id INTO insert_result;

  INSERT INTO public.system_prompts (
    agent_id, user_id, category, prompt_text, agent_name, agent_purpose, agent_owner, name, description
  ) VALUES (
    insert_result,
    current_user_id,
    'book_research_verification',
    $$You are a Book Research & Verification Agent specializing in identifying books from user descriptions and verifying quote authenticity through comprehensive research.

## Core Responsibilities

### Book Identification
- Parse natural language requests like "Bill Gates most recent book" or "latest leadership book by John Maxwell"
- Research to identify specific book titles, publication years, and editions
- Verify author information and book details
- Handle ambiguous requests by providing clarifying options

### Quote Research & Verification
- Search for key quotes, concepts, and highlights from identified books
- Cross-reference quotes against multiple authoritative sources
- Verify quote accuracy and provide confidence scores
- Find source citations and page references when possible

### Research Methodology
1. **Primary Sources**: Publisher websites, official book excerpts, author interviews
2. **Secondary Sources**: Academic databases, reputable review sites, library catalogs
3. **Cross-Validation**: Compare quote variations across multiple sources
4. **Confidence Scoring**: 
   - HIGH: Exact match in 3+ authoritative sources
   - MEDIUM: Close match in 2+ reliable sources  
   - LOW: Single source or significant variations

## Output Format (JSON)
{
  "book_identification": {
    "title": "The Road Ahead",
    "author": "Bill Gates",
    "publication_year": 2024,
    "edition": "Revised Edition",
    "isbn": "978-0123456789",
    "confidence": "high"
  },
  "verified_quotes": [
    {
      "quote_text": "The exact quote text as verified",
      "confidence": "high" | "medium" | "low",
      "sources": [
        {
          "source_type": "publisher" | "review" | "interview" | "academic",
          "url": "https://example.com",
          "title": "Source title"
        }
      ],
      "page_reference": "Page 42" | null,
      "context": "Brief context around the quote"
    }
  ],
  "research_metadata": {
    "total_sources_checked": 8,
    "research_confidence": "high",
    "research_timestamp": "2024-01-15T10:30:00Z",
    "verification_notes": "Additional research notes"
  }
}

## Quality Standards
- Always verify quotes against original sources when possible
- Provide transparent confidence scoring with reasoning
- Include source URLs and citations for verification
- Flag potentially misattributed or modified quotes
- Focus on finding 5-10 most significant/popular quotes per book

Return ONLY the structured JSON with comprehensive research results.$$,
    'Book Research & Verification Agent',
    'Research and verify book quotes through web search, identify books from user descriptions, and cross-reference quotes against authoritative sources.',
    'Content Research Team',
    'Book Research System Prompt',
    'System prompt for comprehensive book research and quote verification'
  );

  RETURN 'SUCCESS: Book Research & Verification Agent created with ID: ' || insert_result::text;
END;
$function$;

-- Create function to insert Book Highlights Visual Style Agent
CREATE OR REPLACE FUNCTION public.insert_book_highlights_visual_agent()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  agent_exists boolean;
  insert_result uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 'ERROR: No authenticated user found';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'Book Highlights Visual Style Agent'
  ) INTO agent_exists;
  
  IF agent_exists THEN
    RETURN 'Agent already exists for this user';
  END IF;

  INSERT INTO public.openai_agents (
    user_id, name, purpose, model_version, trigger, input_source, output_target, schedule,
    owner, status, tags, notes, supported_categories, temperature, max_tokens
  ) VALUES (
    current_user_id,
    'Book Highlights Visual Style Agent',
    'Generate consistent visual style prompts for book concept illustrations, focusing on minimal text and educational aesthetics.',
    'gpt-4.1-2025-04-14',
    'api_call',
    'Book quotes and concepts for visualization',
    'Consistent visual prompts for image generation',
    'on-demand',
    'Visual Content Team',
    'active',
    ARRAY['book-visualization', 'visual-prompts', 'educational-design', 'concept-illustration'],
    'Specialized agent for creating consistent visual style prompts for book highlights and concepts. Maintains unified aesthetic across all book-related visualizations.',
    ARRAY['book_highlights_visual'],
    0.7,
    2000
  ) RETURNING id INTO insert_result;

  INSERT INTO public.system_prompts (
    agent_id, user_id, category, prompt_text, agent_name, agent_purpose, agent_owner, name, description
  ) VALUES (
    insert_result,
    current_user_id,
    'book_highlights_visual',
    $$You are a Book Highlights Visual Style Agent specialized in creating consistent, minimal-text illustrations for book concepts and quotes.

## Visual Style Requirements

### Core Aesthetic
- **Vector illustration style**: Clean, modern, professional
- **Minimal text**: Maximum 3-5 key words per illustration
- **Educational focus**: Learning and knowledge-oriented design
- **Consistent typography**: Same font style and hierarchy across all visuals
- **Professional color palette**: Blues (#2563eb), grays (#64748b), whites (#ffffff) with strategic accent colors

### Layout & Composition
- **1:1 aspect ratio** for social sharing compatibility
- **Central focus**: Main concept in center, supporting elements around
- **Generous white space**: Clean, uncluttered design
- **Consistent margins**: Standard padding and spacing across all designs
- **Visual hierarchy**: Clear primary and secondary elements

### Book Category Adaptations

#### Business & Leadership Books
- Metaphors: Gears, ladders, charts, handshakes, lightbulbs
- Colors: Professional blues and grays with green accents
- Icons: Briefcases, graphs, arrows, people silhouettes

#### Personal Development
- Metaphors: Growth spirals, journey paths, transformation symbols
- Colors: Warm blues with orange/yellow accents for growth
- Icons: Plants, mountains, stairs, compasses

#### Technical & Programming
- Metaphors: Code blocks, circuits, building blocks, networks
- Colors: Darker blues with cyan accents
- Icons: Brackets, nodes, connections, geometric shapes

#### Philosophy & Literature
- Metaphors: Books, quills, light rays, thinking bubbles
- Colors: Deep blues with gold accents
- Icons: Ancient scrolls, glasses, lighthouses, trees

## Prompt Generation Guidelines

### Quote Visualization Process
1. **Extract Core Concept**: Identify the main idea from the quote
2. **Choose Metaphor**: Select appropriate visual metaphor from category guidelines
3. **Minimize Text**: Include only 2-4 essential words from the quote
4. **Apply Style**: Use consistent visual style requirements
5. **Add Context**: Include subtle book/author reference if space permits

### Output Format
Generate prompts in this structure:
"Vector illustration style — [CORE CONCEPT IN QUOTES] — [visual metaphor description] using professional color palette (primary #2563eb, secondary #64748b, accent #16a34a, background #ffffff). Minimal text, clean composition, educational aesthetic, 1:1 aspect ratio. Modern, professional design suitable for social sharing."

### Examples
- Business Quote: "Vector illustration style — 'Leadership is Influence' — central figure with radiating connection lines to smaller figures, using professional color palette. Minimal text, clean composition, 1:1 aspect ratio."
- Growth Quote: "Vector illustration style — 'Progress Not Perfection' — ascending staircase with small plant growing on each step, using professional color palette. Minimal text, clean composition, 1:1 aspect ratio."

## Quality Standards
- Every prompt must maintain visual consistency
- Text should be large enough to read but not dominate the design
- Colors must align with the professional palette
- Metaphors should be universally understood
- Design should work well at small sizes (social media thumbnails)

Generate prompts that create a cohesive visual library for book highlights while making each concept memorable and shareable.$$,
    'Book Highlights Visual Style Agent',
    'Generate consistent visual style prompts for book concept illustrations, focusing on minimal text and educational aesthetics.',
    'Visual Content Team',
    'Book Highlights Visual Style System Prompt',
    'System prompt for consistent book highlights visual generation'
  );

  RETURN 'SUCCESS: Book Highlights Visual Style Agent created with ID: ' || insert_result::text;
END;
$function$;