import React, { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ImageHoverOverlay } from '@/components/ui/image-hover-overlay';
import { UploadDropdown } from './UploadDropdown';
import { Copy, Trash2, Loader2, Lightbulb, NotebookPen, Mic } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostsTableViewProps {
  posts: SocialMediaPost[];
  creatingBlogIds: Set<string>;
  uploadingPostId: string | null;
  uploading916PostId: string | null;
  uploading34PostId: string | null;
  uploading43PostId: string | null;
  uploadingGeneralVideoPostId: string | null;
  onStatusChange: (postId: string, newStatus: 'draft' | 'scheduled' | 'published') => void;
  onCopyContent: (post: SocialMediaPost) => void;
  onDeletePost: (postId: string) => void;
  onCreateBlogPost: (post: SocialMediaPost) => void;
  onGenerateVoiceoverScript: (post: SocialMediaPost) => void;
  onGenerateImagePrompt: (post: SocialMediaPost) => void;
  onImageUpload: (postId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onImage916Upload: (postId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onImage34Upload: (postId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onImage43Upload: (postId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onPreviewImage: (url: string, alt: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  file916InputRef: React.RefObject<HTMLInputElement>;
  file34InputRef: React.RefObject<HTMLInputElement>;
  file43InputRef: React.RefObject<HTMLInputElement>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-green-500/20 text-green-700 border-green-500/20';
    case 'scheduled':
      return 'bg-blue-500/20 text-blue-700 border-blue-500/20';
    default:
      return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20';
  }
};

export const PostsTableView = memo(({
  posts,
  creatingBlogIds,
  uploadingPostId,
  uploading916PostId,
  uploading34PostId,
  uploading43PostId,
  uploadingGeneralVideoPostId,
  onStatusChange,
  onCopyContent,
  onDeletePost,
  onCreateBlogPost,
  onGenerateVoiceoverScript,
  onGenerateImagePrompt,
  onImageUpload,
  onImage916Upload,
  onImage34Upload,
  onImage43Upload,
  onPreviewImage,
  fileInputRef,
  file916InputRef,
  file34InputRef,
  file43InputRef
}: PostsTableViewProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return null; // Mobile view handled elsewhere
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Images</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => (
          <TableRow key={post.id}>
            <TableCell className="font-medium max-w-[200px] truncate">
              {post.title}
            </TableCell>
            <TableCell className="max-w-[300px]">
              <div className="text-sm text-muted-foreground line-clamp-3">
                {post.description}
              </div>
            </TableCell>
            <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <Badge 
                className={getStatusColor(post.status)}
                onClick={() => {
                  const nextStatus = post.status === 'draft' ? 'published' : 'draft';
                  onStatusChange(post.id, nextStatus);
                }}
                style={{ cursor: 'pointer' }}
              >
                {post.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2 flex-wrap">
                {post.image_16_9_url && (
                  <div className="relative group">
                    <OptimizedImage
                      src={post.image_16_9_url}
                      alt="16:9 aspect ratio"
                      className="w-16 h-9 object-cover rounded cursor-pointer"
                      onClick={() => onPreviewImage(post.image_16_9_url!, `${post.title} - 16:9 image`)}
                    />
                    <ImageHoverOverlay className="text-xs">
                      16:9
                    </ImageHoverOverlay>
                  </div>
                )}
                {post.image_9_16_url && (
                  <div className="relative group">
                    <OptimizedImage
                      src={post.image_9_16_url}
                      alt="9:16 aspect ratio"
                      className="w-9 h-16 object-cover rounded cursor-pointer"
                      onClick={() => onPreviewImage(post.image_9_16_url!, `${post.title} - 9:16 image`)}
                    />
                    <ImageHoverOverlay className="text-xs">
                      9:16
                    </ImageHoverOverlay>
                  </div>
                )}
                {post.image_3_4_url && (
                  <div className="relative group">
                    <OptimizedImage
                      src={post.image_3_4_url}
                      alt="3:4 aspect ratio"
                      className="w-12 h-16 object-cover rounded cursor-pointer"
                      onClick={() => onPreviewImage(post.image_3_4_url!, `${post.title} - 3:4 image`)}
                    />
                    <ImageHoverOverlay className="text-xs">
                      3:4
                    </ImageHoverOverlay>
                  </div>
                )}
                {post.image_4_3_url && (
                  <div className="relative group">
                    <OptimizedImage
                      src={post.image_4_3_url}
                      alt="4:3 aspect ratio"
                      className="w-16 h-12 object-cover rounded cursor-pointer"
                      onClick={() => onPreviewImage(post.image_4_3_url!, `${post.title} - 4:3 image`)}
                    />
                    <ImageHoverOverlay className="text-xs">
                      4:3
                    </ImageHoverOverlay>
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-1 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyContent(post)}
                  title="Copy content"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!post.image_16_9_url || !post.image_9_16_url || !post.image_3_4_url || !post.image_4_3_url}
                  onClick={() => onGenerateImagePrompt(post)}
                  title="Generate image prompt"
                >
                  <Lightbulb className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onGenerateVoiceoverScript(post)}
                  title="Generate voiceover script"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCreateBlogPost(post)}
                  disabled={creatingBlogIds.has(post.id)}
                  title="Create blog post"
                >
                  {creatingBlogIds.has(post.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <NotebookPen className="h-4 w-4" />
                  )}
                </Button>
                <UploadDropdown
                  postId={post.id}
                  uploadingPostId={uploadingPostId}
                  uploading916PostId={uploading916PostId}
                  uploading34PostId={uploading34PostId}
                  uploading43PostId={uploading43PostId}
                  fileInputRef={fileInputRef}
                  file916InputRef={file916InputRef}
                  file34InputRef={file34InputRef}
                  file43InputRef={file43InputRef}
                  onImageUpload={onImageUpload}
                  onImage916Upload={onImage916Upload}
                  onImage34Upload={onImage34Upload}
                  onImage43Upload={onImage43Upload}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeletePost(post.id)}
                  title="Delete post"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});

PostsTableView.displayName = 'PostsTableView';