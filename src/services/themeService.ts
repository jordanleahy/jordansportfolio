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

    // Always create the theme - no duplicate checks
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

    // Always create new theme - deprecating "find" behavior
    logger.info('Creating new theme (deprecated exact match check)');
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
