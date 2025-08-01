// PostsTableView - Updated to use standard img tags instead of OptimizedImage
import React, { memo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageHoverOverlay } from '@/components/ui/image-hover-overlay';
import { SingleAspectRatioSelector } from './SingleAspectRatioSelector';
import { BlogStatusBadge } from './BlogStatusBadge';
import { Copy, Trash2, Loader2, Lightbulb, NotebookPen, Mic, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBulkImageGeneration } from '@/hooks/useImageBatchGeneration';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { AspectRatioKey } from '@/types/bulkImageGeneration';

interface PostsTableViewProps {
  posts: SocialMediaPost[];
  activeTab: 'draft' | 'published';
  creatingBlogIds: Set<string>;
  isUploading: (postId: string, aspectRatio?: AspectRatioKey) => boolean;
  getUploadType: (postId: string) => AspectRatioKey | null;
  onStatusChange: (postId: string, newStatus: 'draft' | 'scheduled' | 'published') => void;
  onCopyContent: (post: SocialMediaPost) => void;
  onDeletePost: (postId: string) => void;
  onCreateBlogPost: (post: SocialMediaPost) => void;
  onGenerateVoiceoverScript: (post: SocialMediaPost) => void;
  onGenerateImagePrompt: (post: SocialMediaPost) => void;
  onFileSelect: (postId: string, aspectRatio: AspectRatioKey, post: SocialMediaPost) => void;
  onGenerateImage: (postId: string, aspectRatio: AspectRatioKey, title: string, description: string, category?: string) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
  onPreviewImage: (url: string, alt: string) => void;
  onPostsChange: () => void;
  isAdmin?: boolean;
  animatingRows?: Set<string>;
  completingRows?: Set<string>;
  getRowAnimationClass?: (postId: string) => string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20 transition-colors';
    case 'scheduled':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20 transition-colors';
    default:
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20 transition-colors';
  }
};

type SortField = 'day' | 'title' | 'created_at' | 'status';
type SortDirection = 'asc' | 'desc';

