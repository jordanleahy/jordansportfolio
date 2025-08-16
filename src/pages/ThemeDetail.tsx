import React, { useState, Suspense, useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useUserRole } from '@/hooks/useUserRole';
import { useThemeDetailsById } from '@/hooks/useOptimizedStories';
import { useIsMobile } from '@/hooks/use-mobile';
import { useThemeSEO } from '@/hooks/useThemeSEO';
import { useSimpleThemeCompletion } from '@/hooks/useSimpleThemeCompletion';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Lazy load components
const PostsTable = React.lazy(() => import('@/components/stories/PostsTable').then(module => ({ default: module.PostsTable })));
const ColorThemeConsistencyChecker = React.lazy(() => import('@/components/stories/ColorThemeConsistencyChecker').then(module => ({ default: module.ColorThemeConsistencyChecker })));
import { ProcessingStatesProvider } from '@/contexts/ProcessingStatesContext';
import { LibraryCollectionsFallback } from '@/components/library/LibraryCollectionsFallback';


export default function ThemeDetail() {
  const { themeId } = useParams<{ themeId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isAdmin } = useUserRole();
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Scroll to top when component mounts and mark theme as completed
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Mark theme as user-completed when they view the detail page
    if (!themeId) return;
    
    let isMounted = true; // Prevent race conditions with unmounting
    
    const markThemeCompleted = async () => {
      try {
        const { data } = await supabase.functions.invoke('manage-theme-lifecycle', {
          body: {
            action: 'complete',
            themeId: themeId
          }
        });
        
        if (isMounted) {
          console.log('Theme marked as completed:', data);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to mark theme as completed:', error);
        }
      }
    };
    
    markThemeCompleted();
    
    // Cleanup function to prevent race conditions
    return () => {
      isMounted = false;
    };
  }, [themeId]); // Added proper dependency array

  // Simple completion tracking - redirect incomplete themes to dashboard
  const { isCompleted } = useSimpleThemeCompletion(themeId);
  
  // Fetch theme and posts for this specific theme ID
  const { theme: themeData, posts = [], hasAnyPosts, isLoading: isLoadingPosts, refetch } = useThemeDetailsById(themeId || '', !!themeId);
  
  // Debug logging for navigation issues
  console.log('[ThemeDetail] Component state:', {
    themeId,
    isCompleted,
    hasThemeData: !!themeData,
    isLoadingPosts,
    postCount: posts.length
  });
  
  // Get theme name for display purposes
  const decodedTheme = themeData?.theme_name || '';
  
  // Generate SEO metadata for the theme
  const seoData = useThemeSEO(themeData);

  const handleDeleteTheme = async () => {
    if (!themeData?.id) {
      toast({
        title: "Error",
        description: "Theme ID not found. Cannot delete theme.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Deleting theme with ID:', themeData.id);
      await optimizedSocialMediaService.deleteTheme(themeData.id);
      toast({
        title: "Theme Deleted",
        description: `All posts in the "${decodedTheme}" theme have been deleted.`,
      });
      
      // Navigate back to dashboard after deletion
      navigate('/stories');
    } catch (error) {
      console.error('Error deleting theme:', error);
      toast({
        title: "Error",
        description: "Failed to delete theme. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePostsChange = () => {
    refetch();
  };

  if (loading || isLoadingPosts) {
    return (
      <PageLayout>
        <CalendarSkeletonLoader />
      </PageLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!themeId) {
    console.log('[ThemeDetail] No themeId, redirecting to dashboard');
    return <Navigate to="/stories" replace />;
  }

  // Only redirect themes that are still being generated (no posts yet)
  // Themes with posts should be viewable even if prompt generation isn't complete
  if (!hasAnyPosts && !isCompleted) {
    console.log('[ThemeDetail] Theme still generating with no posts, redirecting to dashboard:', { themeId, isCompleted, hasAnyPosts });
    return <Navigate to="/stories" replace />;
  }

  if (!themeData) {
    console.log('[ThemeDetail] No theme data found, redirecting to dashboard:', { themeId });
    return <Navigate to="/stories" replace />;
  }

  return (
    <PageLayout>
      <Helmet>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <meta property="og:title" content={seoData.ogTitle} />
        <meta property="og:description" content={seoData.ogDescription} />
        <meta property="og:image" content={seoData.image} />
        <meta property="og:url" content={seoData.url} />
        <meta property="og:type" content={seoData.type} />
        <meta property="og:site_name" content={seoData.siteName} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoData.ogTitle} />
        <meta name="twitter:description" content={seoData.ogDescription} />
        <meta name="twitter:image" content={seoData.image} />
        <link rel="canonical" href={seoData.url} />
      </Helmet>
      <div className="container mx-auto py-4 px-4">
        {/* Navigation Header */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/stories')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Theme</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the "{decodedTheme}" theme? This will permanently delete all {posts.length} posts in this theme. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTheme}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Theme
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Theme Title Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {themeData?.theme_name ?? decodedTheme}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mb-2">
            {themeData?.description || `Theme details for ${decodedTheme}`}
          </p>
          <p className="text-sm text-muted-foreground">
            Theme: {decodedTheme}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <Suspense fallback={<CalendarSkeletonLoader />}>
            {/* Color Theme Consistency Checker */}
            {themeData?.id && <ColorThemeConsistencyChecker themeId={themeData.id} />}
            
            <ProcessingStatesProvider>
              {themeData?.id && hasAnyPosts ? (
                <PostsTable 
                  themeId={themeData.id}
                  posts={posts as any}
                  onPostsChange={handlePostsChange}
                  isAdmin={isAdmin}
                  category={decodedTheme}
                  selectedThemeId={selectedThemeId}
                  onThemeChange={setSelectedThemeId}
                />
              ) : (
                <LibraryCollectionsFallback />
              )}
            </ProcessingStatesProvider>
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
}