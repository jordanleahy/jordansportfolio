import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { PostForm } from '@/components/calendar/PostForm';
import { PostsTable } from '@/components/calendar/PostsTable';
import { socialMediaService } from '@/services/socialMediaService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SocialMediaPost } from '@/types/socialMedia';

export default function Calendar() {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadPosts();
        } else {
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadPosts();
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadPosts = async () => {
    try {
      const postsData = await socialMediaService.getAllPosts();
      setPosts(postsData);
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

        <div className="space-y-8">
          <PostForm onPostCreated={loadPosts} />
          <PostsTable posts={posts} onPostsChange={loadPosts} />
        </div>
      </div>
    </div>
  );
}