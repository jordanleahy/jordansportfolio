
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Palette, Eye, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useThemeDetailsById } from '@/hooks/useOptimizedStories';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TrashIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SocialMediaPost } from '@/types/socialMedia';

const ThemeDetail = () => {
  const { themeId } = useParams<{ themeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeView, setActiveView] = useState<'table' | 'cards'>('table');

  const { 
    theme, 
    posts, 
    hasAnyPosts,
    isLoading, 
    refetch 
  } = useThemeDetailsById(themeId || '', !!themeId);

  useEffect(() => {
    if (!themeId) {
      navigate('/stories');
      return;
    }
  }, [themeId, navigate]);

  const handleDeleteTheme = async () => {
    if (!theme?.id) return;
    
    setIsDeleting(true);
    try {
      // First delete all posts in this theme
      const { error: postsError } = await supabase
        .from('social_media_posts')
        .delete()
        .eq('theme_id', theme.id);

      if (postsError) {
        throw postsError;
      }

      // Then delete the theme
      const { error: themeError } = await supabase
        .from('themes')
        .delete()
        .eq('id', theme.id);

      if (themeError) {
        throw themeError;
      }

      toast({
        title: "Theme deleted",
        description: "Theme and all its posts have been deleted successfully.",
      });
      
      navigate('/stories');
    } catch (error) {
      console.error('Error deleting theme:', error);
      toast({
        title: "Error",
        description: "Failed to delete theme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePostsChange = (updatedPosts: SocialMediaPost[]) => {
    // Posts will be automatically refetched by React Query
    refetch();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Theme not found</h1>
          <Button onClick={() => navigate('/stories')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Stories
          </Button>
        </div>
      </div>
    );
  }

  const totalPosts = posts.length;
  const postsWithImages = posts.filter(post => 
    post.image_1_1_url || post.image_16_9_url || post.image_9_16_url || post.image_3_4_url || post.image_4_3_url
  ).length;

  const completionPercentage = totalPosts > 0 ? Math.round((postsWithImages / totalPosts) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/stories')}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{theme.theme_name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created {formatDistanceToNow(new Date(theme.created_at), { addSuffix: true })}
              </div>
              <Badge variant="secondary" className="capitalize">
                {theme.category.replace(/[-_]/g, ' ')}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TrashIcon className="w-4 h-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Theme</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this theme? This will permanently delete the theme and all its posts. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTheme} className="bg-red-600 hover:bg-red-700">
                  Delete Theme
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Theme Description */}
      {theme.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-700 leading-relaxed">{theme.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postsWithImages}</div>
            <p className="text-xs text-muted-foreground">
              out of {totalPosts} posts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionPercentage}%</div>
            <Progress value={completionPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Posts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Posts ({totalPosts})</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAnyPosts ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500 mb-4">Posts are being generated for this theme.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Day {post.day}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeDetail;
