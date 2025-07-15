import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { PostForm } from '@/components/calendar/PostForm';
import { PostsTable } from '@/components/calendar/PostsTable';
import { socialMediaService } from '@/services/socialMediaService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SocialMediaPost } from '@/types/socialMedia';

export default function Calendar() {
  const [cdiPosts, setCdiPosts] = useState<SocialMediaPost[]>([]);
  const [contractsPosts, setContractsPosts] = useState<SocialMediaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('cdi');
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

  const loadAllPosts = async () => {
    try {
      const [cdiData, contractsData] = await Promise.all([
        socialMediaService.getAllPosts('cdi'),
        socialMediaService.getAllPosts('contracts')
      ]);
      setCdiPosts(cdiData);
      setContractsPosts(contractsData);
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

  const loadCdiPosts = async () => {
    try {
      const cdiData = await socialMediaService.getAllPosts('cdi');
      setCdiPosts(cdiData);
    } catch (error) {
      console.error('Error loading CDI posts:', error);
      toast({
        title: "Error",
        description: "Failed to load CDI posts.",
        variant: "destructive",
      });
    }
  };

  const loadContractsPosts = async () => {
    try {
      const contractsData = await socialMediaService.getAllPosts('contracts');
      setContractsPosts(contractsData);
    } catch (error) {
      console.error('Error loading Contracts posts:', error);
      toast({
        title: "Error",
        description: "Failed to load Contracts posts.",
        variant: "destructive",
      });
    }
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
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Social Media Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your social media content for LinkedIn and other platforms.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cdi">CDI</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
          </TabsList>

          <TabsContent value="cdi" className="space-y-8">
            <PostForm onPostCreated={loadCdiPosts} category="cdi" />
            <PostsTable posts={cdiPosts} onPostsChange={loadCdiPosts} />
          </TabsContent>

          <TabsContent value="contracts" className="space-y-8">
            <PostForm onPostCreated={loadContractsPosts} category="contracts" />
            <PostsTable posts={contractsPosts} onPostsChange={loadContractsPosts} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}