import React, { useState, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useThemeImport } from '@/hooks/useThemeImport';
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { CategoriesGrid } from '@/components/stories/CategoriesGrid';

// Lazy load components
const ThemeImportModal = React.lazy(() => import('@/components/stories/ThemeImportModalOptimized').then(module => ({ default: module.ThemeImportModalOptimized })));

type ThemeWithPosts = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  post_count: number;
  first_post: {
    id: string;
    title: string;
    description: string;
    image_url?: string;
  } | null;
};

export default function StoriesDashboard() {
  const { user, loading, isAdmin, roleLoading } = useAuth();
  const queryClient = useQueryClient();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [customThemeDescription, setCustomThemeDescription] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const { toast } = useToast();

  // Simplified state management
  const [availableThemes, setAvailableThemes] = useState<ThemeWithPosts[]>([]);
  const [shimmerThemes, setShimmerThemes] = useState<Set<string>>(new Set());

  // Hook for theme import functionality
  const {
    validateInput,
    importData,
    isProcessing,
    validationResult,
    canImport,
    hasErrors
  } = useThemeImport({
    onImportComplete: () => {
      toast({
        title: "Success!",
        description: "Custom theme imported successfully",
      });
      setCustomThemeDescription('');
      refreshThemes();
    }
  });

  // Simplified function to refresh themes - removed console logs
  const refreshThemes = async () => {
    try {
      const themes = await optimizedSocialMediaService.getAvailableThemes();
      setAvailableThemes(themes);
    } catch (error) {
      console.error('Failed to fetch themes:', error);
      setAvailableThemes([]);
    }
  };

  // Initial load using React Query pattern
  React.useEffect(() => {
    if (user?.id) {
      refreshThemes();
    }
  }, [user?.id]);

  // Debounced theme refresh to prevent spam updates
  const [shouldRefreshThemes, setShouldRefreshThemes] = useState(false);
  const debouncedRefresh = useDebounce(shouldRefreshThemes, 300);

  React.useEffect(() => {
    if (debouncedRefresh) {
      queryClient.setQueryData(QUERY_KEYS.themes, (oldData: ThemeWithPosts[] | undefined) => {
        return oldData; // Keep existing data, let real-time handle updates
      });
      setShouldRefreshThemes(false);
    }
  }, [debouncedRefresh, queryClient]);

  // Simplified realtime handlers - removed unnecessary useCallback wrappers
  const handlePostInsert = (newPost: any) => {
    setShouldRefreshThemes(true);
    toast({
      title: "New Post Created!",
      description: `"${newPost.title}" added to ${newPost.category}`,
    });
  };

  const handlePostUpdate = (update: any) => {
    setShouldRefreshThemes(true);
  };

  // Theme image generation listener to remove shimmer when image generation completes
  React.useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('theme-image-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'social_media_posts',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const { new: newData, old: oldData } = payload;
          const { theme_image_generation_status, theme_id, category } = newData as any;
          const oldStatus = oldData?.theme_image_generation_status;
          
          // When image generation completes, get theme name to remove shimmer
          if (theme_image_generation_status === 'complete' && theme_id) {
            const { handleThemeImageCompletion } = await import('@/utils/shimmerUtils');
            const themeName = await handleThemeImageCompletion(theme_id, setShimmerThemes);
            
            if (themeName) {
              setShouldRefreshThemes(true);
              toast({
                title: "Theme Image Ready!",
                description: `"${themeName}" theme image has been generated`,
              });
            }
          }
          
          // Handle failed theme image generation
          if (oldStatus !== 'failed' && theme_image_generation_status === 'failed' && theme_id) {
            const { handleThemeImageCompletion } = await import('@/utils/shimmerUtils');
            const themeName = await handleThemeImageCompletion(theme_id, setShimmerThemes);
            
            if (themeName) {
              toast({
                title: "Image Generation Failed",
                description: `Theme image generation failed for "${themeName}"`,
                variant: "destructive"
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast]);

  // Realtime setup
  const { isConnected, connectionStatus } = useUnifiedRealtime({
    enabled: !!user,
    userId: user?.id,
    onPostInsert: handlePostInsert,
    onPostUpdate: handlePostUpdate
  });

  const handleDeleteCategory = async (category: string) => {
    try {
      const { error: postsError } = await supabase
        .from('social_media_posts')
        .delete()
        .eq('category', category)
        .eq('user_id', user?.id);

      if (postsError) throw postsError;

      const { error: cacheError } = await supabase
        .from('cached_prompts')
        .delete()
        .eq('category', category)
        .eq('user_id', user?.id);

      if (cacheError) console.warn('Failed to delete cached prompts:', cacheError);

      toast({
        title: "Category Deleted",
        description: `Successfully deleted "${category}" and all its posts`,
      });

      setShouldRefreshThemes(true);
    } catch (error) {
      console.error('Delete category error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  const handleGenerateCustomTheme = async () => {
    if (!customThemeDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe the theme you want to create",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingTheme(true);
    const tempThemeName = 'generating-theme-' + Date.now();
    
    try {
      setShimmerThemes(prev => new Set([...prev, tempThemeName]));

      const { data, error } = await supabase.functions.invoke('user-idea-streaming-image-pipeline', {
        body: { 
          description: customThemeDescription.trim(),
          stream: false
        }
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate theme');
      }

      // Simplified shimmer update using theme name directly
      setShimmerThemes(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempThemeName);
        newSet.add(data.theme);
        return newSet;
      });

      toast({
        title: "Theme Created!",
        description: `Generated "${data.theme}" with ${data.postCount} posts and theme image`,
      });

      setCustomThemeDescription('');

    } catch (error: any) {
      console.error('Theme generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate custom theme",
        variant: "destructive"
      });
      
      setShimmerThemes(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempThemeName);
        return newSet;
      });
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  // Use React Query loading pattern instead of local loading state
  if (loading) {
    return (
      <PageLayout>
        <CalendarSkeletonLoader />
      </PageLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Hero Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border mb-8 min-h-[200px] max-h-[40vh] flex">
          <div className="absolute inset-0 bg-grid-small-black/[0.02] bg-grid-pattern" />
          <Textarea
            id="theme-description"
            placeholder="Describe your theme... (e.g., 'AI applications in healthcare for medical professionals')"
            value={customThemeDescription}
            onChange={(e) => setCustomThemeDescription(e.target.value)}
            className="w-full flex-1 resize-none border-0 rounded-2xl bg-transparent p-6 focus-visible:ring-0 z-10 relative"
            disabled={isGeneratingTheme || isProcessing}
          />
        </div>

        {/* Action Buttons Section */}
        <div className="container mx-auto px-4 mb-8">
          <div className="flex justify-center gap-4 max-w-md mx-auto">
            <Button
              onClick={handleGenerateCustomTheme}
              disabled={isGeneratingTheme || isProcessing || !customThemeDescription.trim()}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isGeneratingTheme || isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isGeneratingTheme ? 'Generating...' : 'Importing...'}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>

            {isAdmin && (
              roleLoading ? (
                <Skeleton className="flex-1 h-10" />
              ) : (
                <Button
                  onClick={() => setImportModalOpen(true)}
                  variant="outline"
                  className="flex-1"
                >
                  Import Themes
                </Button>
              )
            )}

            <Button
              onClick={() => setShimmerThemes(new Set())}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Clear Shimmer
            </Button>
            <Button
              onClick={refreshThemes}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              🔄 Refresh
            </Button>
          </div>
        </div>

        {isAdmin && (
          <Suspense fallback={<div>Loading...</div>}>
            <ThemeImportModal 
              open={importModalOpen} 
              onOpenChange={setImportModalOpen} 
              onImportComplete={() => {
                setShimmerThemes(new Set());
                refreshThemes();
              }}
              onOptimisticStart={(themeName) => setShimmerThemes(prev => new Set([...prev, themeName]))}
              onOptimisticComplete={async (success, themeName) => {
                if (success && themeName) {
                  await refreshThemes();
                } else if (themeName) {
                  setShimmerThemes(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(themeName);
                    return newSet;
                  });
                }
              }}
            />
          </Suspense>
        )}

        {/* Themes Grid */}
        <CategoriesGrid 
          themes={availableThemes}
          shimmerThemes={Array.from(shimmerThemes)}
          onDeleteCategory={handleDeleteCategory}
        />
      </div>
    </PageLayout>
  );
}