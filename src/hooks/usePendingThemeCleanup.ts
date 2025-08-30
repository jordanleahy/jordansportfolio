import { useEffect } from 'react';
import { PendingTheme } from '@/types/stories';
import { supabase } from '@/integrations/supabase/client';

interface UsePendingThemeCleanupOptions {
  pendingTheme: PendingTheme | null;
  setPendingTheme: React.Dispatch<React.SetStateAction<PendingTheme | null>>;
}

/**
 * Hook to automatically clean up stale pending themes
 * Checks if a pending theme exists in the database and clears it if not found
 */
export const usePendingThemeCleanup = ({ 
  pendingTheme, 
  setPendingTheme 
}: UsePendingThemeCleanupOptions) => {
  
  useEffect(() => {
    if (!pendingTheme?.theme_id) return;

    const cleanupTimer = setTimeout(async () => {
      try {
        console.log('🧹 Checking if pending theme exists in database:', pendingTheme.theme_id);
        
        const { data: theme, error } = await supabase
          .from('themes')
          .select('id, prompt_generation_status')
          .eq('id', pendingTheme.theme_id)
          .single();

        if (error || !theme) {
          console.log('❌ Pending theme not found in database, cleaning up');
          setPendingTheme(null);
          return;
        }

        // If theme exists but has been marked as failed or has no posts after 2 minutes
        if (theme.prompt_generation_status === 'failed') {
          console.log('❌ Theme marked as failed, cleaning up');
          setPendingTheme(null);
          return;
        }

        console.log('✅ Pending theme exists, keeping it');
        
      } catch (error) {
        console.error('Error checking pending theme:', error);
        // On error, clear pending state to prevent infinite loading
        setPendingTheme(null);
      }
    }, 30000); // Check after 30 seconds

    return () => clearTimeout(cleanupTimer);
  }, [pendingTheme?.theme_id, setPendingTheme]);

  return null;
};