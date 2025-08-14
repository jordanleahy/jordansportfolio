import React, { useState, Suspense } from 'react';
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
const PostsTableControls = React.lazy(() => import('@/components/stories/PostsTableControls').then(module => ({ default: module.PostsTableControls })));
const ColorThemeConsistencyChecker = React.lazy(() => import('@/components/stories/ColorThemeConsistencyChecker').then(module => ({ default: module.ColorThemeConsistencyChecker })));
import { ProcessingStatesProvider } from '@/contexts/ProcessingStatesContext';
import { LibraryCollectionsFallback } from '@/components/library/LibraryCollectionsFallback';

export default function ThemeDetail() {
  const { themeId } = useParams<{ themeId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isAdmin } = useUserRole();
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<"draft" | "published">("draft");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  
  // Fetch theme and posts for this specific theme ID
  const { theme: themeData, posts = [], isLoading: isLoadingPosts, refetch } = useThemeDetailsById(themeId || '', !!themeId);
  
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

  if (!themeId || !themeData) {
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
          <p className="text-sm text-muted-foreground mb-6">
            Theme: {decodedTheme}
          </p>

          {/* Draft/Published Tabs and Action Buttons - Moved outside of PostsTable */}
          {themeData?.id && posts.length > 0 && (
            <ProcessingStatesProvider>
              <Suspense fallback={<div>Loading controls...</div>}>
                <PostsTableControls
                  posts={posts as any}
                  category={decodedTheme}
                  isAdmin={isAdmin}
                  onPostsChange={handlePostsChange}
                  activeTab={activeTab}
                  onActiveTabChange={setActiveTab}
                />
              </Suspense>
            </ProcessingStatesProvider>
          )}
        </div>

        {/* Content */}
        <div className="space-y-8">
          <Suspense fallback={<CalendarSkeletonLoader />}>
            {/* Color Theme Consistency Checker */}
            <ColorThemeConsistencyChecker category={decodedTheme} />
            
            <ProcessingStatesProvider>
              {themeData?.id && posts.length > 0 ? (
                <PostsTable 
                  themeId={themeData.id}
                  posts={posts as any}
                  onPostsChange={handlePostsChange}
                  isAdmin={isAdmin}
                  category={decodedTheme}
                  selectedThemeId={selectedThemeId}
                  onThemeChange={setSelectedThemeId}
                  activeTab={activeTab}
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