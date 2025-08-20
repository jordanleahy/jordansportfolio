import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NotebookPen, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useBlogStatus } from '@/hooks/useBlogStatus';
import { BlogService } from '@/services/blogService';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { BlogPostButtonProps } from '@/types/stories/ui';

export const BlogPostButton = ({ post }: BlogPostButtonProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const blogStatus = useBlogStatus(post.id);

  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      if (blogStatus.exists) {
        // Navigate to view the existing blog
        toast({
          title: "Opening blog post",
          description: "Redirecting to blog...",
        });
        
        setTimeout(() => {
          navigate(`/blog/${blogStatus.slug}`);
        }, 500);
      } else {
        // Create new blog post
        const response = await BlogService.generateBlogFromSocialPost(post, false);
        
        const { blog_post: blogPost, redirect_url: redirectUrl, message } = response;
        
        toast({
          title: "Blog post created",
          description: "A draft blog post has been created. Redirecting to editor...",
        });

        setTimeout(() => {
          if (redirectUrl) {
            navigate(redirectUrl);
          } else if (blogPost) {
            navigate(`/blog-editor/${blogPost.id}`);
          }
        }, 1000);
      }
    } catch (error: unknown) {
      console.error('Error with blog post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process blog post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = blogStatus.isLoading || isLoading;
  const hasBlog = blogStatus.exists;

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex-1"
      onClick={handleClick}
      disabled={isDisabled}
      title={hasBlog ? "View Blog" : "Create blog post"}
    >
      {isDisabled ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : hasBlog ? (
        <Eye className="h-4 w-4" />
      ) : (
        <NotebookPen className="h-4 w-4" />
      )}
    </Button>
  );
};