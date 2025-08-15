import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  showStoryTelling?: boolean;
  isAdminSectionOpen?: boolean;
  onToggleAdminSection?: () => void;
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
  onStoryTelling,
  showStoryTelling = false,
  isAdminSectionOpen = false,
  onToggleAdminSection
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
        
        <div className="flex items-center gap-3">
          {isAdmin && onToggleAdminSection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAdminSection}
              className="h-8 w-8 p-0"
              aria-label={isAdminSectionOpen ? "Collapse admin features" : "Expand admin features"}
            >
              {isAdminSectionOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <PostCardActions
            post={post}
            onCopy={onCopy}
            onDelete={onDelete}
            onStoryTelling={onStoryTelling}
            showStoryTelling={showStoryTelling}
          />
        </div>
      </div>
    </CardHeader>
  );
};