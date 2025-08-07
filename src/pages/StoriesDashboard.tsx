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
import { ThemesSkeleton } from '@/components/stories/ThemesSkeleton';
import { ThemeWithPosts, PendingTheme } from '@/types/stories';
import type { SocialMediaPost } from '@/types/socialMedia';

// Lazy load components
const ThemeImportModal = React.lazy(() => import('@/components/stories/ThemeImportModalOptimized').then(module => ({ default: module.ThemeImportModalOptimized })));

export default function StoriesDashboard() {
  const { user, loading, isAdmin, roleLoading } = useAuth();
  const queryClient = useQueryClient();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [customThemeDescription, setCustomThemeDescription] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<PendingTheme | null>(null);
  const { toast } = useToast();

  // Simplified state management
  const [availableThemes, setAvailableThemes] = useState<ThemeWithPosts[]>([]);

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
    }
  });

  // Enhanced initial load with loading states and error handling
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);
  const [themesError, setThemesError] = useState<string | null>(null);

  React.useEffect(() => {
    const loadThemes = async () => {
      if (user?.id) {
        try {
          setIsLoadingThemes(true);
          setThemesError(null);
          const themes = await optimizedSocialMediaService.getAvailableThemes();
          setAvailableThemes(themes);
          
          // Clear textarea on page load to prevent accidental re-submission on refresh
          setCustomThemeDescription('');
        } catch (error) {
          console.error('Failed to fetch themes:', error);
          setThemesError(error.message || 'Failed to load themes');
          setAvailableThemes([]);
        } finally {
          setIsLoadingThemes(false);
        }
      }
    };
    loadThemes();
  }, [user?.id]);

  // Simplified realtime handlers
  const handlePostInsert = (newPost: SocialMediaPost) => {
    toast({
      title: "New Post Created!",
      description: `"${newPost.title}" added to ${newPost.category}`,
    });
  };

  const handlePostUpdate = (post: SocialMediaPost) => {
    // Handle post updates if needed
    console.log('Post updated:', post);
  };


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

    const themeDescription = customThemeDescription.trim();
    setCustomThemeDescription(''); // Clear input immediately
    setIsGeneratingTheme(true);
    
    // Create a pending shimmer theme for optimistic UI
    const shimmerTheme: ThemeWithPosts = {
      id: 'pending-' + Date.now(),
      theme_name: themeDescription.slice(0, 50) + (themeDescription.length > 50 ? '...' : ''),
      description: themeDescription,
      category: themeDescription.slice(0, 50),
      post_count: 0,
      first_post: {
        id: 'pending',
        title: 'Generating theme...',
        description: themeDescription
      }
    };
    
    setPendingTheme({
      theme_name: shimmerTheme.theme_name,
      description: themeDescription
    });
    
    // Add shimmer theme to the beginning of the list
    setAvailableThemes(prev => [shimmerTheme, ...prev]);
    
    try {
      const { data, error } = await supabase.functions.invoke('user-idea-streaming-image-pipeline', {
        body: { 
          description: themeDescription,
          stream: false
        }
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate theme');
      }

      toast({
        title: "Theme Created!",
        description: `Generated "${data.theme}" with ${data.postCount} posts and theme image`,
      });

      // Remove the pending shimmer theme and refresh the list
      setPendingTheme(null);
      setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
      
      // Refresh themes from server
      const refreshedThemes = await optimizedSocialMediaService.getAvailableThemes();
      setAvailableThemes(refreshedThemes);

    } catch (error: any) {
      console.error('Theme generation error:', error);
      
      // Remove the pending shimmer theme on error
      setPendingTheme(null);
      setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
      
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate custom theme",
        variant: "destructive"
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

          </div>
        </div>

        {isAdmin && (
          <Suspense fallback={<div>Loading...</div>}>
            <ThemeImportModal 
              open={importModalOpen} 
              onOpenChange={setImportModalOpen} 
              onImportComplete={() => {
                // Theme import completed
              }}
            />
          </Suspense>
        )}

        {/* Enhanced Themes Grid with Loading States */}
        {isLoadingThemes ? (
          <ThemesSkeleton />
        ) : themesError ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              ⚠️ Failed to load themes: {themesError}
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <CategoriesGrid 
            themes={availableThemes}
            onDeleteCategory={handleDeleteCategory}
          />
        )}
      </div>
    </PageLayout>
  );
}