import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, NotebookPen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { BlogPostButtonForRowProps, BlogStatus } from '@/types/stories/ui';

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
  
  // Check if all aspect ratios are complete
  const areAllAspectRatiosComplete = () => {
    const aspectRatioStatuses = [
      post.image_16_9_status,
      post.image_9_16_status, 
      post.image_3_4_status,
      post.image_4_3_status
    ];
    
    // All aspect ratios must be either 'complete' or have an image URL
    return aspectRatioStatuses.every(status => 
      status === 'complete' || 
      status === 'none' // Allow 'none' as it might indicate no image needed
    );
  };
  
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
      disabled={
        status.isLoading || 
        creatingBlogIds.has(post.id) || 
        !areAllAspectRatiosComplete()
      }
      title={
        !areAllAspectRatiosComplete() 
          ? "Complete all aspect ratio images before creating blog post"
          : status.exists 
            ? "View Blog" 
            : "Create blog post"
      }
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