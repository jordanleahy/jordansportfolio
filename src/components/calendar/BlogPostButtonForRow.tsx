import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, NotebookPen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SocialMediaPost } from '@/types/socialMedia';

interface BlogStatus {
  exists: boolean;
  status?: 'draft' | 'published';
  id?: string;
  slug?: string;
  isLoading: boolean;
  error?: string;
}

interface BlogPostButtonForRowProps {
  post: SocialMediaPost;
  creatingBlogIds: Set<string>;
  onCreateBlogPost: (post: SocialMediaPost) => void;
  blogStatus?: BlogStatus;
}

export const BlogPostButtonForRow: React.FC<BlogPostButtonForRowProps> = ({
  post,
  creatingBlogIds,
  onCreateBlogPost,
  blogStatus
}) => {
  const navigate = useNavigate();
  
  // Default to loading state if no blogStatus provided
  const defaultStatus: BlogStatus = {
    exists: false,
    isLoading: true,
  };
  
  const status = blogStatus || defaultStatus;
  
  const handleBlogAction = () => {
    if (status.exists) {
      navigate(`/blog/${status.slug}`);
    } else {
      onCreateBlogPost(post);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBlogAction}
      disabled={status.isLoading || creatingBlogIds.has(post.id)}
      title={status.exists ? "View Blog" : "Create blog post"}
    >
      {status.isLoading || creatingBlogIds.has(post.id) ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : status.exists ? (
        <Eye className="h-4 w-4" />
      ) : (
        <NotebookPen className="h-4 w-4" />
      )}
    </Button>
  );
};