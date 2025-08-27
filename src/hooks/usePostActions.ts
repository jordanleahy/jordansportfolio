import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { BlogService } from '@/services/blogService';
import type { SocialMediaPost } from '@/types/socialMedia';

export const usePostActions = (onPostsChange: () => void) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [creatingBlogIds, setCreatingBlogIds] = useState<Set<string>>(new Set());

  const handleStatusChange = useCallback(async (postId: string, newStatus: 'draft' | 'scheduled' | 'published') => {
    try {
      await optimizedSocialMediaService.updatePost(postId, { status: newStatus });
      onPostsChange();
    } catch (error) {
      console.error('Error updating post status:', error);
      toast({
        title: "Error",
        description: "Failed to update post status",
        variant: "destructive"
      });
    }
  }, [onPostsChange, toast]);

  const handleCopyContent = useCallback(async (post: SocialMediaPost) => {
    const content = `${post.title}\n\n${post.story_description}`;
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Content copied",
        description: "Post content has been copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      await optimizedSocialMediaService.deletePost(postId);
      toast({
        title: "Post deleted",
        description: "The post has been successfully deleted."
      });
      onPostsChange();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the post.",
        variant: "destructive"
      });
    }
  }, [onPostsChange, toast]);

  const handleCreateBlogPost = useCallback(async (post: SocialMediaPost) => {
    setCreatingBlogIds(prev => new Set(prev).add(post.id));
    try {
      const { blog_post: blogPost, redirect_url: redirectUrl } = await BlogService.generateBlogFromSocialPost(post);
      toast({
        title: "Blog post created",
        description: "A draft blog post has been created. Redirecting to editor..."
      });

      setTimeout(() => {
        if (redirectUrl) {
          navigate(redirectUrl);
        } else if (blogPost) {
          navigate(`/blog-editor/${blogPost.id}`);
        }
      }, 1000);
    } catch (error) {
      console.error('Error creating blog post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreatingBlogIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
    }
  }, [navigate, toast]);

  return {
    creatingBlogIds,
    handleStatusChange,
    handleCopyContent,
    handleDeletePost,
    handleCreateBlogPost
  };
};