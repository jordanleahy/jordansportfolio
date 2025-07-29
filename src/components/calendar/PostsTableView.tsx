import React, { memo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ImageHoverOverlay } from '@/components/ui/image-hover-overlay';
import { UploadDropdown } from './UploadDropdown';
import { BlogStatusBadge } from './BlogStatusBadge';
import { Copy, Trash2, Loader2, Lightbulb, NotebookPen, Mic, ChevronUp, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostsTableViewProps {
  posts: SocialMediaPost[];
  activeTab: 'draft' | 'published';
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

type SortField = 'day' | 'title' | 'created_at' | 'status';
type SortDirection = 'asc' | 'desc';

export const PostsTableView = memo(({
  posts,
  activeTab,
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
  const [sortField, setSortField] = useState<SortField>('day');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'day':
        aValue = a.day || 0;
        bValue = b.day || 0;
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  );

  if (isMobile) {
    return null; // Mobile view handled elsewhere
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader field="day">Day</SortableHeader>
          <SortableHeader field="title">Title</SortableHeader>
          <TableHead>Description</TableHead>
          <SortableHeader field="created_at">Date</SortableHeader>
          <SortableHeader field="status">Status</SortableHeader>
          <TableHead>Images</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedPosts.map((post, index) => (
          <TableRow key={post.id}>
            <TableCell className="font-medium">
              {post.day || '-'}
            </TableCell>
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
              <div className="flex gap-2 items-center flex-wrap">
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
                {post.status === 'draft' && activeTab === 'draft' && post.day && (
                  <Badge variant="outline" className="text-xs">
                    {post.day}
                  </Badge>
                )}
                <BlogStatusBadge postId={post.id} />
              </div>
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
                  disabled={creatingBlogIds.has(post.id) || !post.image_16_9_url || !post.image_9_16_url || !post.image_3_4_url || !post.image_4_3_url}
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