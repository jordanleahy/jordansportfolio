import React, { useState, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
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
import { useOptimizedCalendar } from '@/hooks/useOptimizedCalendar';
import { useThemeImport } from '@/hooks/useThemeImport';
import { supabase } from '@/integrations/supabase/client';
import { CategoriesGrid } from '@/components/calendar/CategoriesGrid';

// Lazy load components
const ThemeImportModal = React.lazy(() => import('@/components/calendar/ThemeImportModalOptimized').then(module => ({ default: module.ThemeImportModalOptimized })));

export default function CalendarDashboard() {
  const { user, loading, isAdmin, roleLoading } = useAuth();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [customThemeDescription, setCustomThemeDescription] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
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
      const { data, error } = await supabase.functions.invoke('generate-custom-theme', {
        body: { description: customThemeDescription.trim() }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate theme');
      }

      // Automatically validate and import the generated theme
      await validateInput(JSON.stringify(data.themeData, null, 2));
      await importData();
      
      toast({
        title: "Theme Generated & Imported!",
        description: `Generated and imported ${data.themeData.posts.length} posts for "${data.themeData.theme}"`,
      });

      setCustomThemeDescription('');

    } catch (error) {
      console.error('Error generating theme:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate custom theme",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingTheme(false);
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border p-8 mb-8">
          <div className="absolute inset-0 bg-grid-small-black/[0.02] bg-grid-pattern" />
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div className="flex-1">
              </div>
              
              {/* Theme Management Panel */}
              <div className="lg:w-80 space-y-4">
                <div className="space-y-3">
                  <Textarea
                    id="theme-description"
                    placeholder="Describe your theme... (e.g., 'AI applications in healthcare for medical professionals')"
                    value={customThemeDescription}
                    onChange={(e) => setCustomThemeDescription(e.target.value)}
                    className="min-h-[80px] resize-none"
                    disabled={isGeneratingTheme || isProcessing}
                  />
                  
                  {/* Submit button for custom theme */}
                  <Button
                    onClick={handleGenerateCustomTheme}
                    disabled={isGeneratingTheme || isProcessing || !customThemeDescription.trim()}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Import Themes Button - Standalone below hero section */}
        {isAdmin && (
          <div className="container mx-auto px-4 mb-8">
            {roleLoading ? (
              <Skeleton className="w-48 h-10 mx-auto" />
            ) : (
              <div className="flex justify-center">
                <Button
                  onClick={() => setImportModalOpen(true)}
                  variant="outline"
                  className="px-8"
                >
                  Import Themes
                </Button>
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <Suspense fallback={<div>Loading...</div>}>
            <ThemeImportModal 
              open={importModalOpen} 
              onOpenChange={setImportModalOpen} 
              onImportComplete={handleImportComplete} 
            />
          </Suspense>
        )}

        {/* Categories Grid */}
        <CategoriesGrid 
          categories={availableCategories.filter(category => (postCounts[category] || 0) > 0)}
          postCounts={postCounts}
          categoryImages={categoryImages}
          onImportClick={() => setImportModalOpen(true)}
        />
      </div>
    </PageLayout>
  );
}