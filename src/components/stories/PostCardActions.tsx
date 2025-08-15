import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, Mic, Share } from 'lucide-react';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostCardActionsProps {
  post: SocialMediaPost;
  onCopy: (post: SocialMediaPost) => void;
  onDelete: (postId: string) => void;
  onStoryTelling: () => void;
  showStoryTelling?: boolean;
}

export const PostCardActions: React.FC<PostCardActionsProps> = ({
  post,
  onCopy,
  onDelete,
  onStoryTelling,
  showStoryTelling = true
}) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || 'Check out this post',
          text: `${post.title || 'Post'}${post.description ? `\n\n${post.description}` : ''}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${post.title || 'Post'}${post.description ? `\n\n${post.description}` : ''}\n\n${window.location.href}`);
    }
  };

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="h-8 w-8 p-0"
      >
        <Share className="h-4 w-4" />
      </Button>
      {showStoryTelling && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onStoryTelling}
          className="h-8 w-8 p-0"
          title="Create Story Narration"
        >
          <Mic className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onCopy(post)}
        className="h-8 w-8 p-0"
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(post.id)}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};