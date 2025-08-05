/**
 * Utility functions for managing shimmer effects in theme operations
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Get theme name from theme_id for shimmer operations
 */
export async function getThemeNameById(themeId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('themes')
      .select('name')
      .eq('id', themeId)
      .single();
    
    if (error) {
      console.error('Error fetching theme name:', error);
      return null;
    }
    
    return data?.name || null;
  } catch (error) {
    console.error('Error in getThemeNameById:', error);
    return null;
  }
}

/**
 * Remove shimmer effect for a theme by name
 */
export function removeShimmerByName(
  themeName: string, 
  setShimmerThemes: React.Dispatch<React.SetStateAction<Set<string>>>
): void {
  console.log('🧹 Removing shimmer for theme:', themeName);
  setShimmerThemes(prev => {
    const newSet = new Set(prev);
    newSet.delete(themeName);
    return newSet;
  });
}

/**
 * Add shimmer effect for a theme by name
 */
export function addShimmerByName(
  themeName: string,
  setShimmerThemes: React.Dispatch<React.SetStateAction<Set<string>>>
): void {
  console.log('✨ Adding shimmer for theme:', themeName);
  setShimmerThemes(prev => {
    const newSet = new Set(prev);
    newSet.add(themeName);
    return newSet;
  });
}

/**
 * Handle theme image completion - combines lookup and shimmer removal
 */
export async function handleThemeImageCompletion(
  themeId: string,
  setShimmerThemes: React.Dispatch<React.SetStateAction<Set<string>>>
): Promise<string | null> {
  const themeName = await getThemeNameById(themeId);
  if (themeName) {
    removeShimmerByName(themeName, setShimmerThemes);
  }
  return themeName;
}