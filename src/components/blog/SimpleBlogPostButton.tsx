import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, NotebookPen, Loader } from 'lucide-react';
import { useBlogWorkflow } from '@/hooks/useBlogWorkflow';
import { useNavigate } from 'react-router-dom';

interface SimpleBlogPostButtonProps {
  post: {
    id: string;
    title: string;
    description: string;
    day?: number;
    theme?: string;
    category?: string;
  };
}

export const SimpleBlogPostButton: React.FC<SimpleBlogPostButtonProps> = ({ post }) => {
  const navigate = useNavigate();
  const { blogStatus, createBlog, isLoading } = useBlogWorkflow(post.id);

  const handleClick = async () => {
    if (blogStatus.exists && blogStatus.id) {
      // Navigate to existing blog
      if (blogStatus.status === 'published' && blogStatus.slug) {
        navigate(`/blog/${blogStatus.slug}`);
      } else {
        navigate(`/blog-editor/${blogStatus.id}`);
      }
    } else {
      // Create new blog
      createBlog(post, {
        onSuccess: (data) => {
          if (data.redirect_url) {
            navigate(data.redirect_url);
          }
        }
      });
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader className="h-4 w-4 animate-spin" />
          Creating...
        </>
      );
    }

    if (blogStatus.exists) {
      return (
        <>
          <Eye className="h-4 w-4" />
          View Blog
        </>
      );
    }

    return (
      <>
        <NotebookPen className="h-4 w-4" />
        Create Blog
      </>
    );
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {getButtonContent()}
    </Button>
  );
};