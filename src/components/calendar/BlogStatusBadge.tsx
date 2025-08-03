import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2 } from 'lucide-react';
import { CONTENT_STATUS } from '@/constants/agentConstants';

interface BlogStatus {
  exists: boolean;
  status?: string; // Using string to match database values
  id?: string;
  slug?: string;
  isLoading: boolean;
  error?: string;
}

interface BlogStatusBadgeProps {
  postId: string;
  className?: string;
  blogStatus?: BlogStatus;
}

export const BlogStatusBadge = ({ postId, className, blogStatus }: BlogStatusBadgeProps) => {
  // Default to loading state if no blogStatus provided
  const defaultStatus: BlogStatus = {
    exists: false,
    isLoading: true,
  };
  
  const status = blogStatus || defaultStatus;

  if (status.isLoading) {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
        Checking
      </Badge>
    );
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
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/20';
      case CONTENT_STATUS.DRAFT:
        return 'bg-purple-500/20 text-purple-700 border-purple-500/20';
      case CONTENT_STATUS.SCHEDULED:
        return 'bg-blue-500/20 text-blue-700 border-blue-500/20';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/20';
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