// PostsTableView - Updated to use standard img tags instead of OptimizedImage
import React, { memo, useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ImageHoverOverlay } from '@/components/ui/image-hover-overlay';
import { SingleAspectRatioSelector } from './SingleAspectRatioSelector';
import { BlogStatusBadge } from './BlogStatusBadge';
import { BlogPostButtonForRow } from './BlogPostButtonForRow';
import { ActionButton } from '@/components/ui/action-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Trash2, Lightbulb, Mic, ChevronUp, ChevronDown, Sparkles, Edit2, RefreshCw } from 'lucide-react';

import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { InstantLoadingIndicator } from '@/components/ui/instant-loading-indicator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
import { useIndividualPromptCache } from '@/hooks/useIndividualPromptCache';
import { useInstantFeedback } from '@/hooks/useInstantFeedback';
import { useEnhancedThemeDataPrefetch } from '@/hooks/useEnhancedThemeDataPrefetch';
import { useCachedPromptGeneration } from '@/hooks/useCachedPromptGeneration';
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

type SortField = 'title' | 'status' | 'day';
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
  blogStatuses = {},
  onEditPost
}: PostsTableViewProps) => {
  const isMobile = useIsMobile();
  const [sortField, setSortField] = useState<SortField>('day');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingCell, setEditingCell] = useState<{postId: string, field: 'title' | 'description'} | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: string}>({});
  const [hoveredCell, setHoveredCell] = useState<{postId: string, field: 'title' | 'description'} | null>(null);
  const { isProcessing: isProcessingCtx, setProcessing } = useProcessingStatesContext();
  const { setInstantLoading, debouncedAction, isGenerating: isInstantGenerating, getElapsedTime } = useInstantFeedback();
  const { themeData } = useEnhancedThemeDataPrefetch();
  const { generateWithCache, fromCache } = useCachedPromptGeneration();
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

  // Bulk generation functionality removed - use individual aspect generation
  
  const handleRegeneratePrompt = useCallback(async (post: SocialMediaPost) => {
    // Instant UI feedback - show loading immediately
    setInstantLoading(post.id, true);
    setProcessing(post.id, 'regenerate_prompt', true);
    
    try {
      // Call the existing onGenerateImagePrompt which should handle the regeneration
      await onGenerateImagePrompt(post);
    } catch (error) {
      console.error('Failed to regenerate prompt:', error);
    } finally {
      setInstantLoading(post.id, false);
      setProcessing(post.id, 'regenerate_prompt', false);
    }
  }, [onGenerateImagePrompt, setInstantLoading, setProcessing]);

  const handleInstantImagePromptGeneration = useCallback((post: SocialMediaPost) => {
    // Provide instant feedback before any async operations
    setInstantLoading(post.id, true);
    
    // Use debounced action to prevent rapid clicking
    debouncedAction(
      `generate_prompt_${post.id}`,
      async () => {
        try {
          setProcessing(post.id, 'generate', true);
          
          // Use cached generation with enhanced theme data
          console.log('🎯 [POST_TABLE] Generating prompt for post:', {
            postId: post.id,
            title: post.title,
            themeData: themeData,
            hasThemeId: !!themeData?.themeId,
            timestamp: new Date().toISOString()
          });

          const generatedPrompt = await generateWithCache({
            postId: post.id,
            title: post.title,
            description: post.description,
            theme: themeData?.theme,
            themeId: themeData?.themeId,
            category: themeData?.category || post.category
          });

          if (generatedPrompt) {
            // Update the post with the generated prompt
            const { optimizedSocialMediaService } = await import('@/services/optimizedSocialMediaService');
            await optimizedSocialMediaService.updatePost(post.id, {
              generated_image_prompt: generatedPrompt
            });
          }
        } catch (error) {
          console.error('Failed to generate image prompt:', error);
        } finally {
          setInstantLoading(post.id, false);
          setProcessing(post.id, 'generate', false);
        }
      },
      100 // Very short debounce to prevent double-clicks but keep responsiveness
    );
  }, [generateWithCache, themeData, setInstantLoading, setProcessing, debouncedAction]);

  const handleCellEdit = (postId: string, field: 'title' | 'description', currentValue: string) => {
    setEditingCell({ postId, field });
    setEditValues(prev => ({ ...prev, [`${postId}-${field}`]: currentValue }));
  };

  const handleCellSave = async (postId: string, field: 'title' | 'description') => {
    const key = `${postId}-${field}`;
    const newValue = editValues[key];
    
    if (!newValue || newValue.trim() === '') {
      // Don't save empty values
      setEditingCell(null);
      return;
    }

    try {
      const currentPost = posts.find(p => p.id === postId);
      if (!currentPost) return;

      // Use the usePostEditor logic via onEditPost
      await onEditPost?.({
        ...currentPost,
        [field]: newValue.trim()
      });
      
      setEditingCell(null);
      // Clear the edit value
      const newEditValues = { ...editValues };
      delete newEditValues[key];
      setEditValues(newEditValues);
    } catch (error) {
      console.error('Failed to save edit:', error);
    }
  };

  const handleCellCancel = (postId: string, field: 'title' | 'description') => {
    const key = `${postId}-${field}`;
    const newEditValues = { ...editValues };
    delete newEditValues[key];
    setEditValues(newEditValues);
    setEditingCell(null);
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
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'day':
          // Handle null/undefined days by treating them as very high numbers (sort to end)
          aValue = a.day ?? 999999;
          bValue = b.day ?? 999999;
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
    <div className="w-full overflow-x-auto">
      <div className="min-w-max">
        <Table>
          <TableHeader>
            <TableRow className="h-12">
              <SortableHeader field="title">
                <div className="w-48">Title</div>
              </SortableHeader>
              <TableHead>
                <div className="w-64">Description</div>
              </TableHead>
              {isAdmin && (
                <SortableHeader field="status">
                  <div className="w-32">Status</div>
                </SortableHeader>
              )}
              <TableHead>
                <div className="w-48">Images</div>
              </TableHead>
              <TableHead>
                <div className="w-48">Actions</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPosts.map((post, index) => {
              const createLeftActions = () => {
                const regenerateAction = {
                  icon: <RefreshCw className="h-4 w-4" />,
                  onClick: () => handleRegeneratePrompt(post),
                  title: "Regenerate prompt",
                  loading: isProcessingCtx(post.id, 'regenerate_prompt') || isInstantGenerating(post.id)
                };

                const copyAction = {
                  icon: <Copy className="h-4 w-4" />,
                  onClick: () => onCopyContent(post),
                  title: "Copy content",
                  loading: false
                };

                // Remove bulk generation action - use individual aspect generation
                const adminActions = [
                  {
                    icon: <Lightbulb className="h-4 w-4" />,
                    onClick: () => onGenerateImagePrompt(post),
                    title: "Generate image prompt",
                    loading: false // Removed isProcessingCtx call
                  },
                  {
                    icon: <Mic className="h-4 w-4" />,
                    onClick: () => onGenerateVoiceoverScript(post),
                    title: "Generate voiceover script",
                    loading: false
                  }
                ];

                return isAdmin ? [regenerateAction, copyAction, ...adminActions] : [regenerateAction, copyAction];
              };

              const createRightActions = () => {
                return [{
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: () => onDeletePost(post.id),
                  title: "Delete post",
                  loading: false
                }];
              };

              const selectorProps = {
                post,
                onGenerateImage,
                onPostsChange,
                isAdmin
              };

              const isBulk = isProcessingCtx(post.id, 'bulk_generate');
              return (
              <TableRow key={post.id} className={`transition-all duration-300 ${getRowAnimationClass(post.id)}`}>
                <TableCell className="font-medium w-48">
                  <div 
                    className="relative group"
                    onMouseEnter={() => setHoveredCell({ postId: post.id, field: 'title' })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {editingCell?.postId === post.id && editingCell?.field === 'title' ? (
                      <Input
                        value={editValues[`${post.id}-title`] || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, [`${post.id}-title`]: e.target.value }))}
                        onBlur={() => handleCellSave(post.id, 'title')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCellSave(post.id, 'title');
                          if (e.key === 'Escape') handleCellCancel(post.id, 'title');
                        }}
                        autoFocus
                        className="h-8 text-sm"
                      />
                    ) : (
                      <div className="break-words leading-tight pr-6">
                        {post.title}
                      </div>
                    )}
                    {hoveredCell?.postId === post.id && hoveredCell?.field === 'title' && !editingCell && (
                      <button
                        onClick={() => handleCellEdit(post.id, 'title', post.title)}
                        className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded"
                        title="Edit title"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="w-64">
                  <div 
                    className="relative group"
                    onMouseEnter={() => setHoveredCell({ postId: post.id, field: 'description' })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {editingCell?.postId === post.id && editingCell?.field === 'description' ? (
                      <Textarea
                        value={editValues[`${post.id}-description`] || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, [`${post.id}-description`]: e.target.value }))}
                        onBlur={() => handleCellSave(post.id, 'description')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCellSave(post.id, 'description');
                          }
                          if (e.key === 'Escape') handleCellCancel(post.id, 'description');
                        }}
                        autoFocus
                        className="min-h-16 text-sm resize-none"
                        rows={3}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground pr-6">
                        {post.description}
                      </div>
                    )}
                    {hoveredCell?.postId === post.id && hoveredCell?.field === 'description' && !editingCell && (
                      <button
                        onClick={() => handleCellEdit(post.id, 'description', post.description || '')}
                        className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded"
                        title="Edit description"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </TableCell>
                {isAdmin && (
                  <TableCell className="w-32">
                    <div className="flex gap-2 items-center flex-wrap">
                      <BlogStatusBadge postId={post.id} blogStatus={blogStatuses[post.id]} />
                      
                      {/* Instant feedback indicator */}
                      <InstantLoadingIndicator 
                        isVisible={isInstantGenerating(post.id)}
                        message="Generating..."
                        elapsedTime={getElapsedTime(post.id)}
                        className="text-xs"
                      />
                    </div>
                  </TableCell>
                )}
                <TableCell className="w-48">
                  <div className="grid grid-cols-3 gap-1">
                    {/* Top row: 16:9, 4:3, 1:1 */}
                    {post.image_16_9_url ? (
                      <div className="w-14 h-8 relative group overflow-hidden rounded border flex-shrink-0">
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
                        className="w-14 h-8 flex-shrink-0"
                      />
                    ) : <div className="w-14 h-8"></div>}
                    
                    {post.image_4_3_url ? (
                      <div className="w-14 h-10 relative group overflow-hidden rounded border flex-shrink-0">
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
                        className="w-14 h-10 flex-shrink-0"
                      />
                    ) : <div className="w-14 h-10"></div>}

                    {post.image_1_1_url ? (
                      <div className="w-12 h-12 relative group overflow-hidden rounded border flex-shrink-0">
                        <img
                          src={post.image_1_1_url}
                          alt="1:1 aspect ratio"
                          className="w-full h-full object-cover cursor-pointer"
                          loading="lazy"
                          onClick={() => onPreviewImage(post.image_1_1_url!, `${post.title} - 1:1 image`)}
                        />
                        <ImageHoverOverlay className="text-xs">1:1</ImageHoverOverlay>
                      </div>
                    ) : (isProcessingCtx(post.id, 'generate', toAspect('1_1')) || isBulk) ? (
                      <SimpleShimmer
                        variant="thumbnail"
                        className="w-12 h-12 flex-shrink-0"
                      />
                    ) : <div className="w-12 h-12"></div>}

                    {/* Bottom row: 9:16 and 3:4 */}
                    {post.image_9_16_url ? (
                      <div className="w-8 h-14 relative group overflow-hidden rounded border flex-shrink-0">
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
                        className="w-8 h-14 flex-shrink-0"
                      />
                    ) : <div className="w-8 h-14"></div>}

                    {post.image_3_4_url ? (
                      <div className="w-10 h-14 relative group overflow-hidden rounded border flex-shrink-0">
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
                        className="w-10 h-14 flex-shrink-0"
                      />
                    ) : <div className="w-10 h-14"></div>}
                  </div>
                </TableCell>
                <TableCell className="w-48">
                  <div className="flex justify-between items-start">
                    {/* Left container: Copy + Image actions */}
                    <div className="flex gap-1 flex-wrap">
                      {createLeftActions().map((action, actionIndex) => (
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
                    
                    {/* Right container: Delete action */}
                    <div className="flex gap-1">
                      {createRightActions().map((action, actionIndex) => (
                        <ActionButton
                          key={actionIndex}
                          icon={action.icon}
                          onClick={action.onClick}
                          loading={action.loading}
                          title={action.title}
                        />
                      ))}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

PostsTableView.displayName = 'PostsTableView';