import React, { useState, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useOptimizedCalendar } from '@/hooks/useOptimizedCalendar';
import { CategoriesGrid } from '@/components/calendar/CategoriesGrid';

// Lazy load components
const ThemeImportModal = React.lazy(() => import('@/components/calendar/ThemeImportModalOptimized').then(module => ({ default: module.ThemeImportModalOptimized })));
const CustomThemeModal = React.lazy(() => import('@/components/calendar/CustomThemeModal').then(module => ({ default: module.CustomThemeModal })));

export default function CalendarDashboard() {
  const { user, loading, isAdmin, roleLoading } = useAuth();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [customThemeModalOpen, setCustomThemeModalOpen] = useState(false);
  const { toast } = useToast();

  // Use the optimized calendar hook for performance
  const {
    isInitialized,
    isLoadingCategories,
    availableCategories,
    hasCategories,
    isEmpty,
    invalidateCache
  } = useOptimizedCalendar(user);

  // Calculate post counts and first images for each category
  const [postCounts, setPostCounts] = React.useState<Record<string, number>>({});
  const [categoryImages, setCategoryImages] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchPostCountsAndImages = async () => {
      if (!availableCategories.length) return;
      
      const counts: Record<string, number> = {};
      const images: Record<string, string> = {};
      
      for (const category of availableCategories) {
        try {
          const posts = await optimizedSocialMediaService.getPostsByCategory(category);
          counts[category] = posts.length;
          
          // Find first post with an image (checking multiple aspect ratios)
          const firstPostWithImage = posts.find(post => 
            post.image_16_9_url || 
            post.image_4_3_url || 
            post.image_9_16_url || 
            post.image_3_4_url
          );
          
          if (firstPostWithImage) {
            // Prefer 16:9 for card display, fallback to other ratios
            images[category] = firstPostWithImage.image_16_9_url || 
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
    };

    fetchPostCountsAndImages();
  }, [availableCategories]);

  const handleImportComplete = async () => {
    toast({
      title: "Categories Updated",
      description: "Available categories have been refreshed after import.",
    });
    invalidateCache();
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border p-8 mb-8">
          <div className="absolute inset-0 bg-grid-small-black/[0.02] bg-grid-pattern" />
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div className="flex-1">
              </div>
              
              {/* Theme Management Panel */}
              <div className="lg:w-80 space-y-4">
                <Button
                  onClick={() => setCustomThemeModalOpen(true)}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  Custom
                </Button>
                
                {roleLoading ? (
                  <Skeleton className="w-full h-10" />
                ) : isAdmin && (
                  <Button
                    onClick={() => setImportModalOpen(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Import Themes
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <Suspense fallback={<div>Loading...</div>}>
            <ThemeImportModal 
              open={importModalOpen} 
              onOpenChange={setImportModalOpen} 
              onImportComplete={handleImportComplete} 
            />
          </Suspense>
        )}

        <Suspense fallback={<div>Loading...</div>}>
          <CustomThemeModal 
            isOpen={customThemeModalOpen}
            onClose={() => setCustomThemeModalOpen(false)}
            onImportComplete={handleImportComplete}
          />
        </Suspense>

        {/* Categories Grid */}
        <CategoriesGrid 
          categories={availableCategories}
          postCounts={postCounts}
          categoryImages={categoryImages}
          onImportClick={() => setImportModalOpen(true)}
        />
      </div>
    </PageLayout>
  );
}