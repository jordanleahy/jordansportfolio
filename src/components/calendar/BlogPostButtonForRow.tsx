import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, NotebookPen } from 'lucide-react';
import { useBlogStatus } from '@/hooks/useBlogStatus';
import { useNavigate } from 'react-router-dom';
import type { SocialMediaPost } from '@/types/socialMedia';

interface BlogPostButtonForRowProps {
  post: SocialMediaPost;
  creatingBlogIds: Set<string>;
  onCreateBlogPost: (post: SocialMediaPost) => void;
}

export const BlogPostButtonForRow: React.FC<BlogPostButtonForRowProps> = ({
  post,
  creatingBlogIds,
  onCreateBlogPost
}) => {
  const navigate = useNavigate();
  const blogStatus = useBlogStatus(post.id);
  
  const handleBlogAction = () => {
    if (blogStatus.exists) {
      navigate(`/blog/${blogStatus.slug}`);
    } else {
      onCreateBlogPost(post);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBlogAction}
      disabled={blogStatus.isLoading || creatingBlogIds.has(post.id)}
      title={blogStatus.exists ? "View Blog" : "Create blog post"}
    >
      {blogStatus.isLoading || creatingBlogIds.has(post.id) ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : blogStatus.exists ? (
        <Eye className="h-4 w-4" />
      ) : (
        <NotebookPen className="h-4 w-4" />
      )}
    </Button>
  );
};