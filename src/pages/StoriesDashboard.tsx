import React, { useState, useEffect, Suspense } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TypewriterInput } from '@/components/ui/typewriter-input';
import { Loader2, Sparkles, Users, MessageSquareText, Send } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Section } from '@/components/layout/Section';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';

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
import { CollectionCard } from '@/components/library/CollectionCard';
import { useThemeShimmer } from '@/hooks/useThemeShimmer';
import { useFeaturedCollections } from '@/hooks/useFeaturedCollections';
import { PublicCollectionsSection } from '@/components/PublicCollectionsSection';
import { SimplifiedBatchSkeleton } from '@/components/stories/SimplifiedBatchSkeleton';
import { generateSEOMetadata } from '@/utils/seoHelpers';
import { SHIMMER_CONSTANTS } from '@/constants/shimmerConstants';
import shipImage from '@/assets/story-ship-bg.png';

// Lazy load components
const ThemeImportModal = React.lazy(() => import('@/components/stories/ThemeImportModalOptimized'));
export default function StoriesDashboard() {
  console.log('[StoriesDashboard] Component rendering');
  
  const {
    user,
    loading,
    isAdmin,
    roleLoading
  } = useAuth();
  
  console.log('[StoriesDashboard] Auth state:', { 
    user: !!user, 
    loading, 
    isAdmin, 
    roleLoading 
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [customThemeDescription, setCustomThemeDescription] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<PendingTheme | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Centralized function to clear pending theme state
  const clearPendingThemeState = () => {
    setPendingTheme(null);
    setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
  };

  // Simplified state management
  const [availableThemes, setAvailableThemes] = useState<ThemeWithPosts[]>([]);

  // Restore pending theme state on page load/refresh
  useEffect(() => {
    if (!user || availableThemes.length === 0) return;

    // Look for themes in generating status (check lifecycle_status instead of prompt_generation_status)
    const generatingTheme = availableThemes.find(theme => 
      theme.lifecycle_status === 'generating' || theme.lifecycle_status === 'pending'
    );

    if (generatingTheme && !pendingTheme) {
      console.log('🔄 Found generating theme on refresh, restoring shimmer:', generatingTheme.theme_name);
      setPendingTheme({
        theme_id: generatingTheme.id,
        theme_name: generatingTheme.theme_name,
        description: generatingTheme.description
      });
      setIsGeneratingTheme(true);
    } else if (pendingTheme && !generatingTheme) {
      console.log('🧹 No generating themes found, clearing pending state');
      clearPendingThemeState();
      setIsGeneratingTheme(false);
    }
  }, [availableThemes, user, pendingTheme]);
  const {
    toast
  } = useToast();

  const [showHero, setShowHero] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    category: string;
    theme: string;
  } | null>(null);

  // Precompute SEO for /stories
  const storiesSEO = generateSEOMetadata({
    title: 'Story Ship — Every Thought is a Visual Journey',
    description: 'Every Thought is a Visual Journey',
    image: shipImage,
    url: '/stories',
    type: 'website'
  });

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

  // Featured collections (public view)
  const { data: featuredCollections = [], isLoading: isLoadingFeatured, error: featuredError } = useFeaturedCollections();

  // Simplified theme shimmer management
  const { 
    dismissShimmer, 
    handleThemeClick, 
    shouldShowShimmer,
    completionProgress
  } = useThemeShimmer({
    pendingTheme,
    setPendingTheme,
    setAvailableThemes,
    availableThemes
  });


  // Enhanced initial load with loading states and error handling
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);
  const [themesError, setThemesError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  React.useEffect(() => {
    console.log('[StoriesDashboard] Load themes effect triggered', { 
      userId: user?.id, 
      loading, 
      hasInitialized 
    });
    
    const loadThemes = async () => {
      if (user?.id && !hasInitialized) {
        try {
          setIsLoadingThemes(true);
          setThemesError(null);
          const themes = await optimizedSocialMediaService.getAvailableThemes();
          setAvailableThemes(themes);
          setHasInitialized(true);

          // Check if any themes are currently being generated
          const hasGeneratingThemes = themes.some(theme => 
            theme.lifecycle_status === 'generating' || theme.lifecycle_status === 'pending'
          );
          
          if (hasGeneratingThemes) {
            setIsGeneratingTheme(true);
          }

          // Clear textarea on page load to prevent accidental re-submission on refresh
          setCustomThemeDescription('');
        } catch (error) {
          console.error('[StoriesDashboard] Failed to fetch themes:', error);
          setThemesError(error.message || 'Failed to load themes');
          setAvailableThemes([]);
        } finally {
          setIsLoadingThemes(false);
        }
      } else if (!user && !loading) {
        // User is not authenticated, but auth is done loading
        setIsLoadingThemes(false);
        setHasInitialized(true);
      }
    };
    
    loadThemes();
  }, [user?.id, loading, hasInitialized]);

  // First-visit hero visibility - always show for unauthenticated users
  useEffect(() => {
    console.log('[StoriesDashboard] Hero visibility effect', { user: !!user });
    if (!user) {
      setShowHero(true);
      return;
    }
    try {
      const seen = localStorage.getItem('stories_hero_seen');
      setShowHero(!seen);
    } catch {
      setShowHero(true);
    }
  }, [user]);

  // Auto-hide hero when content exists (only for authenticated users)
  useEffect(() => {
    if (user && availableThemes.length > 0) {
      try {
        localStorage.setItem('stories_hero_seen', '1');
      } catch {}
      setShowHero(false);
    }
  }, [user, availableThemes.length]);


  // Simplified realtime handlers
  const handlePostInsert = (newPost: SocialMediaPost) => {
    toast({
      title: "New Post Created!",
      description: `"${newPost.title}" added to ${newPost.category}`
    });
  };
  const handlePostUpdate = async (post: SocialMediaPost) => {
    // Refresh themes when posts are updated to keep grid in sync
    console.log('Post updated:', post);
    try {
      const themes = await optimizedSocialMediaService.refreshAvailableThemes();
      
      // Preserve pending themes by merging them with fresh data
      setAvailableThemes(prevThemes => {
        const pendingThemes = prevThemes.filter(theme => theme.id.startsWith('pending-'));
        const freshThemes = themes.filter(theme => !theme.id.startsWith('pending-'));
        return [...pendingThemes, ...freshThemes];
      });
    } catch (error) {
      console.error('Failed to refresh themes after post update:', error);
    }
  };

  // Realtime setup
  const {
    isConnected,
    connectionStatus
  } = useUnifiedRealtime({
    enabled: !!user,
    userId: user?.id,
    onPostInsert: handlePostInsert,
    onPostUpdate: handlePostUpdate,
    onThemeStatusUpdate: (theme) => {
      console.log('📡 Dashboard received theme status update:', theme.id, theme.prompt_generation_status);
      // Theme cache is already updated in the realtime hook for instant transitions
      if (theme.prompt_generation_status === 'completed') {
        // Update local state for shimmer handling
        setAvailableThemes(prev => prev.map(t => 
          t.id === theme.id ? { ...t, ...theme } : t
        ));
      }
    }
  });
  const handleDeleteCategory = async (category: string) => {
    try {
      // First get the theme ID from category name
      const { data: theme, error: themeError } = await supabase
        .from('themes')
        .select('id')
        .eq('theme_name', category)
        .eq('user_id', user?.id)
        .single();
      
      if (themeError || !theme) {
        throw new Error(`Theme "${category}" not found`);
      }
      
      // Delete posts by theme_id
      const { error: postsError } = await supabase
        .from('social_media_posts')
        .delete()
        .eq('theme_id', theme.id)
        .eq('user_id', user?.id);
      
      if (postsError) throw postsError;
      
      // Delete the theme itself
      const { error: themeDeleteError } = await supabase
        .from('themes')
        .delete()
        .eq('id', theme.id)
        .eq('user_id', user?.id);
      
      if (themeDeleteError) throw themeDeleteError;
      
      // Delete cached prompts related to this theme
      const { error: cacheError } = await supabase
        .from('cached_prompts')
        .delete()
        .eq('user_id', user?.id)
        .like('cache_key', `%${theme.id}%`);
      
      if (cacheError) console.warn('Failed to delete cached prompts:', cacheError);
      
      toast({
        title: "Theme Deleted",
        description: `Successfully deleted "${category}" and all its posts`
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
      toast({
        title: 'Refreshed',
        description: 'Themes reloaded from server.'
      });
    } catch (e: any) {
      toast({
        title: 'Refresh failed',
        description: e.message || 'Could not refresh themes',
        variant: 'destructive'
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
    const allThemeIds = availableThemes.filter(theme => !theme.id.startsWith('pending-')).map(theme => theme.id);
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
          const {
            data,
            error
          } = await supabase.functions.invoke('bulk-delete-themes', {
            body: {
              themeIds,
              categories
            }
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
    console.log('🎯 handleGenerateCustomTheme called');
    
    if (!customThemeDescription.trim()) {
      console.log('❌ No theme description provided');
      toast({
        title: "Description Required",
        description: "Please describe the theme you want to create",
        variant: "destructive"
      });
      return;
    }
    const themeDescription = customThemeDescription.trim();
    console.log('📝 Theme description:', themeDescription);
    
    if (!user) {
      console.log('❌ No user found');
      toast({
        title: "Sign in required",
        description: "Please sign in to generate themes."
      });
      navigate('/auth');
      return;
    }
    
    console.log('✅ User found:', user.id);
    setCustomThemeDescription(''); // Clear input immediately
    setIsGeneratingTheme(true);
    console.log('🚀 Starting theme generation...');

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
    
    // Set pending theme BEFORE adding to UI
    setPendingTheme({
      theme_name: shimmerTheme.theme_name,
      description: themeDescription
    });

    // Add shimmer theme to the beginning of the list
    setAvailableThemes(prev => [shimmerTheme, ...prev]);
    console.log('✨ Added pending theme to UI');
    console.log('🎯 Pending theme state:', {
      theme_name: shimmerTheme.theme_name,
      description: themeDescription
    });
    
    try {
      console.log('📡 Calling theme lifecycle orchestrator...');
      const {
        data,
        error
      } = await supabase.functions.invoke('manage-theme-lifecycle', {
        body: {
          action: 'create',
          description: themeDescription
        }
      });
      
      console.log('📡 Edge function response:', { data, error });
      // Remove duplicate handling - always proceed with generation
      if (error) {
        console.log('❌ Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }
      if (!data?.success) {
        console.log('❌ Edge function returned failure:', data);
        throw new Error(data?.error || 'Failed to generate theme');
      }
      
      console.log('✅ Theme saved to database:', data);
      
      // Update pending theme with the actual theme_id from the response
      if (data?.theme_id) {
        console.log('🔗 Updating pending theme with theme_id:', data.theme_id);
        console.log('🎯 Theme generation successful, theme_id:', data.theme_id);
        setPendingTheme(prev => prev ? { ...prev, theme_id: data.theme_id } : null);
        
        // Remove shimmer theme from available themes since real theme will be fetched
        setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith(SHIMMER_CONSTANTS.PREFIXES.PENDING_THEME)));
        
        // Refresh themes to get the new theme
        const refreshedThemes = await optimizedSocialMediaService.getAvailableThemes();
        setAvailableThemes(refreshedThemes);
      }
      
      // Success notification will be shown when ALL image prompts are completed via useSimpleThemeCompletion
      // Theme completion and auto-navigation is now handled by useThemeLifecycleShimmer
      console.log('✅ Theme creation started, shimmer will auto-dismiss when completed');
    } catch (error: any) {
      console.error('Theme generation error:', error);
      
      // Simple error handling - just clear pending state
      clearPendingThemeState();
      
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
      const {
        data,
        error
      } = await supabase.functions.invoke('cancel-theme-generation');
      if (error) {
        throw new Error(error.message);
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to cancel theme generation');
      }

      // Remove pending theme and reset states
      clearPendingThemeState();
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
      toast({
        title: 'Missing description',
        description: 'Please try again.',
        variant: 'destructive'
      });
      return;
    }
    setDuplicateInfo(null);
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to generate themes.'
      });
      navigate('/auth');
      return;
    }
    setIsGeneratingTheme(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('user-idea-streaming-image-pipeline', {
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
      toast({
        title: 'Theme Created!',
        description: `Generated "${data.theme}" with ${data.postCount} posts under "${data.category}"`
      });

      // Replace pending theme with real data for duplicate case
      clearPendingThemeState();
      
      const refreshedThemes = await optimizedSocialMediaService.getAvailableThemes();
      
      setAvailableThemes(prevThemes => {
        // Find and replace the pending theme
        const pendingIndex = prevThemes.findIndex(theme => 
          theme.id.startsWith('pending-')
        );
        
        if (pendingIndex !== -1) {
          const newTheme = refreshedThemes.find(theme => 
            theme.theme_name === data.theme || theme.category === data.category
          );
          
          if (newTheme) {
            const newThemes = [...prevThemes];
            newThemes[pendingIndex] = newTheme;
            
            // Filter out duplicates and add any missing themes
            const existingIds = new Set(newThemes.map(t => t.id));
            const additionalThemes = refreshedThemes.filter(rt => !existingIds.has(rt.id));
            
            return [...newThemes.filter(t => !t.id.startsWith('pending-')), ...additionalThemes];
          }
        }
        
        return refreshedThemes;
      });
    } catch (err: any) {
      console.error('Duplicate confirm error:', err);
      toast({
        title: 'Creation failed',
        description: err.message || 'Could not create theme',
        variant: 'destructive'
      });
      // Transform to error state for duplicate case failure
      clearPendingThemeState();
      setAvailableThemes(prev => prev.map(theme => {
        if (theme.id.startsWith('pending-')) {
          return {
            ...theme,
            id: 'error-' + Date.now(),
            theme_name: 'Generation Failed',
            first_post: {
              ...theme.first_post!,
              title: 'Error: Generation failed',
              description: `Failed to create duplicate theme: ${err.message?.slice(0, 100) || 'Unknown error'}`
            }
          };
        }
        return theme;
      }));
      
      // Auto-clear error state after 5 seconds
      setTimeout(() => {
        setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('error-')));
      }, 5000);
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  // Early return with loading screen if still initializing
  if (loading || (user && !hasInitialized)) {
    console.log('[StoriesDashboard] Showing loading state', { loading, hasInitialized });
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading Story Ship...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Error boundary for unhandled errors
  if (themesError && user) {
    console.log('[StoriesDashboard] Showing error state', themesError);
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-500 text-xl">⚠️</div>
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground">{themesError}</p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  console.log('[StoriesDashboard] Rendering main component', {
    showHero,
    userAuthenticated: !!user,
    themesCount: availableThemes.length
  });

  // Use React Query loading pattern instead of local loading state
  if (loading) {
    return <PageLayout>
        <CalendarSkeletonLoader />
      </PageLayout>;
  }

  // Public view allowed when not authenticated
  // Feature flag controlled below for first-visit hero

  // Show first-visit hero when no content exists (feature-flagged)
  if (UI_FLAGS.enableStoriesFirstVisitHero && showHero && availableThemes.length === 0) {
    return <PageLayout>
        <Helmet>
          <title>{storiesSEO.title}</title>
          <meta name="description" content={storiesSEO.description} />
          <meta property="og:title" content={storiesSEO.ogTitle} />
          <meta property="og:description" content={storiesSEO.ogDescription} />
          <meta property="og:image" content={storiesSEO.image} />
          <meta property="og:url" content={storiesSEO.url} />
          <meta property="og:type" content={storiesSEO.type} />
          <meta property="og:site_name" content={storiesSEO.siteName} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={storiesSEO.ogTitle} />
          <meta name="twitter:description" content={storiesSEO.ogDescription} />
          <meta name="twitter:image" content={storiesSEO.image} />
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
              <TypewriterInput 
                typewriterTexts={[
                  "patient education for diabetes",
                  "patient education for sepsis", 
                  "patient education for UTI",
                  "patient education for resp failure",
                  "patient education for heart attack"
                ]}
                fallbackPlaceholder="Describe your theme..." 
                className="w-full h-16 px-8 py-6 text-lg bg-background/80 backdrop-blur-sm border-2 border-border/50 rounded-3xl placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 hover:border-border" 
                value={customThemeDescription} 
                onChange={e => setCustomThemeDescription(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === 'Enter' && customThemeDescription.trim()) {
                    try {
                      localStorage.setItem('stories_hero_seen', '1');
                    } catch {}
                    setShowHero(false);
                  }
                }} 
                typingSpeed={60}
                deletingSpeed={30}
                pauseDuration={1500}
              />
            </div>
          </div>
        </div>
      </PageLayout>;
  }
  return <PageLayout>
      <Helmet>
        <title>{storiesSEO.title}</title>
        <meta name="description" content={storiesSEO.description} />
        <meta property="og:title" content={storiesSEO.ogTitle} />
        <meta property="og:description" content={storiesSEO.ogDescription} />
        <meta property="og:image" content={storiesSEO.image} />
        <meta property="og:url" content={storiesSEO.url} />
        <meta property="og:type" content={storiesSEO.type} />
        <meta property="og:site_name" content={storiesSEO.siteName} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={storiesSEO.ogTitle} />
        <meta name="twitter:description" content={storiesSEO.ogDescription} />
        <meta name="twitter:image" content={storiesSEO.image} />
        <link rel="canonical" href="/stories" />
      </Helmet>
        <Section id="hero" fluid className="min-h-[calc(100vh-420px)] sm:min-h-[calc(100vh-380px)] md:min-h-[calc(100vh-360px)] py-0 px-0">
          <AuroraBackground className="h-[60vh] md:h-[70vh] relative" style={{
        backgroundImage: 'url(/lovable-uploads/c10eeac3-3271-45ea-88f4-a37d7f3fe1bd.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background/80 z-[1]" />
            <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-8 py-12 text-center w-[95vw] md:w-[700px] mx-auto bg-background/20 backdrop-blur-md border border-white/20 shadow-2xl rounded-full">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">Story Ship</h1>
              <p className="text-base md:text-xl text-foreground font-semibold">Every Thought is a Visual Journey</p>
              <div className="w-full text-center">
                <TypewriterInput 
                  aria-label="Describe your theme" 
                  typewriterTexts={[
                    "patient education for diabetes",
                    "patient education for sepsis", 
                    "patient education for UTI",
                    "patient education for resp failure",
                    "patient education for heart attack"
                  ]}
                  fallbackPlaceholder="Describe your theme... (e.g., 'AI applications in healthcare for medical professionals')"
                  className="w-full h-16 px-8 py-6 text-lg bg-background/80 backdrop-blur-sm border-2 border-border/50 rounded-3xl placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 hover:border-border" 
                  value={customThemeDescription} 
                  onChange={e => setCustomThemeDescription(e.target.value)} 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customThemeDescription.trim() && !isGeneratingTheme) {
                      console.log('⌨️ Enter key pressed - triggering theme generation');
                      e.preventDefault();
                      handleGenerateCustomTheme();
                    }
                  }}
                  disabled={isGeneratingTheme} 
                  typingSpeed={80}
                  deletingSpeed={40}
                  pauseDuration={2000}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground px-8">
                  <span className="w-full">Agentic Experience Created by Jordan Leahy</span>
                </div>
              </div>
              {isAdmin && <div className="mt-2 space-y-2">
                  {/* Submit button - only show when text is entered */}
                  {customThemeDescription.trim() && (
                    <Button 
                      onClick={handleGenerateCustomTheme}
                      disabled={isGeneratingTheme}
                      className="w-full"
                    >
                      {isGeneratingTheme ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit
                        </>
                      )}
                    </Button>
                  )}
                  
                  {roleLoading ? <Skeleton className="h-10 w-48" /> : <Button onClick={() => setImportModalOpen(true)} variant="outline">
                      Import Themes
                    </Button>}
                </div>}
            </div>
          </AuroraBackground>

          {/* Add extra white space between hero and content */}
          <div className="py-16" />

          {isAdmin && <Suspense fallback={<div>Loading...</div>}>
              <ThemeImportModal 
                open={importModalOpen} 
                onOpenChange={setImportModalOpen} 
                onImportComplete={() => {
                  // Theme import completed - refresh themes
                  optimizedSocialMediaService.getAvailableThemes().then(refreshedThemes => {
                    setAvailableThemes(refreshedThemes);
                  });
                }}
                onOptimisticStart={(categoryName) => {
                  // Add shimmer theme immediately for optimistic UI
                  const shimmerTheme: ThemeWithPosts = {
                    id: 'pending-import-' + Date.now(),
                    theme_name: categoryName,
                    description: `Imported theme: ${categoryName}`,
                    category: categoryName,
                    post_count: 0,
                    prompt_completion_count: 0,
                    total_posts_count: 10, // Assume some posts for shimmer
                    first_post: {
                      id: 'pending',
                      title: 'Generating theme...',
                      description: `Processing ${categoryName} content`
                    }
                  };
                  setAvailableThemes(prev => [shimmerTheme, ...prev]);
                }}
                onOptimisticComplete={(success, categoryName) => {
                  if (success) {
                    console.log('✅ Theme import successful:', categoryName);
                  } else {
                    // Remove shimmer theme on failure
                    setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-import-')));
                  }
                }}
              />
            </Suspense>}
        </Section>

        {/* Second Section: Authenticated users see their themes; guests see Featured Posts */}
        {user ? <Section id="cards" className="-mt-8 md:-mt-12 lg:-mt-16 mb-12" fluid>
            <header className="mb-6 flex items-center justify-end gap-4">
              <Button variant="outline" onClick={handleRefreshThemes} aria-label="Refresh themes">
                Refresh
              </Button>
            </header>

            {/* Bulk Actions Toolbar */}
            <BulkActionsToolbar selectedCount={selectedThemes.size} totalCount={availableThemes.filter(t => !t.id.startsWith('pending-')).length} onDeleteSelected={() => setShowDeleteDialog(true)} onClearSelection={handleClearSelection} onSelectAll={handleSelectAll} onDeselectAll={handleDeselectAll} allSelected={selectedThemes.size === availableThemes.filter(t => !t.id.startsWith('pending-')).length && selectedThemes.size > 0} isDeleting={isDeletingBulk} />

            {/* Simplified Batch Shimmer */}
            <SimplifiedBatchSkeleton 
              isVisible={shouldShowShimmer}
              completionProgress={completionProgress}
              className="mb-6"
            />

            {/* Enhanced Themes Grid with Loading States */}
            {isLoadingThemes ? <ThemesSkeleton /> : themesError ? <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  ⚠️ Failed to load themes: {themesError}
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div> : <CategoriesGrid 
                themes={availableThemes} 
                onDeleteCategory={handleDeleteCategory} 
                selectedThemes={selectedThemes} 
                onThemeSelect={handleThemeSelect} 
                isSelectionMode={isSelectionMode} 
                isGeneratingTheme={isGeneratingTheme} 
                onCancelGeneration={cancelThemeGeneration}
                getTransitionClasses={() => ''}
                isThemeTransitioning={() => false}
              />}
          </Section> : <>
            <Section id="featured" className="-mt-8 md:-mt-12 lg:-mt-16 mb-12" fluid>
              <header className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Featured</h2>
              </header>
              {isLoadingFeatured ? <ThemesSkeleton /> : featuredError ? <div className="text-center py-8">
                  <div className="text-muted-foreground mb-4">⚠️ Failed to load featured collections: {featuredError.message}</div>
                  <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
                </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredCollections.length === 0 ? <div className="text-center py-12 text-muted-foreground col-span-full">No featured collections yet.</div> : featuredCollections.map((collection) => <CollectionCard key={collection.id} collection={collection} />)}
                </div>}
            </Section>
            
            {/* Sign-up CTA for unauthenticated users */}
            <Section id="signup-cta" className="mb-12" fluid>
              <div className="max-w-4xl mx-auto text-center space-y-6 p-8 bg-card rounded-lg border">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">Ready to Create Your Own Stories?</h2>
                  <p className="text-lg text-muted-foreground">
                    Join thousands of content creators using AI to generate compelling marketing stories and visuals.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="lg" asChild>
                    <a href="/auth">
                      <Users className="w-5 h-5 mr-2" />
                      Sign Up Free
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <a href="/about">
                      Learn More
                    </a>
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  No credit card required • Free plan available
                </div>
              </div>
            </Section>
          </>}

        {/* Public Collections Section */}
        <PublicCollectionsSection />

        {/* Bulk Delete Confirmation Dialog */}
        <BulkDeleteConfirmationDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} selectedThemes={getSelectedThemes()} onConfirm={handleBulkDelete} isDeleting={isDeletingBulk} progress={deleteProgress} />

        {/* Duplicate Theme Modal */}
        <DuplicateThemeModal open={!!duplicateInfo} category={duplicateInfo?.category || ''} theme={duplicateInfo?.theme || ''} onCancel={() => {
      setDuplicateInfo(null);
      // Remove the pending shimmer theme if user cancels
      clearPendingThemeState();
    }} onConfirm={handleConfirmDuplicate} />
      </PageLayout>;
}