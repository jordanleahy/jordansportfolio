import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { PostForm } from '@/components/calendar/PostForm';
import { PostsTable } from '@/components/calendar/PostsTable';
import { JsonImportDialog } from '@/components/calendar/JsonImportDialog';
import { socialMediaService } from '@/services/socialMediaService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import type { SocialMediaPost } from '@/types/socialMedia';

type CategoryType = 'cdi' | 'contracts' | 'forms';

export default function Calendar() {
  const [postsByCategory, setPostsByCategory] = useState<Record<string, SocialMediaPost[]>>({});
  const [availableCategories, setAvailableCategories] = useState<CategoryType[]>(['cdi', 'contracts']);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState<CategoryType>('cdi');
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadAllPosts();
        } else {
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadAllPosts();
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAllCategories = async () => {
    try {
      const categories = await socialMediaService.getAvailableCategories();
      const allCategories = ['cdi', 'contracts', ...categories.filter(c => c !== 'cdi' && c !== 'contracts')] as CategoryType[];
      setAvailableCategories(allCategories);
      
      // Load posts for all categories
      const postsData: Record<string, SocialMediaPost[]> = {};
      for (const category of allCategories) {
        const posts = await socialMediaService.getAllPosts(category as any);
        postsData[category] = posts;
      }
      setPostsByCategory(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllPosts = async () => {
    await loadAllCategories();
  };

  const loadCategoryPosts = async (category: CategoryType) => {
    try {
      const posts = await socialMediaService.getAllPosts(category as any);
      setPostsByCategory(prev => ({
        ...prev,
        [category]: posts
      }));
    } catch (error) {
      console.error(`Error loading ${category} posts:`, error);
      toast({
        title: "Error",
        description: `Failed to load ${category} posts.`,
        variant: "destructive",
      });
    }
  };

  const handleImportComplete = async () => {
    await loadAllCategories();
    toast({
      title: "Categories Updated",
      description: "Available categories have been refreshed after import.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-20 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Social Media Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your social media content for LinkedIn and other platforms.
          </p>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div></div>
          <JsonImportDialog onImportComplete={handleImportComplete} />
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as CategoryType)} 
          className="space-y-8"
        >
          <TabsList className={`grid w-full grid-cols-${availableCategories.length}`}>
            {availableCategories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {availableCategories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-8">
              <PostForm 
                onPostCreated={() => loadCategoryPosts(category)} 
                category={category as any} 
              />
              <PostsTable 
                posts={postsByCategory[category] || []} 
                onPostsChange={() => loadCategoryPosts(category)} 
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}