import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { SocialMediaPost } from '@/types/socialMedia';

export const useOptimisticUpdates = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Optimistic post creation
  const optimisticCreatePost = async (
    category: string,
    tempPost: Partial<SocialMediaPost>,
    createFn: () => Promise<SocialMediaPost>
  ) => {
    const queryKey = ['category-posts', category];
    
    // Create temporary post with unique ID
    const optimisticPost: SocialMediaPost = {
      id: `temp-${Date.now()}`,
      user_id: tempPost.user_id || '',
      category: category as any,
      content: (tempPost as any).content || '',
      platform: (tempPost as any).platform || 'linkedin',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...tempPost,
    } as SocialMediaPost;

    // Store the previous data for rollback
    const previousData = queryClient.getQueryData(queryKey) as SocialMediaPost[] | undefined;

    // Optimistically update the cache
    queryClient.setQueryData(queryKey, (old: SocialMediaPost[] = []) => [optimisticPost, ...old]);

    try {
      // Perform the actual creation
      const newPost = await createFn();
      
      // Replace the temporary post with the real one
      queryClient.setQueryData(queryKey, (old: SocialMediaPost[] = []) => 
        old.map(post => post.id === optimisticPost.id ? newPost : post)
      );

      console.log('[Optimistic] Post created successfully:', newPost.id);
      return newPost;
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData);
      
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
      
      console.error('[Optimistic] Post creation failed:', error);
      throw error;
    }
  };

  // Optimistic post update
  const optimisticUpdatePost = async (
    category: string,
    postId: string,
    updates: Partial<SocialMediaPost>,
    updateFn: () => Promise<SocialMediaPost>
  ) => {
    const queryKey = ['category-posts', category];
    const previousData = queryClient.getQueryData(queryKey) as SocialMediaPost[] | undefined;

    // Optimistically update the cache
    queryClient.setQueryData(queryKey, (old: SocialMediaPost[] = []) =>
      old.map(post =>
        post.id === postId
          ? { ...post, ...updates, updated_at: new Date().toISOString() }
          : post
      )
    );

    try {
      const updatedPost = await updateFn();
      
      // Replace with the actual updated post
      queryClient.setQueryData(queryKey, (old: SocialMediaPost[] = []) =>
        old.map(post => post.id === postId ? updatedPost : post)
      );

      console.log('[Optimistic] Post updated successfully:', postId);
      return updatedPost;
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData);
      
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
      
      console.error('[Optimistic] Post update failed:', error);
      throw error;
    }
  };

  // Optimistic post deletion
  const optimisticDeletePost = async (
    category: string,
    postId: string,
    deleteFn: () => Promise<void>
  ) => {
    const queryKey = ['category-posts', category];
    const previousData = queryClient.getQueryData(queryKey) as SocialMediaPost[] | undefined;

    // Optimistically remove from cache
    queryClient.setQueryData(queryKey, (old: SocialMediaPost[] = []) =>
      old.filter(post => post.id !== postId)
    );

    try {
      await deleteFn();
      console.log('[Optimistic] Post deleted successfully:', postId);
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData);
      
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
      
      console.error('[Optimistic] Post deletion failed:', error);
      throw error;
    }
  };

  // Optimistic status change (publish/unpublish)
  const optimisticStatusChange = async (
    category: string,
    postId: string,
    newStatus: 'draft' | 'published',
    updateFn: () => Promise<SocialMediaPost>
  ) => {
    return optimisticUpdatePost(category, postId, { status: newStatus }, updateFn);
  };

  return {
    optimisticCreatePost,
    optimisticUpdatePost,
    optimisticDeletePost,
    optimisticStatusChange,
  };
};