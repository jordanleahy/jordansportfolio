import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlogStatusBadge } from './BlogStatusBadge';
import { PostCardActions } from './PostCardActions';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostCardHeaderProps {
  post: SocialMediaPost;
  isAdmin: boolean;
  colorTheme?: { name: string; primary_color: string };
  onCopy: (post: SocialMediaPost) => void;
  onDelete: (postId: string) => void;
  onStatusChange: (postId: string, status: string) => void;
  onStoryTelling: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': 
      return 'bg-success/20 text-success-foreground border-success/20';
    case 'scheduled': 
      return 'bg-info/20 text-info-foreground border-info/20';
    default: 
      return 'bg-warning/20 text-warning-foreground border-warning/20';
  }
};

export const PostCardHeader: React.FC<PostCardHeaderProps> = ({
  post,
  isAdmin,
  colorTheme,
  onCopy,
  onDelete,
  onStatusChange,
  onStoryTelling
}) => {
  return (
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 flex-wrap">
            <BlogStatusBadge postId={post.id} />
            {colorTheme && (
              <Badge variant="outline" className="text-xs" title={`Theme: ${colorTheme.name}`}>
                <div className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full border border-border" 
                    style={{ backgroundColor: colorTheme.primary_color }}
                  />
                  {colorTheme.name}
                </div>
              </Badge>
            )}
          </div>
        </div>
        <PostCardActions
          post={post}
          onCopy={onCopy}
          onDelete={onDelete}
          onStoryTelling={onStoryTelling}
        />
      </div>
    </CardHeader>
  );
};