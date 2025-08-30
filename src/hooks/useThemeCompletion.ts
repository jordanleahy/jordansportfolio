import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ThemeWithPosts } from '@/types/stories';

interface UseThemeCompletionOptions {
  themes: ThemeWithPosts[];
  user: any;
}

/**
 * Simple hook to handle theme completion and navigation
 * Replaces the complex useThemeShimmer hook with database-first approach
 */
export const useThemeCompletion = ({ themes, user }: UseThemeCompletionOptions) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle navigation when themes complete
  useEffect(() => {
    if (!user) return;

    const completedThemes = themes.filter(theme => 
      theme.prompt_generation_status === 'completed' && 
      (theme.lifecycle_status === 'ready' || theme.lifecycle_status === 'generating')
    );

    completedThemes.forEach(theme => {
      if (theme.lifecycle_status === 'generating') {
        // Theme just completed, show notification and navigate
        toast({
          title: "Theme Complete!",
          description: `"${theme.theme_name}" is ready to view`,
        });
        
        // Auto-navigate to the completed theme after 1 second
        setTimeout(() => {
          navigate(`/stories/id/${theme.id}`);
        }, 1000);
      }
    });
  }, [themes, user, navigate, toast]);

  return {
    // Simple utility to dismiss generating themes (no longer needed with database-first)
    dismissGenerating: () => {
      // This is now handled automatically by the database state
      console.log('Theme completion handled by database state');
    },
    
    // Handle theme click navigation
    navigateToTheme: (themeId: string) => {
      navigate(`/stories/id/${themeId}`);
    }
  };
};