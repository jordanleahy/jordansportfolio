import React, { useState, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useOptimizedStories } from '@/hooks/useOptimizedStories';
import { useThemeImport } from '@/hooks/useThemeImport';
import { useUserIdeaPipeline } from '@/hooks/useUserIdeaPipeline';
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import { supabase } from '@/integrations/supabase/client';
import { CategoriesGrid } from '@/components/stories/CategoriesGrid';

// Lazy load components
const ThemeImportModal = React.lazy(() => import('@/components/stories/ThemeImportModalOptimized').then(module => ({ default: module.ThemeImportModalOptimized })));

export default function StoriesDashboard() {
  const { user, loading, isAdmin, roleLoading } = useAuth();
  const queryClient = useQueryClient();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [customThemeDescription, setCustomThemeDescription] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const { toast } = useToast();

  // Use the optimized stories hook for performance
  const {
    isInitialized,
    isLoadingCategories,
    availableCategories,
    hasCategories,
    isEmpty,
    invalidateCache
  } = useOptimizedStories(user);

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
      invalidateCache();
    }
  });

  // Calculate post counts and first images for each category
  const [postCounts, setPostCounts] = React.useState<Record<string, number>>({});
  const [categoryImages, setCategoryImages] = React.useState<Record<string, string>>({});
  const [firstPostsData, setFirstPostsData] = React.useState<Record<string, { title: string; description: string }>>({});
  const [shimmerCategories, setShimmerCategories] = React.useState<string[]>([]);
  const [imageGeneratingCategories, setImageGeneratingCategories] = React.useState<string[]>([]);

  // Helper function to refresh post counts and images
  const refreshPostCountsAndImages = React.useCallback(async () => {
    if (!availableCategories.length) return;
    
    const counts: Record<string, number> = {};
    const images: Record<string, string> = {};
    const firstPosts: Record<string, { title: string; description: string }> = {};
    
    for (const category of availableCategories) {
      try {
        const posts = await optimizedSocialMediaService.getPostsByCategory(category);
        counts[category] = posts.length;
        
        // Get first post for streaming data and check theme image status
        const firstPost = posts[0];
        if (firstPost) {
          firstPosts[category] = {
            title: firstPost.title,
            description: firstPost.description
          };
          
          // Track if theme image is being generated
          if (firstPost.theme_image_generation_status === 'generating') {
            setImageGeneratingCategories(prev => 
              prev.includes(category) ? prev : [...prev, category]
            );
          }
        }
        
        // Sort posts by day first, then find the first one with an image
        const sortedPosts = posts.sort((a, b) => (a.day || 0) - (b.day || 0));
        const firstPostWithImage = sortedPosts.find(post => 
          post.theme_image_4_3_url || // Priority to theme image
          post.image_16_9_url || 
          post.image_4_3_url || 
          post.image_9_16_url || 
          post.image_3_4_url
        );
        
        if (firstPostWithImage) {
          // Prefer theme image for cards, then 16:9, fallback to other ratios
          images[category] = firstPostWithImage.theme_image_4_3_url ||
                            firstPostWithImage.image_16_9_url || 
                            firstPostWithImage.image_4_3_url ||
                            firstPostWithImage.image_9_16_url ||
                            firstPostWithImage.image_3_4_url ||
                            '';
        }
      } catch (error) {
        console.error(`Error fetching posts for ${category}:`, error);
        counts[category] = 0;
      }
    }
    setPostCounts(counts);
    setCategoryImages(images);
    setFirstPostsData(firstPosts);
  }, [availableCategories]);

  // Setup realtime subscription for immediate updates
  const handlePostInsert = React.useCallback((newPost: any) => {
    console.log('🆕 New post created:', newPost.title, 'in category:', newPost.category);
    // Trigger cache invalidation and refresh category data
    invalidateCache();
    refreshPostCountsAndImages();
    // Show toast notification
    toast({
      title: "New Post Created!",
      description: `"${newPost.title}" added to ${newPost.category}`,
    });
  }, [invalidateCache, refreshPostCountsAndImages, toast]);

  const handlePostUpdate = React.useCallback((update: any) => {
    console.log('📝 Post updated:', update.postId, 'in category:', update.category);
    // Refresh category images in case image URLs changed
    refreshPostCountsAndImages();
  }, [refreshPostCountsAndImages]);

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
          const { theme_image_generation_status, category } = newData as any;
          const oldStatus = oldData?.theme_image_generation_status;
          
          // Track theme image generation status changes
          if (oldStatus !== 'generating' && theme_image_generation_status === 'generating' && category) {
            console.log('🎨 Theme image generation started for:', category);
            setImageGeneratingCategories(prev => 
              prev.includes(category) ? prev : [...prev, category]
            );
          }
          
          // Remove from generating and shimmer when theme image generation completes
          if (
            oldStatus !== 'complete' && 
            theme_image_generation_status === 'complete' && 
            category
          ) {
            console.log('🎨 Theme image generation completed for:', category);
            setImageGeneratingCategories(prev => prev.filter(cat => cat !== category));
            setShimmerCategories(prev => prev.filter(cat => cat !== category));
            refreshPostCountsAndImages(); // Refresh to show the new image
          }
          
          // Also remove from generating and shimmer if generation failed
          if (
            oldStatus !== 'failed' && 
            theme_image_generation_status === 'failed' && 
            category
          ) {
            console.log('❌ Theme image generation failed for:', category);
            setImageGeneratingCategories(prev => prev.filter(cat => cat !== category));
            setShimmerCategories(prev => prev.filter(cat => cat !== category));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, shimmerCategories, imageGeneratingCategories, refreshPostCountsAndImages]);

  const { isConnected, connectionStatus } = useUnifiedRealtime({
    enabled: !!user,
    userId: user?.id,
    onPostInsert: handlePostInsert,
    onPostUpdate: handlePostUpdate
  });

  // Debug connection status
  React.useEffect(() => {
    console.log(`[StoriesDashboard] Realtime connection status: ${connectionStatus}, connected: ${isConnected}`);
  }, [connectionStatus, isConnected]);

  React.useEffect(() => {
    refreshPostCountsAndImages();
  }, [refreshPostCountsAndImages]);

  const handleImportComplete = async () => {
    // Clear any shimmer states and refresh data
    setShimmerCategories([]);
    setImageGeneratingCategories([]);
    invalidateCache();
  };

  const handleOptimisticStart = (categoryName: string) => {
    // Add shimmer card immediately
    setShimmerCategories(prev => [...prev, categoryName]);
  };

  const handleOptimisticComplete = async (success: boolean, categoryName?: string) => {
    if (categoryName && success) {
      // Wait for categories query to refresh first
      await queryClient.invalidateQueries({ queryKey: ['available-categories'] });
      await queryClient.refetchQueries({ queryKey: ['available-categories'] });
      
      // Then wait for data to actually load
      await refreshPostCountsAndImages();
      
      // DON'T remove shimmer here - let it persist until theme image generation completes
      // The shimmer will be removed by real-time updates when theme image is generated
      console.log('🎉 Theme import successful, but keeping shimmer until image generation completes');
    } else if (categoryName) {
      // Remove shimmer immediately on failure
      setShimmerCategories(prev => prev.filter(cat => cat !== categoryName));
    }
  };

  const handleDeleteCategory = async (category: string) => {
    try {
      // Delete all posts for this category
      const { error: postsError } = await supabase
        .from('social_media_posts')
        .delete()
        .eq('category', category)
        .eq('user_id', user?.id);

      if (postsError) throw postsError;

      // Delete cached prompts for this category
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

      // Refresh data
      invalidateCache();
      refreshPostCountsAndImages();
      setShimmerCategories(prev => prev.filter(cat => cat !== category));

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
      // Add optimistic shimmer for new category
      const tempCategoryName = customThemeDescription.trim().toLowerCase().replace(/\s+/g, '-').substring(0, 30);
      setShimmerCategories(prev => [...prev, tempCategoryName]);

      console.log('🚀 Calling edge function with:', {
        description: customThemeDescription.trim(),
        userId: user?.id,
        stream: false
      });

      const { data, error } = await supabase.functions.invoke('user-idea-streaming-image-pipeline', {
        body: { 
          description: customThemeDescription.trim(),
          stream: false
        }
      });

      console.log('📡 Edge function response:', { data, error });

      if (error) {
        console.error('🚨 Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data?.success) {
        console.error('🚨 Theme generation failed:', data);
        throw new Error(data?.error || 'Failed to generate theme');
      }

      toast({
        title: "Theme Created!",
        description: `Generated "${data.theme}" with ${data.postCount} posts and theme image`,
      });

      setCustomThemeDescription('');
      
      // Refresh data after successful generation
      invalidateCache();
      refreshPostCountsAndImages();

    } catch (error) {
      console.error('Theme generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate custom theme",
        variant: "destructive"
      });
      
      // Remove shimmer on error
      const tempCategoryName = customThemeDescription.trim().toLowerCase().replace(/\s+/g, '-').substring(0, 30);
      setShimmerCategories(prev => prev.filter(cat => cat !== tempCategoryName));
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  // Manual shimmer clear function for debugging
  const clearShimmer = () => {
    setShimmerCategories([]);
    setImageGeneratingCategories([]);
    console.log('🧹 Manually cleared all shimmer states');
  };

  if (loading || (!isInitialized && isLoadingCategories)) {
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

        {/* Action Buttons Section - Submit and Import Themes */}
        <div className="container mx-auto px-4 mb-8">
          <div className="flex justify-center gap-4 max-w-md mx-auto">
            {/* Submit Button - Always visible */}
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

            {/* Import Themes Button - Admin only */}
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

            {/* Debug button to clear shimmer - temporary */}
            <Button
              onClick={clearShimmer}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Clear Shimmer
            </Button>
          </div>
        </div>

        {isAdmin && (
          <Suspense fallback={<div>Loading...</div>}>
            <ThemeImportModal 
              open={importModalOpen} 
              onOpenChange={setImportModalOpen} 
              onImportComplete={handleImportComplete}
              onOptimisticStart={handleOptimisticStart}
              onOptimisticComplete={handleOptimisticComplete}
            />
          </Suspense>
        )}

        {/* Categories Grid */}
        <CategoriesGrid 
          categories={availableCategories.filter(category => {
            // Show categories with posts that are NOT in shimmer state
            const hasRealPosts = (postCounts[category] || 0) > 0;
            const isInShimmer = shimmerCategories.includes(category);
            console.log('🔍 Category filtering debug:', {
              category,
              hasRealPosts,
              isInShimmer,
              postCount: postCounts[category],
              willShow: hasRealPosts && !isInShimmer
            });
            return hasRealPosts && !isInShimmer;
          })}
          postCounts={postCounts}
          categoryImages={categoryImages}
          shimmerCategories={(() => {
            // Only show shimmer for categories being created (no posts yet)
            const creatingShimmer = shimmerCategories.filter(category => (postCounts[category] || 0) === 0);
            console.log('🎭 Shimmer debug:', {
              shimmerCategories,
              imageGeneratingCategories,
              postCounts,
              creatingShimmer,
              finalShimmer: creatingShimmer
            });
            return creatingShimmer;
          })()}
          firstPostsData={firstPostsData}
          onDeleteCategory={handleDeleteCategory}
        />
      </div>
    </PageLayout>
  );
}