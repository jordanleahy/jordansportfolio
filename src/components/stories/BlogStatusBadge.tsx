import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2 } from 'lucide-react';
import { CONTENT_STATUS } from '@/constants/agentConstants';
import type { BlogStatusBadgeProps, BlogStatus } from '@/types/stories/ui';

export const BlogStatusBadge = ({ postId, className, blogStatus }: BlogStatusBadgeProps) => {
  // Default to loading state if no blogStatus provided
  const defaultStatus: BlogStatus = {
    exists: false,
    isLoading: true,
  };
  
  const status = blogStatus || defaultStatus;

  if (status.isLoading) {
    return null; // Hide badge entirely during loading
  }

  if (status.error) {
    return null; // Don't show anything if there's an error
  }

  if (!status.exists) {
    return null; // Don't show anything if no blog exists
  }

  const getBlogStatusColor = (status: string) => {
    switch (status) {
      case CONTENT_STATUS.PUBLISHED:
        return 'bg-success/20 text-success border-success/20';
      case CONTENT_STATUS.DRAFT:
        return 'bg-accent/20 text-accent border-accent/20';
      case CONTENT_STATUS.SCHEDULED:
        return 'bg-info/20 text-info border-info/20';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/20';
    }
  };

  return (
    <Badge 
      className={`text-xs ${getBlogStatusColor(status.status!)} ${className}`}
      title={`Blog post is ${status.status}`}
    >
      <FileText className="h-3 w-3 mr-1" />
      Blog: {status.status}
    </Badge>
  );
};