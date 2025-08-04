import React, { useState, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useThemeImport } from '@/hooks/useThemeImport';
import { normalizeThemeName, debugThemeMapping } from '@/utils/themeNameUtils';
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import { supabase } from '@/integrations/supabase/client';
import { CategoriesGrid } from '@/components/stories/CategoriesGrid';

// Lazy load components
const ThemeImportModal = React.lazy(() => import('@/components/stories/ThemeImportModalOptimized').then(module => ({ default: module.ThemeImportModalOptimized })));

type Theme = {
  theme: string;
  theme_description: string | null;
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

  // Simplified theme-based state
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);
  const [shimmerThemes, setShimmerThemes] = useState<string[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);

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

  // Simplified function to refresh themes
  const refreshThemes = React.useCallback(async () => {
    console.log('🔄 REFRESH: Starting refreshThemes');
    setIsLoadingThemes(true);
    
    try {
      const themes = await optimizedSocialMediaService.getAvailableThemes();
      console.log('📊 REFRESH: Themes loaded:', themes);
      setAvailableThemes(themes);
    } catch (error) {
      console.error('❌ REFRESH: Failed to fetch themes:', error);
      setAvailableThemes([]);
    } finally {
      setIsLoadingThemes(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    if (user?.id) {
      refreshThemes();
    }
  }, [user?.id, refreshThemes]);

  // Setup realtime subscription for immediate updates
  const handlePostInsert = React.useCallback((newPost: any) => {
    refreshThemes();
    toast({
      title: "New Post Created!",
      description: `"${newPost.title}" added to ${newPost.category}`,
    });
  }, [refreshThemes, toast]);

  const handlePostUpdate = React.useCallback((update: any) => {
    console.log('🔄 REALTIME: handlePostUpdate called for post update', {
      postId: update?.id,
      category: update?.category,
      triggeringRefresh: true
    });
    
    refreshThemes();
    queryClient.invalidateQueries({ queryKey: ['themes'] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  }, [refreshThemes, queryClient]);

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
        (payload) => {
          const { new: newData, old: oldData } = payload;
          const { theme_image_generation_status, theme, category, theme_image_4_3_url } = newData as any;
          const oldStatus = oldData?.theme_image_generation_status;
          
          // Remove shimmer when theme image generation completes
          if (theme_image_generation_status === 'complete' && theme) {
            const normalizedTheme = normalizeThemeName(theme);
            debugThemeMapping('Real-time Complete', theme, normalizedTheme);
            
            setShimmerThemes(prev => {
              const filtered = prev.filter(shimmerTheme => normalizeThemeName(shimmerTheme) !== normalizedTheme);
              return filtered;
            });
            
            // Refresh themes to show new image
            setTimeout(() => refreshThemes(), 100);
          }
          
          // Handle failed theme image generation
          if (oldStatus !== 'failed' && theme_image_generation_status === 'failed' && theme) {
            const normalizedTheme = normalizeThemeName(theme);
            setShimmerThemes(prev => prev.filter(shimmerTheme => normalizeThemeName(shimmerTheme) !== normalizedTheme));
            toast({
              title: "Image Generation Failed",
              description: `Theme image generation failed for "${theme}"`,
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshThemes, toast]);

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

      refreshThemes();
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
    
    try {
      const tempThemeName = 'generating-theme-' + Date.now();
      setShimmerThemes(prev => [...prev, tempThemeName]);

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

      const normalizedTheme = normalizeThemeName(data.theme);
      debugThemeMapping('Custom Theme Generation', data.theme, normalizedTheme);
      
      setShimmerThemes(prev => {
        const filtered = prev.filter(theme => !theme.startsWith('generating-theme-'));
        return [...filtered, normalizedTheme];
      });

      toast({
        title: "Theme Created!",
        description: `Generated "${data.theme}" with ${data.postCount} posts and theme image`,
      });

      setCustomThemeDescription('');

    } catch (error) {
      console.error('Theme generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate custom theme",
        variant: "destructive"
      });
      
      setShimmerThemes(prev => prev.filter(theme => !theme.startsWith('generating-theme-')));
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  if (loading || isLoadingThemes) {
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
              onClick={() => setShimmerThemes([])}
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
                setShimmerThemes([]);
                refreshThemes();
              }}
              onOptimisticStart={(themeName) => setShimmerThemes(prev => [...prev, themeName])}
              onOptimisticComplete={async (success, themeName) => {
                if (success && themeName) {
                  await refreshThemes();
                } else if (themeName) {
                  setShimmerThemes(prev => prev.filter(theme => theme !== themeName));
                }
              }}
            />
          </Suspense>
        )}

        {/* Themes Grid */}
        <CategoriesGrid 
          themes={availableThemes}
          shimmerThemes={shimmerThemes}
          onDeleteCategory={handleDeleteCategory}
        />
      </div>
    </PageLayout>
  );
}