
import React, { useState, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useQuery } from '@tanstack/react-query';
import type { SocialMediaPost } from '@/types/socialMedia';

// Lazy load components
const PostForm = React.lazy(() => import('@/components/calendar/PostForm').then(module => ({ default: module.PostForm })));
const PostsTable = React.lazy(() => import('@/components/calendar/PostsTable').then(module => ({ default: module.PostsTable })));
const ThemeImportModal = React.lazy(() => import('@/components/calendar/ThemeImportModalOptimized').then(module => ({ default: module.ThemeImportModalOptimized })));

type CategoryType = 'cdi' | 'contracts' | 'coding ai' | 'ai agents';

export default function OptimizedCalendar() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<CategoryType>('cdi');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const { toast } = useToast();

  // Use optimized queries with caching
  const { data: availableCategories = ['cdi', 'contracts'] } = useQuery({
    queryKey: ['available-categories'],
    queryFn: () => optimizedSocialMediaService.getAvailableCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => {
      const allCategories = ['cdi', 'contracts', 'coding ai', 'ai agents', ...data.filter(c => c !== 'cdi' && c !== 'contracts' && c !== 'coding ai' && c !== 'ai agents')] as CategoryType[];
      return allCategories;
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
    // This will be handled by the optimized service cache
    await optimizedSocialMediaService.getAllPosts(category as any);
  };

  const handleImportComplete = async () => {
    toast({
      title: "Categories Updated",
      description: "Available categories have been refreshed after import.",
    });
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
          <h1 className="text-4xl font-bold tracking-tight">Social Media Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your social media content for LinkedIn and other platforms.
          </p>
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
