
import React, { useState, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useUserRole } from '@/hooks/useUserRole';
import { useOptimizedCalendar, useCategoryPosts } from '@/hooks/useOptimizedCalendar';
// Removed complex realtime debugging system
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

// Lazy load components
const PostsTable = React.lazy(() => import('@/components/calendar/PostsTable').then(module => ({ default: module.PostsTable })));
const ThemeImportModal = React.lazy(() => import('@/components/calendar/ThemeImportModalOptimized').then(module => ({ default: module.ThemeImportModalOptimized })));

type CategoryType = string;

export default function OptimizedCalendar() {
  const { user, loading } = useAuth();
  const { isAdmin } = useUserRole();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const { toast } = useToast();

  // Use the optimized calendar hook for performance
  const {
    activeTab,
    isInitialized,
    isLoadingCategories,
    isLoadingActiveTab,
    availableCategories,
    activeTabPosts,
    changeTab,
    invalidateCache,
    getCategoryPosts
  } = useOptimizedCalendar(user);

  const loadCategoryPosts = async (category: string) => {
    invalidateCache();
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
            changeTab(remainingCategories[0]);
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

  if (loading || (!isInitialized)) {
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
        {/* Hero Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border p-8 mb-8">
          <div className="absolute inset-0 bg-grid-small-black/[0.02] bg-grid-pattern" />
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Content Management
                  </div>
                <h1 className="text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                  Social Media Calendar
                </h1>
                <p className="text-lg text-muted-foreground mt-4 max-w-2xl leading-relaxed">
                  Create, manage, and schedule your social media content for LinkedIn and other platforms with our powerful content management system.
                </p>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {availableCategories.reduce((total, cat) => total + getCategoryPosts(cat).length, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Posts</div>
                  </div>
                  <div className="text-center">
                     <div className="text-2xl font-bold text-primary">{availableCategories.length}</div>
                     <div className="text-sm text-muted-foreground">Active Themes</div>
                   </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{activeTabPosts.length}</div>
                      <div className="text-sm text-muted-foreground">Current Theme</div>
                    </div>
                </div>
              </div>
              
              {/* Theme Management Panel - Available to all users */}
              <div className="lg:w-80 space-y-4">
                <div className="bg-card/50 backdrop-blur-sm border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Current Theme</h3>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Theme</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the "{activeTab}" theme? This will permanently delete all {activeTabPosts.length} posts in this theme. This action cannot be undone.
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
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    </div>
                    <div>
                      <div className="font-medium capitalize">{activeTab}</div>
                      <div className="text-xs text-muted-foreground">{activeTabPosts.length} posts</div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setImportModalOpen(true)}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  Import Theme Data
                </Button>
                
                <Button
                  onClick={async () => {
                    const { triggerSystemPromptGeneration } = await import('@/utils/systemPromptTrigger');
                    const result = await triggerSystemPromptGeneration(activeTab);
                    if (result.success) {
                      toast({
                        title: "System Prompt Generated",
                        description: `Successfully generated system prompt for "${activeTab}" category.`,
                      });
                    } else {
                      toast({
                        title: "Generation Failed",
                        description: result.error,
                        variant: "destructive",
                      });
                    }
                  }}
                  variant="outline" 
                  className="w-full"
                >
                  Generate Missing System Prompt
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <ThemeImportModal 
            open={importModalOpen} 
            onOpenChange={setImportModalOpen} 
            onImportComplete={handleImportComplete} 
          />
        </Suspense>

        <Tabs 
          value={activeTab} 
          onValueChange={changeTab} 
          className="space-y-8"
        >
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-full h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
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
                <PostsTable 
                  posts={category === activeTab ? activeTabPosts : getCategoryPosts(category)} 
                  onPostsChange={() => loadCategoryPosts(category)}
                  isAdmin={isAdmin}
                  category={category}
                />
              </Suspense>
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Simplified calendar without complex realtime debugging */}
      </div>
    </PageLayout>
  );
}
