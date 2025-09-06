import { supabase } from "@/integrations/supabase/client";
import { ColorTheme, CreateColorTheme, UpdateColorTheme } from "@/types/colorTheme";

export class ColorThemeService {
  async getAllColorThemes(): Promise<ColorTheme[]> {
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
}

export const colorThemeService = new ColorThemeService();
