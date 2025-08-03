
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
import { useOptimizedStories } from '@/hooks/useOptimizedStories';
import { useThemeImport } from '@/hooks/useThemeImport';
import { supabase } from '@/integrations/supabase/client';
import { CategoriesGrid } from '@/components/stories/CategoriesGrid';

// Lazy load components
const ThemeImportModal = React.lazy(() => import('@/components/stories/ThemeImportModalOptimized').then(module => ({ default: module.ThemeImportModalOptimized })));

export default function Index() {
  const { user, loading, isAdmin, roleLoading } = useAuth();
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
      setImportModalOpen(false);
      handleImportComplete();
    }
  });

  // State for post counts and category images
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});

  // Fetch post counts and representative images for each category
  React.useEffect(() => {
    const fetchCategoryData = async () => {
      if (!availableCategories.length || !user) return;
      
      try {
        const counts: Record<string, number> = {};
        const images: Record<string, string> = {};
        
        for (const category of availableCategories) {
          const posts = await optimizedSocialMediaService.getAllPosts(category);
          counts[category] = posts.length;
          
          // Find the first post with an image
          const postWithImage = posts.find(post => 
            post.image_16_9_url || 
            post.image_9_16_url || 
            post.image_3_4_url || 
            post.image_4_3_url
          );
          
          if (postWithImage) {
            images[category] = postWithImage.image_16_9_url || 
                             postWithImage.image_9_16_url || 
                             postWithImage.image_3_4_url || 
                             postWithImage.image_4_3_url || '';
          }
        }
        
        setPostCounts(counts);
        setCategoryImages(images);
      } catch (error) {
        console.error('Failed to fetch category data:', error);
      }
    };

    fetchCategoryData();
  }, [availableCategories, user]);

  const handleImportComplete = async () => {
    console.log('Import completed, refreshing data...');
    try {
      // Invalidate cache to refresh data
      invalidateCache();
      // Re-fetch category data
      const freshCategories = await optimizedSocialMediaService.getAvailableCategories();
      // The categories will be updated through the hook's reactivity
    } catch (error) {
      console.error('Failed to refresh data after import:', error);
    }
  };

  const handleGenerateCustomTheme = async () => {
    if (!customThemeDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a description for your custom theme.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingTheme(true);
    
    try {
      // Call the edge function to generate a custom theme
      const { data, error } = await supabase.functions.invoke('generate-custom-theme', {
        body: { description: customThemeDescription.trim() }
      });

      if (error) throw error;

      if (data?.theme) {
        // Validate and import the generated theme
        const validationResult = validateInput(JSON.stringify(data.theme));
        
        if (validationResult.success && validationResult.data) {
          await importData();
          setCustomThemeDescription('');
          toast({
            title: "Custom Theme Generated!",
            description: "Your custom theme has been generated and imported successfully.",
          });
        } else {
          throw new Error(validationResult.errors?.[0] || 'Generated theme is invalid');
        }
      } else {
        throw new Error('No theme data received from generation service');
      }
    } catch (error: any) {
      console.error('Custom theme generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate custom theme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  // Loading state while checking auth
  if (loading || roleLoading || !isInitialized) {
    return <CalendarSkeletonLoader />;
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PageLayout>
      {/* Hero section with custom theme generation */}
      <div className="space-y-8 mb-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Content Stories Dashboard
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Generate custom themes, import existing ones, or browse your content categories
          </p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span>{availableCategories.length} themes</span>
            <span>•</span>
            <span>{Object.values(postCounts).reduce((a, b) => a + b, 0)} total posts</span>
          </div>
        </div>

        {/* Custom Theme Generation */}
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-description">Create Custom Theme</Label>
            <Textarea
              id="theme-description"
              placeholder="Describe your custom theme (e.g., 'AI-powered healthcare solutions for hospitals and clinics')"
              value={customThemeDescription}
              onChange={(e) => setCustomThemeDescription(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleGenerateCustomTheme}
              disabled={isGeneratingTheme || !customThemeDescription.trim()}
              className="gap-2"
            >
              {isGeneratingTheme ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGeneratingTheme ? 'Generating...' : 'Generate Custom Theme'}
            </Button>
            
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={() => setImportModalOpen(true)}
              >
                Import Theme Data
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Theme Import Modal (Admin Only) */}
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
        categories={availableCategories}
        postCounts={postCounts}
        categoryImages={categoryImages}
      />
    </PageLayout>
  );
}
