import { supabase } from "@/integrations/supabase/client";
import { ColorTheme, CreateColorTheme, UpdateColorTheme } from "@/types/colorTheme";

export class ColorThemeService {
  private cache = new Map<string, { data: ColorTheme[], timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(prefix = 'themes') {
    return `${prefix}_all`;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_TTL;
  }

  private setCache(key: string, data: ColorTheme[]) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getFromCache(key: string): ColorTheme[] | null {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  async getAllColorThemes(): Promise<ColorTheme[]> {
    const cacheKey = this.getCacheKey();
    
    if (this.isValidCache(cacheKey)) {
      return this.getFromCache(cacheKey)!;
    }

    const { data, error } = await supabase
      .from('color_themes')
      .select('*')
      .order('is_default', { ascending: false })
      .order('is_system', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching color themes:', error);
      throw error;
    }

    this.setCache(cacheKey, data || []);
    return data || [];
  }

  async getColorThemeById(id: string): Promise<ColorTheme | null> {
    const { data, error } = await supabase
      .from('color_themes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching color theme:', error);
      return null;
    }

    return data;
  }

  async getDefaultColorTheme(): Promise<ColorTheme | null> {
    const { data, error } = await supabase
      .from('color_themes')
      .select('*')
      .eq('is_default', true)
      .eq('is_system', true)
      .single();

    if (error) {
      console.error('Error fetching default color theme:', error);
      return null;
    }

    return data;
  }

  async createColorTheme(theme: CreateColorTheme): Promise<ColorTheme> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to create color themes');
    }

    const { data, error } = await supabase
      .from('color_themes')
      .insert({
        ...theme,
        user_id: user.id,
        is_default: false,
        is_system: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating color theme:', error);
      throw error;
    }

    this.invalidateCache();
    return data;
  }

  async updateColorTheme(theme: UpdateColorTheme): Promise<ColorTheme> {
    const { id, ...updates } = theme;
    
    const { data, error } = await supabase
      .from('color_themes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating color theme:', error);
      throw error;
    }

    this.invalidateCache();
    return data;
  }

  async deleteColorTheme(id: string): Promise<void> {
    const { error } = await supabase
      .from('color_themes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting color theme:', error);
      throw error;
    }

    this.invalidateCache();
  }

  async duplicateColorTheme(id: string, newName: string): Promise<ColorTheme> {
    const originalTheme = await this.getColorThemeById(id);
    if (!originalTheme) {
      throw new Error('Color theme not found');
    }

    const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const newTheme: CreateColorTheme = {
      name: newName,
      slug: newSlug,
      description: `Copy of ${originalTheme.name}`,
      primary_color: originalTheme.primary_color,
      secondary_color: originalTheme.secondary_color,
      accent_color: originalTheme.accent_color,
      background_color: originalTheme.background_color,
      text_color: originalTheme.text_color,
      border_color: originalTheme.border_color,
      color_instructions: originalTheme.color_instructions,
      visual_style: originalTheme.visual_style
    };

    return this.createColorTheme(newTheme);
  }

  public invalidateCache() {
    this.cache.clear();
  }
}

export const colorThemeService = new ColorThemeService();