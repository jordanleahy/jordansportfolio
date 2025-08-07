import React, { useState, useEffect, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Users } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useThemeImport } from '@/hooks/useThemeImport';
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { CategoriesGrid } from '@/components/stories/CategoriesGrid';
import { ThemesSkeleton } from '@/components/stories/ThemesSkeleton';
import { BulkActionsToolbar } from '@/components/stories/BulkActionsToolbar';
import { BulkDeleteConfirmationDialog } from '@/components/stories/BulkDeleteConfirmationDialog';
import { ThemeWithPosts, PendingTheme } from '@/types/stories';
import type { SocialMediaPost } from '@/types/socialMedia';
import { Helmet } from 'react-helmet-async';

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
  const [showHero, setShowHero] = useState(false);

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{
    completed: number;
    total: number;
    current?: string;
    errors?: string[];
  } | null>(null);

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

  // First-visit hero visibility
  useEffect(() => {
    try {
      const seen = localStorage.getItem('stories_hero_seen');
      setShowHero(!seen);
    } catch {
      setShowHero(true);
    }
  }, []);

  // Auto-hide hero when content exists
  useEffect(() => {
    if (availableThemes.length > 0) {
      try { localStorage.setItem('stories_hero_seen', '1'); } catch {}
      setShowHero(false);
    }
  }, [availableThemes.length]);

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

  // Bulk selection handlers
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedThemes(new Set());
  };

  const handleThemeSelect = (themeId: string) => {
    const newSelected = new Set(selectedThemes);
    if (newSelected.has(themeId)) {
      newSelected.delete(themeId);
    } else {
      newSelected.add(themeId);
    }
    setSelectedThemes(newSelected);
  };

  const handleSelectAll = () => {
    const allThemeIds = availableThemes
      .filter(theme => !theme.id.startsWith('pending-'))
      .map(theme => theme.id);
    setSelectedThemes(new Set(allThemeIds));
  };

  const handleDeselectAll = () => {
    setSelectedThemes(new Set());
  };

  const handleClearSelection = () => {
    setSelectedThemes(new Set());
    setIsSelectionMode(false);
  };

  const getSelectedThemes = () => {
    return availableThemes.filter(theme => selectedThemes.has(theme.id));
  };

  const handleBulkDelete = async () => {
    const themesToDelete = getSelectedThemes();
    setIsDeletingBulk(true);
    setDeleteProgress({
      completed: 0,
      total: themesToDelete.length,
      errors: []
    });

    try {
      // Process in batches of 5 for safety
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < themesToDelete.length; i += batchSize) {
        batches.push(themesToDelete.slice(i, i + batchSize));
      }

      let completed = 0;
      const errors: string[] = [];

      for (const batch of batches) {
        const themeIds = batch.map(t => t.id);
        const categories = batch.map(t => t.category);

        setDeleteProgress(prev => prev ? {
          ...prev,
          current: batch.map(t => t.theme_name).join(', ')
        } : null);

        try {
          const { data, error } = await supabase.functions.invoke('bulk-delete-themes', {
            body: { themeIds, categories }
          });

          if (error) throw error;

          if (data?.results) {
            const failedInBatch = data.results.filter((r: any) => !r.success);
            if (failedInBatch.length > 0) {
              failedInBatch.forEach((failed: any) => {
                errors.push(`${failed.category}: ${failed.error}`);
              });
            }
          }

          completed += batch.length;
          setDeleteProgress(prev => prev ? {
            ...prev,
            completed,
            errors
          } : null);

        } catch (error) {
          console.error('Batch delete error:', error);
          batch.forEach(theme => {
            errors.push(`${theme.theme_name}: ${error.message}`);
          });
          completed += batch.length;
          setDeleteProgress(prev => prev ? {
            ...prev,
            completed,
            errors
          } : null);
        }

        // Small delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh themes list
      const refreshedThemes = await optimizedSocialMediaService.getAvailableThemes();
      setAvailableThemes(refreshedThemes);
      
      setSelectedThemes(new Set());
      setIsSelectionMode(false);
      setShowDeleteDialog(false);

      const successCount = completed - errors.length;
      toast({
        title: "Bulk Delete Complete",
        description: `Successfully deleted ${successCount} themes${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
        variant: errors.length > 0 ? "destructive" : "default"
      });

    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Bulk Delete Failed",
        description: error.message || "Failed to delete themes",
        variant: "destructive"
      });
    } finally {
      setIsDeletingBulk(false);
      setDeleteProgress(null);
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

  // Show first-visit hero when no content exists
  if (showHero && availableThemes.length === 0) {
    return (
      <PageLayout>
        <Helmet>
          <title>Story Ship — Every Thought is a Visual Journey</title>
          <meta name="description" content="Every Thought is a Visual Journey" />
          <link rel="canonical" href="/stories" />
        </Helmet>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center gap-8 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          
          {/* Content */}
          <div className="relative z-10 space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Story Ship
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-light">
                Every Thought is a Visual Journey
              </p>
            </div>
            
            <div className="w-full max-w-7xl mx-auto">
              <Input
                placeholder="Describe your theme..."
                className="w-full h-16 px-8 py-6 text-lg bg-background/80 backdrop-blur-sm border-2 border-border/50 rounded-3xl placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 hover:border-border"
                value={customThemeDescription}
                onChange={(e) => setCustomThemeDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customThemeDescription.trim()) {
                    try { localStorage.setItem('stories_hero_seen','1'); } catch {}
                    setShowHero(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Helmet>
        <title>Story Ship — Every Thought is a Visual Journey</title>
        <meta name="description" content="Every Thought is a Visual Journey" />
        <link rel="canonical" href="/stories" />
      </Helmet>
      <div className="container mx-auto py-8 px-4">
        {/* Hero Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border mb-8 min-h-[200px] max-h-[40vh] flex">
          <div className="absolute inset-0 bg-grid-small-black/[0.02] bg-grid-pattern" />
          <Textarea
            id="theme-description"
            placeholder="Describe your theme... (e.g., 'AI applications in healthcare for medical professionals')"
            value={customThemeDescription}
            onChange={(e) => setCustomThemeDescription(e.target.value)}
            className="max-w-[700px] w-full flex-1 resize-none border-0 rounded-2xl bg-transparent p-6 focus-visible:ring-0 z-10 relative"
            disabled={isGeneratingTheme || isProcessing}
          />
        </div>

        {/* Action Buttons Section */}
        <div className="container mx-auto px-4 mb-8">
          <div className="flex justify-center gap-4 max-w-2xl mx-auto">
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

            <Button
              onClick={handleToggleSelectionMode}
              variant={isSelectionMode ? "default" : "outline"}
              className="flex-1"
              disabled={availableThemes.length === 0}
            >
              <Users className="mr-2 h-4 w-4" />
              {isSelectionMode ? 'Exit Selection' : 'Bulk Actions'}
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

        {/* Bulk Actions Toolbar */}
        <BulkActionsToolbar
          selectedCount={selectedThemes.size}
          totalCount={availableThemes.filter(t => !t.id.startsWith('pending-')).length}
          onDeleteSelected={() => setShowDeleteDialog(true)}
          onClearSelection={handleClearSelection}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          allSelected={selectedThemes.size === availableThemes.filter(t => !t.id.startsWith('pending-')).length && selectedThemes.size > 0}
          isDeleting={isDeletingBulk}
        />

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
            selectedThemes={selectedThemes}
            onThemeSelect={handleThemeSelect}
            isSelectionMode={isSelectionMode}
          />
        )}

        {/* Bulk Delete Confirmation Dialog */}
        <BulkDeleteConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          selectedThemes={getSelectedThemes()}
          onConfirm={handleBulkDelete}
          isDeleting={isDeletingBulk}
          progress={deleteProgress}
        />
      </div>
    </PageLayout>
  );
}