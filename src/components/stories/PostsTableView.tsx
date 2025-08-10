// PostsTableView - Updated to use standard img tags instead of OptimizedImage
import React, { memo, useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ImageHoverOverlay } from '@/components/ui/image-hover-overlay';
import { SingleAspectRatioSelector } from './SingleAspectRatioSelector';
import { BlogStatusBadge } from './BlogStatusBadge';
import { BlogPostButtonForRow } from './BlogPostButtonForRow';
import { ActionButton } from '@/components/ui/action-button';
import { Copy, Trash2, Lightbulb, Mic, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBulkImageGeneration } from '@/hooks/useImageBatchGeneration';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { AspectRatioKey } from '@/types/bulkImageGeneration';


import type { PostsTableViewProps } from '@/types/stories/ui';

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
  onStatusChange,
  onCopyContent,
  onDeletePost,
  onCreateBlogPost,
  onGenerateVoiceoverScript,
  onGenerateImagePrompt,
  onGenerateImage,
  onPreviewImage,
  onPostsChange,
  isAdmin = false,
  animatingRows = new Set(),
  completingRows = new Set(),
  getRowAnimationClass = () => '',
  blogStatuses = {}
}: PostsTableViewProps) => {
  const isMobile = useIsMobile();
  const [sortField, setSortField] = useState<SortField>('day');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { generateAllImages, isGenerating } = useBulkImageGeneration();
  const { isProcessing: isProcessingCtx } = useProcessingStatesContext();
  const toAspect = (k: AspectRatioKey) => k.replace('_', ':') as any;

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

  const sortedPosts = useMemo(() => {
    const arr = [...posts];
    arr.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

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
          return 0 as any;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    return arr;
  }, [posts, sortField, sortDirection]);

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
            <div className="w-12">Day</div>
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
        {sortedPosts.map((post, index) => {
          const createPostActions = () => {
            const baseActions = [
              {
                icon: <Copy className="h-4 w-4" />,
                onClick: () => onCopyContent(post),
                title: "Copy content",
                loading: false
              },
              {
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => onDeletePost(post.id),
                title: "Delete post",
                loading: false
              }
            ];

            const adminActions = [
              {
                icon: <Sparkles className="h-4 w-4" />,
                onClick: () => handleGenerateAllImages(post),
                loading: isGenerating(post.id),
                title: "Bulk Generate"
              },
              {
                icon: <Lightbulb className="h-4 w-4" />,
                onClick: () => onGenerateImagePrompt(post),
                title: "Generate image prompt",
                loading: false
              },
              {
                icon: <Mic className="h-4 w-4" />,
                onClick: () => onGenerateVoiceoverScript(post),
                title: "Generate voiceover script",
                loading: false
              }
            ];

            return isAdmin ? [...baseActions.slice(0, 1), ...adminActions, ...baseActions.slice(1)] : baseActions;
          };

          const selectorProps = {
            post,
            onGenerateImage,
            onPostsChange
          };

          const isBulk = isProcessingCtx(post.id, 'bulk_generate');
          return (
          <TableRow key={post.id} className={`h-20 transition-all duration-300 ${getRowAnimationClass(post.id)}`}>
            <TableCell className="font-medium w-12">
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
                <BlogStatusBadge postId={post.id} blogStatus={blogStatuses[post.id]} />
              </div>
            </TableCell>
            <TableCell className="w-40">
              <div className="grid grid-cols-2 gap-2">
                {/* Top row: 16:9 and 4:3 */}
                {post.image_16_9_url ? (
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
                ) : (isProcessingCtx(post.id, 'generate', toAspect('16_9')) || isBulk) ? (
                  <SimpleShimmer
                    variant="thumbnail"
                    className="w-16 h-9 flex-shrink-0"
                  />
                ) : <div className="w-16 h-9"></div>}
                {post.image_4_3_url ? (
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
                ) : (isProcessingCtx(post.id, 'generate', toAspect('4_3')) || isBulk) ? (
                  <SimpleShimmer
                    variant="thumbnail"
                    className="w-16 h-12 flex-shrink-0"
                  />
                ) : <div className="w-16 h-12"></div>}

                {/* Bottom row: 9:16 and 3:4 */}
                {post.image_9_16_url ? (
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
                ) : isProcessingCtx(post.id, 'generate', toAspect('9_16')) ? (
                  <SimpleShimmer
                    variant="thumbnail"
                    className="w-9 h-16 flex-shrink-0"
                  />
                ) : <div className="w-9 h-16"></div>}

                {post.image_3_4_url ? (
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
                ) : isProcessingCtx(post.id, 'generate', toAspect('3_4')) ? (
                  <SimpleShimmer
                    variant="thumbnail"
                    className="w-12 h-16 flex-shrink-0"
                  />
                ) : <div className="w-12 h-16"></div>}
              </div>
            </TableCell>
            <TableCell className="w-48">
              <div className="flex gap-1 flex-wrap">
                {createPostActions().map((action, actionIndex) => (
                  <ActionButton
                    key={actionIndex}
                    icon={action.icon}
                    onClick={action.onClick}
                    loading={action.loading}
                    title={action.title}
                  />
                ))}
                {isAdmin && (
                <BlogPostButtonForRow 
                  post={post}
                  creatingBlogIds={creatingBlogIds}
                  onCreateBlogPost={onCreateBlogPost}
                  blogStatus={blogStatuses[post.id]}
                />
                )}
                <SingleAspectRatioSelector {...selectorProps} />
              </div>
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
});

PostsTableView.displayName = 'PostsTableView';