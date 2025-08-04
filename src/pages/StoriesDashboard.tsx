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
  const [themeGenerationStatus, setThemeGenerationStatus] = React.useState<Record<string, string>>({});

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
        
        // Get first post for streaming data
        const firstPost = posts[0];
        if (firstPost) {
          firstPosts[category] = {
            title: firstPost.title,
            description: firstPost.description
          };
        }
        
        // Find first post with an image or theme image (checking multiple aspect ratios)
        const firstPostWithImage = posts.find(post => 
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
          
          // Track theme image generation status
          if (firstPostWithImage.theme_image_generation_status) {
            setThemeGenerationStatus(prev => ({
              ...prev,
              [category]: firstPostWithImage.theme_image_generation_status
            }));
          }
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
    
    // Check if theme image generation completed
    if (update.theme_image_generation_status === 'complete' || update.theme_image_generation_status === 'failed') {
      // Remove from shimmer categories once theme generation is done
      setShimmerCategories(prev => prev.filter(cat => cat !== update.category));
    }
    
    // Refresh category images in case image URLs changed
    refreshPostCountsAndImages();
  }, [refreshPostCountsAndImages]);

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
      
      // DON'T remove shimmer here - keep it until theme image generation completes
      // The shimmer will be removed by handlePostUpdate when theme image is ready
    } else if (categoryName) {
      // Remove shimmer immediately on failure
      setShimmerCategories(prev => prev.filter(cat => cat !== categoryName));
    }
  };

  const handleGenerateCustomTheme = async () => {
    console.log('🚀 [StoriesDashboard] Starting custom theme generation');
    console.log('📝 [StoriesDashboard] Description:', customThemeDescription.trim());
    console.log('👤 [StoriesDashboard] User:', user?.id);
    
    if (!customThemeDescription.trim()) {
      console.log('❌ [StoriesDashboard] No description provided');
      toast({
        title: "Description Required",
        description: "Please describe the theme you want to create",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingTheme(true);
    
    try {
      console.log('🎯 [StoriesDashboard] Calling generate-custom-theme edge function');
      const { data, error } = await supabase.functions.invoke('generate-custom-theme', {
        body: { description: customThemeDescription.trim() }
      });

      console.log('📥 [StoriesDashboard] Edge function response:', { data, error });

      if (error) {
        console.log('❌ [StoriesDashboard] Edge function error:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        console.log('❌ [StoriesDashboard] Edge function returned failure:', data);
        throw new Error(data.error || 'Failed to generate theme');
      }

      console.log('✅ [StoriesDashboard] Theme generated successfully:', data.themeData);
      console.log('📊 [StoriesDashboard] Generated posts count:', data.themeData.posts.length);
      console.log('🏷️ [StoriesDashboard] Generated category:', data.themeData.category);

      // Automatically validate and import the generated theme
      console.log('🔍 [StoriesDashboard] Starting validation');
      const validationResult = await validateInput(JSON.stringify(data.themeData, null, 2));
      console.log('📋 [StoriesDashboard] Validation result:', validationResult);
      
      console.log('💾 [StoriesDashboard] Starting import');
      await importData();
      console.log('✅ [StoriesDashboard] Import completed');
      
      toast({
        title: "Theme Generated & Imported!",
        description: `Generated and imported ${data.themeData.posts.length} posts for "${data.themeData.theme}"`,
      });

      setCustomThemeDescription('');

    } catch (error) {
      console.error('💥 [StoriesDashboard] Error generating theme:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate custom theme",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingTheme(false);
      console.log('🏁 [StoriesDashboard] Theme generation process finished');
    }
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
          categories={availableCategories.filter(category => (postCounts[category] || 0) > 0)}
          postCounts={postCounts}
          categoryImages={categoryImages}
          shimmerCategories={shimmerCategories}
          firstPostsData={firstPostsData}
          themeGenerationStatus={themeGenerationStatus}
        />
      </div>
    </PageLayout>
  );
}