import { supabase } from "@/integrations/supabase/client";
import type { Theme, CreateTheme, UpdateTheme } from "@/types/theme";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('themes')
      .insert({
        ...theme,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidate relevant caches
    this.invalidateCache(theme.category, user.id);
    
    return data as Theme;
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

    // Try to find existing theme
    const { data: existingTheme } = await supabase
      .from('themes')
      .select('*')
      .eq('user_id', user.id)
      .eq('theme_name', theme_name)
      .eq('category', category)
      .maybeSingle();

    if (existingTheme) {
      return existingTheme as Theme;
    }

    // Create new theme if not found
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