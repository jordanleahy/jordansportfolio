import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFailedThemeRecovery = () => {
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  const retryFailedTheme = async (themeId: string, category: string, themeName: string) => {
    setIsRetrying(themeId);
    
    try {
      console.log('[FailedThemeRecovery] Retrying theme:', { themeId, category, themeName });
      
      // Reset the theme status to allow regeneration
      const { error: updateError } = await supabase
        .from('themes')
        .update({
          theme_name: themeName.replace('Generation Failed', '').trim() || 'Retrying Theme Generation'
        })
        .eq('id', themeId);

      if (updateError) {
        throw updateError;
      }

      // Get theme description for regeneration
      const { data: themeData, error: fetchError } = await supabase
        .from('themes')
        .select('theme_description')
        .eq('id', themeId)
        .single();

      if (fetchError || !themeData?.theme_description) {
        throw new Error('Could not fetch theme description for regeneration');
      }

      // Generate new theme using the original description
      const { data: newThemeData, error: generateError } = await supabase.functions.invoke('generate-custom-theme', {
        body: { description: themeData.theme_description }
      });

      if (generateError || !newThemeData?.success) {
        throw new Error(generateError?.message || newThemeData?.error || 'Failed to regenerate theme');
      }

      // Import the newly generated theme
      const { error: importError } = await supabase.functions.invoke('process-and-import-theme', {
        body: {
          rawJson: newThemeData.themeData,
          idempotencyKey: `retry-theme-${themeId}-${Date.now()}`
        }
      });

      if (importError) {
        throw importError;
      }

      toast.success('Theme regeneration started', {
        description: 'Your theme is being regenerated. Please wait...'
      });

    } catch (error) {
      console.error('[FailedThemeRecovery] Retry failed:', error);
      toast.error('Failed to retry theme generation', {
        description: error instanceof Error ? error.message : 'Please try again later'
      });
    } finally {
      setIsRetrying(null);
    }
  };

  const deleteFailedTheme = async (themeId: string) => {
    try {
      console.log('[FailedThemeRecovery] Deleting failed theme:', themeId);
      
      // Delete associated posts first - using the social_media_posts table
      const { error: postsError } = await supabase
        .from('social_media_posts')
        .delete()
        .eq('theme_id', themeId);

      if (postsError) {
        console.warn('[FailedThemeRecovery] Error deleting posts:', postsError);
        // Continue with theme deletion even if posts deletion fails
      }

      // Delete the theme
      const { error: themeError } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId);

      if (themeError) {
        throw themeError;
      }

      toast.success('Failed theme deleted successfully');

    } catch (error) {
      console.error('[FailedThemeRecovery] Delete failed:', error);
      toast.error('Failed to delete theme', {
        description: error instanceof Error ? error.message : 'Please try again later'
      });
    }
  };

  return {
    retryFailedTheme,
    deleteFailedTheme,
    isRetrying
  };
};