import React from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { SocialMediaPost } from '@/types/socialMedia';

type AspectRatio = '16_9' | '9_16' | '3_4' | '4_3';

interface SimplifiedUploadDropdownProps {
  post: SocialMediaPost;
  isUploading: (postId: string, aspectRatio?: AspectRatio) => boolean;
  getUploadType: (postId: string) => AspectRatio | null;
  onFileSelect: (postId: string, aspectRatio: AspectRatio, post: SocialMediaPost) => void;
}

export const SimplifiedUploadDropdown: React.FC<SimplifiedUploadDropdownProps> = ({
  post,
  isUploading,
  getUploadType,
  onFileSelect,
}) => {
  const postIsUploading = isUploading(post.id);
  const uploadType = getUploadType(post.id);

  const aspectRatioOptions = [
    { value: '16_9' as const, label: '16:9 (Landscape)' },
    { value: '9_16' as const, label: '9:16 (Portrait)' },
    { value: '3_4' as const, label: '3:4 (Portrait)' },
    { value: '4_3' as const, label: '4:3 (Landscape)' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" title="Upload media">
          {postIsUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Upload Images</DropdownMenuLabel>
        {aspectRatioOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onFileSelect(post.id, option.value, post)}
            disabled={uploadType === option.value}
            className="cursor-pointer"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            {option.label}
            {uploadType === option.value && (
              <Loader2 className="ml-auto h-4 w-4 animate-spin" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};