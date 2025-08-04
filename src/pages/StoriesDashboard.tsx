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
import { normalizeThemeName, createThemeIdentifier, extractThemeFromPost, debugThemeMapping } from '@/utils/themeNameUtils';

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
  const [shimmerThemes, setShimmerThemes] = React.useState<string[]>([]);
  const [themeToCategory, setThemeToCategory] = React.useState<Record<string, string>>({});

  // Helper function to refresh post counts and images
  const refreshPostCountsAndImages = React.useCallback(async () => {
    if (!availableCategories.length) return;
    
    const counts: Record<string, number> = {};
    const images: Record<string, string> = {};
    const firstPosts: Record<string, { title: string; description: string }> = {};
    const themeToCategoryMap: Record<string, string> = {};
    
    for (const category of availableCategories) {
      try {
        const posts = await optimizedSocialMediaService.getPostsByCategory(category);
        counts[category] = posts.length;
        
        // Get first post for streaming data and theme mapping
        const firstPost = posts[0];
        if (firstPost) {
          firstPosts[category] = {
            title: firstPost.title,
            description: firstPost.description
          };
          
          // Map theme to category for shimmer tracking - use theme_description as fallback
          const themeKey = (firstPost as any).theme || firstPost.theme_description || category;
          if (themeKey) {
            themeToCategoryMap[themeKey] = category;
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
          const selectedImageUrl = firstPostWithImage.theme_image_4_3_url ||
                            firstPostWithImage.image_16_9_url || 
                            firstPostWithImage.image_4_3_url ||
                            firstPostWithImage.image_9_16_url ||
                            firstPostWithImage.image_3_4_url ||
                            '';
          
          images[category] = selectedImageUrl;
          
          // **LOG IMAGE SELECTION DECISION**
          console.log(`📸 IMAGE SELECTED for ${category}:`, {
            selectedType: firstPostWithImage.theme_image_4_3_url ? 'theme_image' :
                         firstPostWithImage.image_16_9_url ? '16_9' :
                         firstPostWithImage.image_4_3_url ? '4_3' :
                         firstPostWithImage.image_9_16_url ? '9_16' :
                         firstPostWithImage.image_3_4_url ? '3_4' : 'none',
            imageUrl: selectedImageUrl?.substring(0, 100) + '...',
            postId: firstPostWithImage.id,
            hasThemeImage: !!firstPostWithImage.theme_image_4_3_url,
            themeImageGenStatus: (firstPostWithImage as any).theme_image_generation_status
          });
        } else {
          console.log(`❌ NO IMAGES FOUND for category: ${category}`, {
            totalPosts: posts.length,
            checkedImageFields: ['theme_image_4_3_url', 'image_16_9_url', 'image_4_3_url', 'image_9_16_url', 'image_3_4_url']
          });
        }
      } catch (error) {
        console.error(`Error fetching posts for ${category}:`, error);
        counts[category] = 0;
      }
    }
    setPostCounts(counts);
    setCategoryImages(images);
    setFirstPostsData(firstPosts);
    setThemeToCategory(themeToCategoryMap);
  }, [availableCategories]);

  // Setup realtime subscription for immediate updates
  const handlePostInsert = React.useCallback((newPost: any) => {
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
          const { theme_image_generation_status, theme, category, theme_image_4_3_url } = newData as any;
          const oldStatus = oldData?.theme_image_generation_status;
          const oldThemeImageUrl = oldData?.theme_image_4_3_url;
          
          // **ENHANCED THEME IMAGE LOGGING**
          console.group('🎨 THEME IMAGE UPDATE RECEIVED');
          console.log('📥 Payload Data:', {
            theme,
            category,
            statusTransition: `${oldStatus} → ${theme_image_generation_status}`,
            urlChanged: oldThemeImageUrl !== theme_image_4_3_url,
            hasNewUrl: !!theme_image_4_3_url,
            timestamp: new Date().toISOString()
          });
          
          // Remove shimmer when theme image generation completes - use normalized theme name
          if (theme_image_generation_status === 'complete' && theme) {
            const normalizedTheme = normalizeThemeName(theme);
            
            console.log('✅ THEME IMAGE GENERATION COMPLETED:', {
              originalTheme: theme,
              normalizedTheme,
              category,
              hasImageUrl: !!theme_image_4_3_url,
              imageUrl: theme_image_4_3_url?.substring(0, 100) + '...'
            });
            
            debugThemeMapping('Real-time Complete', theme, normalizedTheme);
            
            setShimmerThemes(prev => {
              const filtered = prev.filter(shimmerTheme => normalizeThemeName(shimmerTheme) !== normalizedTheme);
              
              console.log('🔄 SHIMMER UPDATE:', {
                previousShimmerThemes: prev,
                removingTheme: normalizedTheme,
                newShimmerThemes: filtered,
                shimmerRemoved: prev.length !== filtered.length
              });
              
              return filtered;
            });
            
            // **TRIGGER REFRESH FOR CATEGORY IMAGES**
            console.log('🔄 TRIGGERING CATEGORY REFRESH due to theme image completion');
            refreshPostCountsAndImages(); // Refresh to show the new image
          }
          
          // Handle failed theme image generation
          if (
            oldStatus !== 'failed' && 
            theme_image_generation_status === 'failed' && 
            theme
          ) {
            const normalizedTheme = normalizeThemeName(theme);
            
            console.log('❌ THEME IMAGE GENERATION FAILED:', {
              originalTheme: theme,
              normalizedTheme,
              category
            });
            
            debugThemeMapping('Real-time Failed', theme, normalizedTheme);
            
            setShimmerThemes(prev => {
              const filtered = prev.filter(shimmerTheme => normalizeThemeName(shimmerTheme) !== normalizedTheme);
              
              console.log('🔄 SHIMMER REMOVAL (FAILED):', {
                previousShimmerThemes: prev,
                removingTheme: normalizedTheme,
                newShimmerThemes: filtered,
                shimmerRemoved: prev.length !== filtered.length
              });
              
              return filtered;
            });
            // Show error toast
            toast({
              title: "Image Generation Failed",
              description: `Theme image generation failed for "${theme}"`,
              variant: "destructive"
            });
          }
          
          console.groupEnd();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, shimmerThemes, refreshPostCountsAndImages, toast]);

  // Add polling fallback to catch missed real-time events
  React.useEffect(() => {
    if (!user?.id || shimmerThemes.length === 0) return;

    const checkShimmerStatus = async () => {
      try {
        console.log('🔍 [Shimmer Check] Checking status for themes:', shimmerThemes);
        
        for (const shimmerTheme of shimmerThemes) {
          // Skip temporary generating themes that don't exist in DB yet
          if (shimmerTheme.startsWith('generating-theme-')) {
            console.log('⏳ [Shimmer Check] Skipping temporary theme:', shimmerTheme);
            continue;
          }

          const normalizedTheme = normalizeThemeName(shimmerTheme);
          
          const { data, error } = await supabase
            .from('social_media_posts')
            .select('theme_image_generation_status, theme')
            .eq('user_id', user.id)
            .eq('theme', normalizedTheme)
            .limit(1)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('🚨 [Shimmer Check] Error:', error);
            continue;
          }

          if (data && (data.theme_image_generation_status === 'complete' || data.theme_image_generation_status === 'failed')) {
            console.log('🔄 [Shimmer Check] Found completed theme:', {
              theme: normalizedTheme,
              status: data.theme_image_generation_status
            });

            setShimmerThemes(prev => {
              const filtered = prev.filter(theme => normalizeThemeName(theme) !== normalizedTheme);
              console.log('🧹 [Shimmer Cleanup] Polling cleanup:', {
                originalShimmer: prev,
                removingTheme: normalizedTheme,
                newShimmer: filtered,
                status: data.theme_image_generation_status
              });
              return filtered;
            });

            // Refresh data to show the new image
            refreshPostCountsAndImages();
          }
        }
      } catch (error) {
        console.error('🚨 [Shimmer Check] Polling error:', error);
      }
    };

    // Check immediately, then every 10 seconds for missed events
    checkShimmerStatus();
    const interval = setInterval(checkShimmerStatus, 10000);

    return () => clearInterval(interval);
  }, [user?.id, shimmerThemes, refreshPostCountsAndImages]);

  const { isConnected, connectionStatus } = useUnifiedRealtime({
    enabled: !!user,
    userId: user?.id,
    onPostInsert: handlePostInsert,
    onPostUpdate: handlePostUpdate
  });


  React.useEffect(() => {
    refreshPostCountsAndImages();
  }, [refreshPostCountsAndImages]);

  const handleImportComplete = async () => {
    // Clear any shimmer states and refresh data
    setShimmerThemes([]);
    invalidateCache();
  };

  const handleOptimisticStart = (themeName: string) => {
    // Add shimmer card immediately  
    setShimmerThemes(prev => [...prev, themeName]);
  };

  const handleOptimisticComplete = async (success: boolean, themeName?: string) => {
    if (themeName && success) {
      // Wait for categories query to refresh first
      await queryClient.invalidateQueries({ queryKey: ['available-categories'] });
      await queryClient.refetchQueries({ queryKey: ['available-categories'] });
      
      // Then wait for data to actually load
      await refreshPostCountsAndImages();
      
      // DON'T remove shimmer here - let it persist until theme image generation completes
      // The shimmer will be removed by real-time updates when theme image is generated
      
    } else if (themeName) {
      // Remove shimmer immediately on failure
      setShimmerThemes(prev => prev.filter(theme => theme !== themeName));
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
      // Remove any shimmer themes associated with this category
      setShimmerThemes(prev => prev.filter(theme => themeToCategory[theme] !== category));

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
      // Add optimistic shimmer using theme name
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

      // Remove temporary shimmer and add the actual theme to shimmer (normalized)
      const normalizedTheme = normalizeThemeName(data.theme);
      debugThemeMapping('Custom Theme Generation', data.theme, normalizedTheme);
      
      setShimmerThemes(prev => {
        const filtered = prev.filter(theme => !theme.startsWith('generating-theme-'));
        const newShimmer = [...filtered, normalizedTheme];
        console.log('🔄 [Shimmer Addition] Custom Theme:', {
          originalShimmer: prev,
          addingTheme: normalizedTheme,
          newShimmer
        });
        return newShimmer;
      });

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
      setShimmerThemes(prev => prev.filter(theme => !theme.startsWith('generating-theme-')));
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  // Manual shimmer clear function for debugging
  const clearShimmer = () => {
    setShimmerThemes([]);
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
            // Show categories with posts that are NOT in shimmer state (check by theme)
            const hasRealPosts = (postCounts[category] || 0) > 0;
            const categoryThemes = Object.keys(themeToCategory).filter(theme => themeToCategory[theme] === category);
            const isInShimmer = categoryThemes.some(theme => shimmerThemes.includes(theme));
            return hasRealPosts && !isInShimmer;
          })}
          postCounts={postCounts}
          categoryImages={categoryImages}
          shimmerCategories={(() => {
            // Convert shimmer themes to categories for display
            return shimmerThemes.map(theme => themeToCategory[theme] || theme).filter(Boolean);
          })()}
          firstPostsData={firstPostsData}
          onDeleteCategory={handleDeleteCategory}
        />
      </div>
    </PageLayout>
  );
}