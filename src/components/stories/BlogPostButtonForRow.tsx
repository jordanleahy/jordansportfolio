import React from 'react';
import { SimpleBlogPostButton } from '@/components/blog/SimpleBlogPostButton';
import type { BlogPostButtonForRowProps } from '@/types/stories/ui';

export const BlogPostButtonForRow: React.FC<BlogPostButtonForRowProps> = ({
  post,
  creatingBlogIds,
  onCreateBlogPost,
  blogStatus
}) => {
  return (
    <div className="flex items-center">
      <SimpleBlogPostButton post={post} />
    </div>
  );
};