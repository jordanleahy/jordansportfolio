import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2 } from 'lucide-react';
import { useBlogStatus } from '@/hooks/useBlogStatus';

interface BlogStatusBadgeProps {
  postTitle: string;
  className?: string;
}

export const BlogStatusBadge = ({ postTitle, className }: BlogStatusBadgeProps) => {
  const blogStatus = useBlogStatus(postTitle);

  if (blogStatus.isLoading) {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
        Checking
      </Badge>
    );
  }

  if (blogStatus.error) {
    return null; // Don't show anything if there's an error
  }

  if (!blogStatus.exists) {
    return null; // Don't show anything if no blog exists
  }

  const getBlogStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/20';
      case 'draft':
        return 'bg-purple-500/20 text-purple-700 border-purple-500/20';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <Badge 
      className={`text-xs ${getBlogStatusColor(blogStatus.status!)} ${className}`}
      title={`Blog post is ${blogStatus.status}`}
    >
      <FileText className="h-3 w-3 mr-1" />
      Blog: {blogStatus.status}
    </Badge>
  );
};