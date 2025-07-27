import React from 'react';
import { Upload, ImageIcon, Video, Loader2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface UploadDropdownProps {
  postId: string;
  uploadingPostId: string | null;
  uploading916PostId: string | null;
  uploading34PostId: string | null;
  uploading43PostId: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  file916InputRef: React.RefObject<HTMLInputElement>;
  file34InputRef: React.RefObject<HTMLInputElement>;
  file43InputRef: React.RefObject<HTMLInputElement>;
  onImageUpload: (postId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onImage916Upload: (postId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onImage34Upload: (postId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onImage43Upload: (postId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const UploadDropdown: React.FC<UploadDropdownProps> = ({
  postId,
  uploadingPostId,
  uploading916PostId,
  uploading34PostId,
  uploading43PostId,
  fileInputRef,
  file916InputRef,
  file34InputRef,
  file43InputRef,
  onImageUpload,
  onImage916Upload,
  onImage34Upload,
  onImage43Upload,
}) => {
  // Check if any upload is in progress for this post
  const isUploading = uploadingPostId === postId || 
                     uploading916PostId === postId || 
                     uploading34PostId === postId || 
                     uploading43PostId === postId;

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Upload media">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Upload Images</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPostId === postId}
            className="cursor-pointer"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            16:9 (Landscape)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => file916InputRef.current?.click()}
            disabled={uploading916PostId === postId}
            className="cursor-pointer"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            9:16 (Portrait)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => file34InputRef.current?.click()}
            disabled={uploading34PostId === postId}
            className="cursor-pointer"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            3:4 (Portrait)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => file43InputRef.current?.click()}
            disabled={uploading43PostId === postId}
            className="cursor-pointer"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            4:3 (Landscape)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => onImageUpload(postId, e)}
      />
      <input
        type="file"
        ref={file916InputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => onImage916Upload(postId, e)}
      />
      <input
        type="file"
        ref={file34InputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => onImage34Upload(postId, e)}
      />
      <input
        type="file"
        ref={file43InputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => onImage43Upload(postId, e)}
      />
    </div>
  );
};