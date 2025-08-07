import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { createLogger, timeOperation } from '../_shared/advanced-logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Similarity threshold (0-1, where 1 is identical)
const SIMILARITY_THRESHOLD = 0.75;

// Common category synonyms and variations
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  'miami': ['miami-for-adults', 'adult-activities', 'miami-adults', 'miami-nightlife'],
  'travel': ['travel-guides', 'travel-tips', 'traveling', 'tourism'],
  'family': ['family-travel', 'family-fun', 'family-activities', 'kids'],
  'adult': ['adult-activities', 'adult-entertainment', 'adults-only', 'nightlife'],
  'food': ['dining', 'restaurants', 'cuisine', 'culinary'],
  'business': ['professional', 'corporate', 'work', 'career'],
  'health': ['healthcare', 'medical', 'wellness', 'fitness'],
};

function normalizeCategory(category: string): string {
  return category.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function findCategorySynonym(category: string): string {
  const normalized = normalizeCategory(category);
  
  for (const [key, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    if (normalized.includes(key) || synonyms.some(syn => normalized.includes(syn))) {
      return key;
    }
  }
  
  return normalized;
}

async function calculateSemanticSimilarity(category1: string, category2: string, logger: any): Promise<number> {
  if (!openAIApiKey) {
    logger.warn('OpenAI API key not available, falling back to basic similarity');
    return basicSimilarity(category1, category2);
  }

  try {
    logger.info(`Calculating semantic similarity`, {
      category1,
      category2,
      method: 'openai_embeddings'
    });
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      logger.warn('OpenAI embeddings request timed out', { timeout: '5000ms' });
    }, 5000); // 5 second timeout

    logger.startTiming('openai_embeddings');

    // Use OpenAI embeddings to calculate semantic similarity
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: [category1, category2],
      }),
      signal: controller.signal, // Add timeout signal
    });

    clearTimeout(timeoutId); // Clear timeout if request completes
    const duration = logger.endTiming('openai_embeddings');

    if (!response.ok) {
      logger.error(`OpenAI embeddings API error`, null, {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`
      });
      return basicSimilarity(category1, category2);
    }

    const data = await response.json();
    const [embedding1, embedding2] = data.data.map((d: any) => d.embedding);
    
    // Calculate cosine similarity
    const dotProduct = embedding1.reduce((sum: number, a: number, i: number) => sum + a * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum: number, a: number) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum: number, a: number) => sum + a * a, 0));
    
    const similarity = dotProduct / (magnitude1 * magnitude2);
    
    logger.success(`Semantic similarity calculated successfully`, {
      category1,
      category2,
      similarity: similarity.toFixed(4),
      method: 'openai_embeddings',
      duration: `${duration}ms`
    });
    
    return similarity;
    
  } catch (error) {
    // Handle timeout and other errors
    if (error.name === 'AbortError') {
      logger.warn('OpenAI embeddings request aborted due to timeout', {
        timeout: '5000ms',
        fallbackMethod: 'basic_similarity'
      });
    } else {
      logger.error('Error calculating semantic similarity', error, {
        fallbackMethod: 'basic_similarity',
        errorType: error.name
      });
    }
    return basicSimilarity(category1, category2);
  }
}

function basicSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeCategory(str1);
  const norm2 = normalizeCategory(str2);
  
  // Check if they're exactly the same
  if (norm1 === norm2) return 1.0;
  
  // Check synonym groups
  const syn1 = findCategorySynonym(norm1);
  const syn2 = findCategorySynonym(norm2);
  if (syn1 === syn2) return 0.9;
  
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
  
  // Calculate Levenshtein distance ratio
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  return 1 - (distance / maxLength);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger({
    functionName: 'check-category-similarity',
    correlationId: req.headers.get('x-correlation-id') || undefined
  });

  logger.logFunctionStart('check-category-similarity');

  try {
    const requestBody = await req.json();
    const { category, userId } = requestBody;
    
    logger.logUserAction('category_similarity_check', { category, userId });
    
    if (!category || !userId) {
      logger.error('Missing required fields', null, { 
        providedFields: Object.keys(requestBody),
        requiredFields: ['category', 'userId']
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: category and userId'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logger.info('Processing similarity check', {
      category,
      userId: userId.slice(0, 8) + '...',
      threshold: SIMILARITY_THRESHOLD
    });

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get existing categories for this user
    logger.startTiming('database_fetch');
    const { data: existingThemes, error } = await timeOperation(
      logger,
      'fetch_existing_themes',
      () => supabase
        .from('themes')
        .select('id, theme_name, category, description, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    );

    if (error) {
      logger.logDatabaseOperation('SELECT', 'themes', null, error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch existing themes'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logger.logDatabaseOperation('SELECT', 'themes', existingThemes);
    logger.info('Found existing themes', {
      count: existingThemes?.length || 0,
      categories: existingThemes?.map(t => t.category) || []
    });

    const similarCategories = [];
    
    // Check similarity with existing categories
    logger.startTiming('similarity_analysis');
    for (const theme of existingThemes || []) {
      const similarity = await calculateSemanticSimilarity(category, theme.category, logger);
      
      logger.debug(`Similarity check result`, {
        newCategory: category,
        existingCategory: theme.category,
        similarity: similarity.toFixed(4),
        threshold: SIMILARITY_THRESHOLD,
        isAboveThreshold: similarity >= SIMILARITY_THRESHOLD
      });
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        similarCategories.push({
          id: theme.id,
          theme_name: theme.theme_name,
          category: theme.category,
          similarity: similarity,
          created_at: theme.created_at
        });
      }
    }
    logger.endTiming('similarity_analysis');

    // Sort by similarity (highest first)
    similarCategories.sort((a, b) => b.similarity - a.similarity);

    logger.success('Similarity analysis completed', {
      newCategory: category,
      totalExistingCategories: existingThemes?.length || 0,
      similarCategoriesFound: similarCategories.length,
      threshold: SIMILARITY_THRESHOLD,
      topSimilarCategory: similarCategories[0] ? {
        category: similarCategories[0].category,
        similarity: similarCategories[0].similarity.toFixed(4)
      } : null
    });

    const response = {
      success: true,
      hasSimilar: similarCategories.length > 0,
      similarCategories: similarCategories,
      threshold: SIMILARITY_THRESHOLD,
      checkedCategory: category,
      analysis: {
        totalChecked: existingThemes?.length || 0,
        similarFound: similarCategories.length,
        processingTime: logger.getContext()
      }
    };

    logger.logFunctionEnd('check-category-similarity', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.logFunctionEnd('check-category-similarity', null, error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});