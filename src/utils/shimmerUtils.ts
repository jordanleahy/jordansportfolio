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
 * Get theme data with image URL verification
 */
async function getThemeWithImageUrl(themeId: string): Promise<{ name: string; hasImageUrl: boolean } | null> {
  try {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('theme_image_4_3_url')
      .eq('theme_id', themeId)
      .not('theme_image_4_3_url', 'is', null)
      .limit(1)
      .single();
    
    if (error || !data?.theme_image_4_3_url) {
      return null;
    }

    const themeName = await getThemeNameById(themeId);
    if (!themeName) return null;

    return {
      name: themeName,
      hasImageUrl: !!data.theme_image_4_3_url
    };
  } catch (error) {
    console.error('Error in getThemeWithImageUrl:', error);
    return null;
  }
}

/**
 * Handle theme image completion with image URL verification
 */
export async function handleThemeImageCompletion(
  themeId: string,
  setShimmerThemes: React.Dispatch<React.SetStateAction<Set<string>>>,
  refreshThemesCallback?: () => void
): Promise<string | null> {
  console.log('🔍 Checking theme completion for ID:', themeId);
  
  // First attempt: Check if image URL is immediately available
  let themeData = await getThemeWithImageUrl(themeId);
  
  // If no image URL yet, wait briefly and retry
  if (!themeData?.hasImageUrl) {
    console.log('⏳ Image URL not ready, waiting briefly...');
    await new Promise(resolve => setTimeout(resolve, 200));
    themeData = await getThemeWithImageUrl(themeId);
  }
  
  if (themeData?.hasImageUrl) {
    console.log('✅ Image URL confirmed, removing shimmer for:', themeData.name);
    
    // Refresh themes data first if callback provided
    if (refreshThemesCallback) {
      refreshThemesCallback();
      // Small delay to ensure data propagation
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    removeShimmerByName(themeData.name, setShimmerThemes);
    return themeData.name;
  } else {
    console.log('⚠️ Image URL still not available, keeping shimmer active');
    const themeName = await getThemeNameById(themeId);
    return themeName;
  }
}