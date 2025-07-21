import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { NotebookPen, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { SocialMediaPost } from '@/types/socialMedia';

interface BlogPostButtonProps {
  post: SocialMediaPost;
}

interface ExistingBlog {
  id: string;
  slug: string;
  status: string;
  hero_headline: string;
}

export const BlogPostButton = ({ post }: BlogPostButtonProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [existingBlog, setExistingBlog] = useState<ExistingBlog | null>(null);
  const [isCheckingBlog, setIsCheckingBlog] = useState(true);

  // Check for existing blog post on mount
  useEffect(() => {
    const checkExistingBlog = async () => {
      try {
        // Search for blog posts with similar title (first 20 chars)
        const titlePrefix = post.title.substring(0, 20);
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, slug, status, hero_headline')
          .ilike('hero_headline', `%${titlePrefix}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking existing blog:', error);
        } else if (data) {
          setExistingBlog(data);
        }
      } catch (error) {
        console.error('Error checking existing blog:', error);
      } finally {
        setIsCheckingBlog(false);
      }
    };

    checkExistingBlog();
  }, [post.title]);

  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      if (existingBlog) {
        // Navigate to existing blog post
        toast({
          title: "Opening blog post",
          description: "Redirecting to blog editor...",
        });
        
        setTimeout(() => {
          navigate(`/blog-editor/${existingBlog.id}`);
        }, 500);
      } else {
        // Create new blog post
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Please log in to create blog posts');
        }

        const response = await supabase.functions.invoke('generic-blog', {
          body: { socialMediaPost: post, checkExisting: false },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.error) {
          throw response.error;
        }

        const { blogPost, redirectUrl } = response.data;
        
        toast({
          title: "Blog post created",
          description: "A draft blog post has been created. Redirecting to editor...",
        });

        // Update local state to show as existing blog
        setExistingBlog({
          id: blogPost.id,
          slug: blogPost.slug,
          status: blogPost.status,
          hero_headline: blogPost.hero_headline,
        });

        setTimeout(() => {
          if (redirectUrl) {
            navigate(redirectUrl);
          } else {
            navigate(`/blog-editor/${blogPost.id}`);
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error with blog post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process blog post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isCheckingBlog || isLoading;
  const hasBlog = !!existingBlog;

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex-1"
      onClick={handleClick}
      disabled={isDisabled}
      title={hasBlog ? "Edit blog post" : "Create blog post"}
    >
      {isDisabled ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : hasBlog ? (
        <FileText className="h-4 w-4" />
      ) : (
        <NotebookPen className="h-4 w-4" />
      )}
    </Button>
  );
};