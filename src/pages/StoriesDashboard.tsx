import React, { useState, useEffect, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Users, MessageSquareText, Send } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Section } from '@/components/layout/Section';
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
import { UI_FLAGS } from '@/config/uiFlags';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { DuplicateThemeModal } from '@/components/stories/DuplicateThemeModal';
import { BlogCard } from '@/components/ui/BlogCard';
import type { BlogPost } from '@/types/blog';

// Lazy load components
const ThemeImportModal = React.lazy(() => import('@/components/stories/ThemeImportModalOptimized').then(module => ({ default: module.ThemeImportModalOptimized })));

export default function StoriesDashboard() {
  const { user, loading, isAdmin, roleLoading } = useAuth();
  const queryClient = useQueryClient();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [customThemeDescription, setCustomThemeDescription] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<PendingTheme | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  // Simplified state management
  const [availableThemes, setAvailableThemes] = useState<ThemeWithPosts[]>([]);
  const [showHero, setShowHero] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ category: string; theme: string } | null>(null);

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

  // Featured posts (public view)
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(false);
  const [featuredError, setFeaturedError] = useState<string | null>(null);

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

  // Load featured posts for public view
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        setIsLoadingFeatured(true);
        setFeaturedError(null);
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .eq('featured', true)
          .order('published_at', { ascending: false })
          .limit(6);
        if (error) throw error;
        setFeaturedPosts((data || []) as any);
      } catch (e: any) {
        setFeaturedError(e.message || 'Failed to load featured posts');
        setFeaturedPosts([]);
      } finally {
        setIsLoadingFeatured(false);
      }
    };
    if (!user) loadFeatured();
  }, [user]);

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
    } catch (error: any) {
      console.error('Delete category error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  // Force refresh themes from server (bypass in-memory cache)
  const handleRefreshThemes = async () => {
    try {
      const themes = await optimizedSocialMediaService.refreshAvailableThemes();
      setAvailableThemes(themes);
      toast({ title: 'Refreshed', description: 'Themes reloaded from server.' });
    } catch (e: any) {
      toast({ title: 'Refresh failed', description: e.message || 'Could not refresh themes', variant: 'destructive' });
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

      const isDuplicate = (data && data.type === 'duplicate_theme') || (error && /duplicate|23505|409/i.test(error.message || ''));
      if (isDuplicate) {
        setDuplicateInfo({
          category: (data && data.category) || 'existing-category',
          theme: (data && data.theme) || shimmerTheme.theme_name
        });
        toast({ title: 'Category exists', description: 'Create this theme under a new category?', });
        setIsGeneratingTheme(false);
        return;
      }

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

  const cancelThemeGeneration = async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsCancelling(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('cancel-theme-generation');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to cancel theme generation');
      }
      
      // Remove pending theme and reset states
      setPendingTheme(null);
      setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
      setIsGeneratingTheme(false);
      
      return data;
    } catch (error) {
      console.error('Theme cancellation error:', error);
      throw error;
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmDuplicate = async (newCategory: string) => {
    if (!pendingTheme?.description) {
      setDuplicateInfo(null);
      toast({ title: 'Missing description', description: 'Please try again.' , variant: 'destructive'});
      return;
    }
    setDuplicateInfo(null);
    setIsGeneratingTheme(true);

    try {
      const { data, error } = await supabase.functions.invoke('user-idea-streaming-image-pipeline', {
        body: {
          description: pendingTheme.description,
          stream: false,
          overrideCategory: newCategory
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate theme');
      }

      toast({ title: 'Theme Created!', description: `Generated "${data.theme}" with ${data.postCount} posts under "${data.category}"` });

      // Clear pending shimmer and refresh
      setPendingTheme(null);
      setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
      const refreshedThemes = await optimizedSocialMediaService.getAvailableThemes();
      setAvailableThemes(refreshedThemes);
    } catch (err: any) {
      console.error('Duplicate confirm error:', err);
      toast({ title: 'Creation failed', description: err.message || 'Could not create theme', variant: 'destructive' });
      // Remove shimmer to avoid stale UI
      setPendingTheme(null);
      setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
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

// Public view allowed when not authenticated
  // Feature flag controlled below for first-visit hero


  // Show first-visit hero when no content exists (feature-flagged)
  if (UI_FLAGS.enableStoriesFirstVisitHero && showHero && availableThemes.length === 0) {
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
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground opacity-100">
                Story Ship
              </h1>
              <p className="text-xl md:text-2xl text-foreground font-light opacity-100">
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
        <Section id="hero" fluid className="min-h-[calc(100vh-420px)] sm:min-h-[calc(100vh-380px)] md:min-h-[calc(100vh-360px)] py-0 px-0">
          <AuroraBackground 
            className="h-[60vh] md:h-[70vh] relative"
            style={{
              backgroundImage: 'url(/lovable-uploads/89e97341-9490-449e-aeb6-0777bd6bee27.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background/80 z-[1]" />
            <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-4 text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">Story Ship</h1>
              <p className="text-base md:text-xl text-foreground">Every Thought is a Visual Journey</p>
              <div className="w-full max-w-3xl mx-auto">
                <Input
                  aria-label="Describe your theme"
                  placeholder="Describe your theme... (e.g., 'AI applications in healthcare for medical professionals')"
                  className="w-full h-16 px-8 py-6 text-lg bg-background/80 backdrop-blur-sm border-2 border-border/50 rounded-3xl placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 hover:border-border"
                  value={customThemeDescription}
                  onChange={(e) => setCustomThemeDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customThemeDescription.trim() && !isGeneratingTheme && !isProcessing) {
                      e.preventDefault();
                      handleGenerateCustomTheme();
                    }
                  }}
                  disabled={isGeneratingTheme || isProcessing}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground px-2">
                  <span>Press Enter to submit</span>
                </div>
              </div>
              {isAdmin && (
                <div className="mt-2">
                  {roleLoading ? (
                    <Skeleton className="h-10 w-48" />
                  ) : (
                    <Button onClick={() => setImportModalOpen(true)} variant="outline">
                      Import Themes
                    </Button>
                  )}
                </div>
              )}
            </div>
          </AuroraBackground>

          {/* Add extra white space between hero and content */}
          <div className="py-16" />

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
        </Section>

        {/* Second Section: Authenticated users see their themes; guests see Featured Posts */}
        {user ? (
          <Section id="cards" className="-mt-8 md:-mt-12 lg:-mt-16 mb-12" fluid>
            <header className="mb-6 flex items-center justify-end gap-4">
              <Button variant="outline" onClick={handleRefreshThemes} aria-label="Refresh themes">
                Refresh
              </Button>
            </header>

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
                isGeneratingTheme={isGeneratingTheme}
                onCancelGeneration={cancelThemeGeneration}
              />
            )}
          </Section>
        ) : (
          <Section id="featured" className="-mt-8 md:-mt-12 lg:-mt-16 mb-12" fluid>
            <header className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Featured Posts</h2>
            </header>
            {isLoadingFeatured ? (
              <ThemesSkeleton />
            ) : featuredError ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">⚠️ Failed to load featured posts: {featuredError}</div>
                <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPosts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground col-span-full">No featured posts yet.</div>
                ) : (
                  featuredPosts.map((post: any) => (
                    <BlogCard key={post.id} post={post} />
                  ))
                )}
              </div>
            )}
          </Section>
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

        {/* Duplicate Theme Modal */}
        <DuplicateThemeModal
          open={!!duplicateInfo}
          category={duplicateInfo?.category || ''}
          theme={duplicateInfo?.theme || ''}
          onCancel={() => {
            setDuplicateInfo(null);
            // Remove the pending shimmer theme if user cancels
            setPendingTheme(null);
            setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
          }}
          onConfirm={handleConfirmDuplicate}
        />
      </PageLayout>
    );
  }
