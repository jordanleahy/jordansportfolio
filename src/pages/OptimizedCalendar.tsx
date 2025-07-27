
import React, { useState, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserRole } from '@/hooks/useUserRole';
import { Trash2 } from 'lucide-react';
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
import type { SocialMediaPost } from '@/types/socialMedia';

// Lazy load components
const PostForm = React.lazy(() => import('@/components/calendar/PostForm').then(module => ({ default: module.PostForm })));
const PostsTable = React.lazy(() => import('@/components/calendar/PostsTable').then(module => ({ default: module.PostsTable })));
const ThemeImportModal = React.lazy(() => import('@/components/calendar/ThemeImportModalOptimized').then(module => ({ default: module.ThemeImportModalOptimized })));

type CategoryType = string;

export default function OptimizedCalendar() {
  const { user, loading } = useAuth();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CategoryType>('cdi');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const { toast } = useToast();

  // Use optimized queries with caching
  const { data: availableCategories = ['cdi', 'contracts'] } = useQuery({
    queryKey: ['available-categories'],
    queryFn: () => optimizedSocialMediaService.getAvailableCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => {
      // Ensure known categories appear first, followed by any dynamic categories
      const knownCategories = ['cdi', 'contracts', 'coding ai', 'ai agents'];
      const dynamicCategories = data.filter(c => !knownCategories.includes(c));
      return [...knownCategories.filter(c => data.includes(c)), ...dynamicCategories] as CategoryType[];
    },
    enabled: !!user,
  });

  const { data: postsByCategory = {} } = useQuery({
    queryKey: ['posts-by-category', availableCategories],
    queryFn: async () => {
      const postsData: Record<string, SocialMediaPost[]> = {};
      for (const category of availableCategories) {
        const posts = await optimizedSocialMediaService.getAllPosts(category as any);
        postsData[category] = posts;
      }
      return postsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user && availableCategories.length > 0,
  });

  const loadCategoryPosts = async (category: CategoryType) => {
    // Invalidate and refetch the posts for this category
    await queryClient.invalidateQueries({ queryKey: ['posts-by-category'] });
  };

  const handleImportComplete = async () => {
    toast({
      title: "Categories Updated",
      description: "Available categories have been refreshed after import.",
    });
  };

  const handleDeleteTheme = async (category: string) => {
    try {
      console.log('Deleting theme:', category); // Debug log
      await optimizedSocialMediaService.deleteTheme(category);
      toast({
        title: "Theme Deleted",
        description: `All posts in the "${category}" theme have been deleted.`,
      });
      
      // If the deleted category was active, switch to the first available one
      if (activeTab === category && availableCategories.length > 1) {
        const remainingCategories = availableCategories.filter(c => c !== category);
        if (remainingCategories.length > 0) {
          setActiveTab(remainingCategories[0]);
        }
      }
      
      // Force refresh the page to reload data
      window.location.reload();
    } catch (error) {
      console.error('Error deleting theme:', error);
      toast({
        title: "Error",
        description: "Failed to delete theme. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Social Media Calendar</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage your social media content for LinkedIn and other platforms.
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Theme:</span>
                <span className="text-sm font-medium capitalize">{activeTab}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Theme</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the "{activeTab}" theme? This will permanently delete all {postsByCategory[activeTab]?.length || 0} posts in this theme. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteTheme(activeTab)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Theme
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div></div>
          <div className="flex gap-2">
            <Button onClick={() => setImportModalOpen(true)}>
              Import Theme Data
            </Button>
            <Suspense fallback={<div>Loading...</div>}>
              <ThemeImportModal 
                open={importModalOpen} 
                onOpenChange={setImportModalOpen} 
                onImportComplete={handleImportComplete} 
              />
            </Suspense>
          </div>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as CategoryType)} 
          className="space-y-8"
        >
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-max min-w-full h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
              {availableCategories.map((category) => (
                <TabsTrigger 
                  key={category} 
                  value={category} 
                  className="capitalize whitespace-nowrap px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {availableCategories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-8">
              <Suspense fallback={<CalendarSkeletonLoader />}>
                <PostForm 
                  onPostCreated={() => loadCategoryPosts(category)} 
                  category={category as any} 
                />
                <PostsTable 
                  posts={postsByCategory[category] || []} 
                  onPostsChange={() => loadCategoryPosts(category)} 
                />
              </Suspense>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageLayout>
  );
}