export const PostsTableView = memo(({
  posts,
  activeTab,
  creatingBlogIds,
  isUploading,
  getUploadType,
  onStatusChange,
  onCopyContent,
  onDeletePost,
  onCreateBlogPost,
  onGenerateVoiceoverScript,
  onGenerateImagePrompt,
  onFileSelect,
  onGenerateImage,
  onPreviewImage,
  onPostsChange,
  isAdmin = false,
  animatingRows = new Set(),
  completingRows = new Set(),
  getRowAnimationClass = () => ''
}: PostsTableViewProps) => {
  const isMobile = useIsMobile();
  const [sortField, setSortField] = useState<SortField>('day');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { generateAllImages, isGenerating } = useBulkImageGeneration();

  const getNextStatus = (currentStatus: string): 'draft' | 'scheduled' | 'published' => {
    switch (currentStatus) {
      case 'draft':
        return 'published';
      case 'scheduled':
        return 'published';
      case 'published':
        return 'draft';
      default:
        return 'draft';
    }
  };

  const handleGenerateAllImages = async (post: SocialMediaPost) => {
    try {
      await generateAllImages({
        postId: post.id,
        title: post.title,
        description: post.description,
        category: post.category
      });
      // Refresh the posts to show newly generated images
      onPostsChange();
    } catch (error) {
      console.error('Batch generation failed:', error);
    }
  };

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
        <TableRow className="h-12">
          <SortableHeader field="day">
            <div className="w-16">Day</div>
          </SortableHeader>
          <SortableHeader field="title">
            <div className="w-48">Title</div>
          </SortableHeader>
          <TableHead>
            <div className="w-64">Description</div>
          </TableHead>
          <SortableHeader field="created_at">
            <div className="w-24">Date</div>
          </SortableHeader>
          <SortableHeader field="status">
            <div className="w-32">Status</div>
          </SortableHeader>
          <TableHead>
            <div className="w-40">Images</div>
          </TableHead>
          <TableHead>
            <div className="w-48">Actions</div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedPosts.map((post, index) => (
          <TableRow key={post.id} className={`h-20 transition-all duration-300 ${getRowAnimationClass(post.id)}`}>
            <TableCell className="font-medium w-16">
              <div className="truncate">
                {post.day || '-'}
              </div>
            </TableCell>
            <TableCell className="font-medium w-48">
              <div className="break-words leading-tight line-clamp-4">
                {post.title}
              </div>
            </TableCell>
            <TableCell className="w-64">
              <div className="text-sm text-muted-foreground line-clamp-3 overflow-hidden">
                {post.description}
              </div>
            </TableCell>
            <TableCell className="w-24">
              <div className="truncate">
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </TableCell>
            <TableCell className="w-32">
              <div className="flex gap-2 items-center flex-wrap">
                <Badge 
                  className={`${
                    completingRows?.has(post.id) 
                      ? 'bg-green-500/30 text-green-800 border-green-500/40 animate-pulse' 
                      : getStatusColor(post.status)
                  } cursor-pointer select-none transition-all duration-300`}
                  onClick={() => {
                    const nextStatus = getNextStatus(post.status);
                    onStatusChange(post.id, nextStatus);
                  }}
                  title={`Click to ${getNextStatus(post.status) === 'draft' ? 'mark as draft' : 'publish'}`}
                >
                  {completingRows?.has(post.id) ? 'Published ✓' : post.status}
                </Badge>
                <BlogStatusBadge postId={post.id} />
              </div>
            </TableCell>
            <TableCell className="w-40">
              <div className="grid grid-cols-2 gap-2">
                {/* Top row: 16:9 and 4:3 */}
                {(() => {
                  const uploading = isUploading(post.id, '16_9');
                  console.log(`🖼️ [TableView] Checking 16:9 upload for ${post.id}: ${uploading}`);
                  return uploading;
                })() ? (
                  <div className="w-16 h-9 relative flex-shrink-0">
                    <Skeleton className="w-full h-full rounded border" />
                  </div>
                ) : post.image_16_9_url ? (
                  <div className="w-16 h-9 relative group overflow-hidden rounded border flex-shrink-0">
                    <img
                      src={post.image_16_9_url}
                      alt="16:9 aspect ratio"
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      onClick={() => onPreviewImage(post.image_16_9_url!, `${post.title} - 16:9 image`)}
                    />
                    <ImageHoverOverlay className="text-xs">16:9</ImageHoverOverlay>
                  </div>
                ) : <div className="w-16 h-9"></div>}

                {(() => {
                  const uploading = isUploading(post.id, '4_3');
                  console.log(`🖼️ [TableView] Checking 4:3 upload for ${post.id}: ${uploading}`);
                  return uploading;
                })() ? (
                  <div className="w-16 h-12 relative flex-shrink-0">
                    <Skeleton className="w-full h-full rounded border" />
                  </div>
                ) : post.image_4_3_url ? (
                  <div className="w-16 h-12 relative group overflow-hidden rounded border flex-shrink-0">
                    <img
                      src={post.image_4_3_url}
                      alt="4:3 aspect ratio"
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      onClick={() => onPreviewImage(post.image_4_3_url!, `${post.title} - 4:3 image`)}
                    />
                    <ImageHoverOverlay className="text-xs">4:3</ImageHoverOverlay>
                  </div>
                ) : <div className="w-16 h-12"></div>}

                {/* Bottom row: 9:16 and 3:4 */}
                {(() => {
                  const uploading = isUploading(post.id, '9_16');
                  console.log(`🖼️ [TableView] Checking 9:16 upload for ${post.id}: ${uploading}`);
                  return uploading;
                })() ? (
                  <div className="w-9 h-16 relative flex-shrink-0">
                    <Skeleton className="w-full h-full rounded border" />
                  </div>
                ) : post.image_9_16_url ? (
                  <div className="w-9 h-16 relative group overflow-hidden rounded border flex-shrink-0">
                    <img
                      src={post.image_9_16_url}
                      alt="9:16 aspect ratio"
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      onClick={() => onPreviewImage(post.image_9_16_url!, `${post.title} - 9:16 image`)}
                    />
                    <ImageHoverOverlay className="text-xs">9:16</ImageHoverOverlay>
                  </div>
                ) : <div className="w-9 h-16"></div>}

                {(() => {
                  const uploading = isUploading(post.id, '3_4');
                  console.log(`🖼️ [TableView] Checking 3:4 upload for ${post.id}: ${uploading}`);
                  return uploading;
                })() ? (
                  <div className="w-12 h-16 relative flex-shrink-0">
                    <Skeleton className="w-full h-full rounded border" />
                  </div>
                ) : post.image_3_4_url ? (
                  <div className="w-12 h-16 relative group overflow-hidden rounded border flex-shrink-0">
                    <img
                      src={post.image_3_4_url}
                      alt="3:4 aspect ratio"
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      onClick={() => onPreviewImage(post.image_3_4_url!, `${post.title} - 3:4 image`)}
                    />
                    <ImageHoverOverlay className="text-xs">3:4</ImageHoverOverlay>
                  </div>
                ) : <div className="w-12 h-16"></div>}
              </div>
            </TableCell>
            <TableCell className="w-48">
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
                  onClick={() => handleGenerateAllImages(post)}
                  disabled={isGenerating(post.id)}
                  title="Generate all images with AI"
                >
                  {isGenerating(post.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
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
                {isAdmin && (
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
                )}
                <SingleAspectRatioSelector
                  post={post}
                  isUploading={isUploading}
                  getUploadType={getUploadType}
                  onFileSelect={(postId, aspectRatio) => {
                    console.log('🖼️ IMAGE_UPLOAD: Desktop upload triggered', { postId, aspectRatio, postTitle: post.title });
                    onFileSelect(postId, aspectRatio, post);
                  }}
                  onGenerateImage={onGenerateImage}
                  onPostsChange={() => {
                    // This should trigger cache invalidation at the parent level
                    console.log('🔄 Desktop batch generation complete, triggering cache refresh');
                  }}
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