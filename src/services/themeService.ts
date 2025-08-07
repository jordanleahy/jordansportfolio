import { supabase } from "@/integrations/supabase/client";
import type { Theme, CreateTheme, UpdateTheme } from "@/types/theme";

// Client-side logger for theme operations
class ThemeLogger {
  private context: { operation?: string; userId?: string } = {};

  setContext(operation: string, userId?: string) {
    this.context = { operation, userId: userId?.slice(0, 8) + '...' };
  }

  info(message: string, data?: any) {
    console.log(`🔵 [ThemeService:${this.context.operation}]`, message, data);
  }

  warn(message: string, data?: any) {
    console.warn(`🟡 [ThemeService:${this.context.operation}]`, message, data);
  }

  error(message: string, error?: any, data?: any) {
    console.error(`🔴 [ThemeService:${this.context.operation}]`, message, { error, ...data });
  }

  success(message: string, data?: any) {
    console.log(`✅ [ThemeService:${this.context.operation}]`, message, data);
  }

  timing(operation: string, startTime: number) {
    const duration = Date.now() - startTime;
    this.info(`⏱️ ${operation} completed`, { duration: `${duration}ms` });
    return duration;
  }
}

const logger = new ThemeLogger();

export class ThemeService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private getCacheKey(category?: string, userId?: string) {
    return `themes:${userId || 'current'}:${category || 'all'}`;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < cached.ttl;
  }

  private setCache(key: string, data: any, ttl = 5 * 60 * 1000) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private getFromCache(key: string) {
    const cached = this.cache.get(key);
    return cached?.data;
  }

  async getThemes(category?: string): Promise<Theme[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const cacheKey = this.getCacheKey(category, user.id);
    
    if (this.isValidCache(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    let query = supabase
      .from('themes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    const themes = (data || []) as Theme[];
    this.setCache(cacheKey, themes);
    return themes;
  }

  async getThemeById(id: string): Promise<Theme | null> {
    const cacheKey = `theme:${id}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    const theme = data as Theme | null;
    if (theme) {
      this.setCache(cacheKey, theme);
    }
    return theme;
  }

  async createTheme(theme: CreateTheme): Promise<Theme> {
    const startTime = Date.now();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    logger.setContext('createTheme', user.id);
    logger.info('Starting theme creation', { 
      theme_name: theme.theme_name, 
      category: theme.category 
    });

    // Check for similar categories before creating with timeout
    logger.info('Starting similarity check for duplicate prevention');
    try {
      // Add timeout to the similarity check (8 seconds total - allows for 5s OpenAI + processing)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Similarity check timeout')), 8000)
      );

      const similarityCheckStart = Date.now();
      const similarityPromise = supabase.functions.invoke('check-category-similarity', {
        body: { 
          category: theme.category, 
          userId: user.id 
        }
      });

      const similarityResponse = await Promise.race([similarityPromise, timeoutPromise]) as any;
      const similarityDuration = Date.now() - similarityCheckStart;
      
      logger.success('Similarity check completed', { 
        duration: `${similarityDuration}ms`,
        hasResponse: !!similarityResponse?.data
      });

      if (similarityResponse?.data?.hasSimilar) {
        const similarCategories = similarityResponse.data.similarCategories;
        const topSimilar = similarCategories[0];
        
        logger.warn('Similar category detected - blocking creation', {
          newCategory: theme.category,
          existingCategory: topSimilar.category,
          similarity: topSimilar.similarity,
          themeName: topSimilar.theme_name,
          threshold: similarityResponse.data.threshold
        });

        // Throw error with detailed information about the similar category
        throw new Error(
          `A similar theme already exists: "${topSimilar.theme_name}" with category "${topSimilar.category}". ` +
          `Similarity: ${Math.round(topSimilar.similarity * 100)}%. ` +
          `Please use the existing theme or choose a more distinct category name.`
        );
      }

      logger.success('No similar categories found - proceeding with creation');
      
    } catch (error) {
      // If it's our similarity error, re-throw it
      if (error instanceof Error && error.message.includes('similar theme already exists')) {
        logger.error('Theme creation blocked due to similarity', error);
        throw error;
      }
      
      // If it's a timeout or service error, log but continue (don't block theme creation)
      logger.warn('Similarity check failed/timed out - proceeding with fallback check', { 
        error: error.message,
        duration: Date.now() - startTime
      });
      
      // For network timeouts, we add an extra database-level check as fallback
      const exactMatchStart = Date.now();
      const { data: exactMatch } = await supabase
        .from('themes')
        .select('id, theme_name, category')
        .eq('user_id', user.id)
        .eq('category', theme.category)
        .maybeSingle();

      logger.timing('fallback_exact_match_check', exactMatchStart);

      if (exactMatch) {
        logger.error('Exact category match found - blocking creation', {
          existingTheme: exactMatch.theme_name,
          category: exactMatch.category
        });
        
        throw new Error(
          `A theme with category "${theme.category}" already exists: "${exactMatch.theme_name}". ` +
          `Please use the existing theme or choose a different category name.`
        );
      }
      
      logger.success('No exact matches found - proceeding with creation');
    }

    // Proceed with theme creation
    logger.info('Creating theme in database');
    const dbOperationStart = Date.now();
    
    const { data, error } = await supabase
      .from('themes')
      .insert({
        ...theme,
        user_id: user.id,
      })
      .select()
      .single();

    logger.timing('database_insert', dbOperationStart);

    if (error) {
      logger.error('Database insertion failed', error, {
        theme_name: theme.theme_name,
        category: theme.category,
        errorCode: error.code
      });
      throw error;
    }

    const createdTheme = data as Theme;
    
    // Invalidate cache
    this.invalidateAllCaches();
    
    const totalDuration = logger.timing('createTheme_total', startTime);
    logger.success('Theme creation completed successfully', {
      themeId: createdTheme.id,
      theme_name: createdTheme.theme_name,
      category: createdTheme.category,
      totalDuration: `${totalDuration}ms`
    });
    
    return createdTheme;
  }

  async updateTheme(theme: UpdateTheme): Promise<Theme> {
    const { data, error } = await supabase
      .from('themes')
      .update({
        theme_name: theme.theme_name,
        description: theme.description,
        category: theme.category,
      })
      .eq('id', theme.id)
      .select()
      .single();

    if (error) throw error;

    // Invalidate relevant caches
    this.invalidateAllCaches();
    
    return data as Theme;
  }

  async deleteTheme(id: string): Promise<void> {
    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Invalidate all caches
    this.invalidateAllCaches();
  }

  async findOrCreateTheme(theme_name: string, category: string, description?: string): Promise<Theme> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    logger.setContext('findOrCreateTheme', user.id);

    // Try to find existing theme by exact match first
    const { data: existingTheme } = await supabase
      .from('themes')
      .select('*')
      .eq('user_id', user.id)
      .eq('theme_name', theme_name)
      .eq('category', category)
      .maybeSingle();

    if (existingTheme) {
      logger.info('Found exact matching theme', {
        themeId: existingTheme.id,
        theme_name: existingTheme.theme_name
      });
      return existingTheme as Theme;
    }

    // Check for similar categories before creating new theme
    logger.info('Checking for similar categories before creating theme');
    try {
      const similarityResponse = await supabase.functions.invoke('check-category-similarity', {
        body: { 
          category: category, 
          userId: user.id 
        }
      });

      if (similarityResponse.data?.hasSimilar) {
        const similarCategories = similarityResponse.data.similarCategories;
        const topSimilar = similarCategories[0];
        
        logger.success('Found similar theme - returning existing instead of creating new', {
          newCategory: category,
          existingCategory: topSimilar.category,
          similarity: topSimilar.similarity,
          existingThemeName: topSimilar.theme_name
        });

        // Return the existing similar theme instead of creating a new one
        const { data: similarTheme } = await supabase
          .from('themes')
          .select('*')
          .eq('id', topSimilar.id)
          .single();

        if (similarTheme) {
          return similarTheme as Theme;
        }
      }
    } catch (error) {
      // If similarity check fails, log but continue with creation
      logger.warn('Similarity check failed - proceeding with creation', { error: error.message });
    }

    // Create new theme if no similar one found
    logger.info('No similar themes found - creating new theme');
    return this.createTheme({ theme_name, category, description });
  }

  private invalidateCache(category?: string, userId?: string) {
    if (category && userId) {
      this.cache.delete(this.getCacheKey(category, userId));
    }
    this.cache.delete(this.getCacheKey(undefined, userId));
    this.cache.delete(this.getCacheKey());
  }

  private invalidateAllCaches() {
    this.cache.clear();
  }
}

export const themeService = new ThemeService();