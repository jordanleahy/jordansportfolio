import React, { useState, Suspense } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useUserRole } from '@/hooks/useUserRole';
import { useThemePosts } from '@/hooks/useOptimizedStories';
import { useColorThemes } from '@/hooks/useColorThemes';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, Trash2, MoreVertical } from 'lucide-react';
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

export default function ThemeDetail() {
  const { theme } = useParams<{ theme: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isAdmin } = useUserRole();
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const decodedTheme = theme ? decodeURIComponent(theme) : '';
  
  // Fetch posts for this specific theme
  const { data: posts = [], isLoading: isLoadingPosts, refetch } = useThemePosts(decodedTheme, !!decodedTheme);
  
  // Color themes
  const { data: colorThemes = [] } = useColorThemes();

  const handleDeleteTheme = async (themeToDelete: string) => {
    try {
      console.log('Deleting theme:', themeToDelete);
      await optimizedSocialMediaService.deleteTheme(themeToDelete);
      toast({
        title: "Theme Deleted",
        description: `All posts in the "${themeToDelete}" theme have been deleted.`,
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

  if (!theme || !decodedTheme) {
    return <Navigate to="/stories" replace />;
  }

  return (
    <PageLayout>
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
                  onClick={() => handleDeleteTheme(decodedTheme)}
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
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            {decodedTheme}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Theme details for {theme}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <Suspense fallback={<CalendarSkeletonLoader />}>
            {/* Color Theme Consistency Checker */}
            <ColorThemeConsistencyChecker category={decodedTheme} />
            
            <PostsTable 
              posts={posts as any}
              onPostsChange={handlePostsChange}
              isAdmin={isAdmin}
              category={decodedTheme}
              selectedThemeId={selectedThemeId}
              onThemeChange={setSelectedThemeId}
            />
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
}