import React, { memo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageHoverOverlay } from '@/components/ui/image-hover-overlay';
import { SingleAspectRatioSelector } from './SingleAspectRatioSelector';
import { BlogStatusBadge } from './BlogStatusBadge';
import { BlogPostButtonForRow } from './BlogPostButtonForRow';
import { ActionButton } from '@/components/ui/action-button';
import { Copy, Trash2, Lightbulb, Mic, Sparkles, Edit2, RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { InstantLoadingIndicator } from '@/components/ui/instant-loading-indicator';
import { useBulkImageGeneration } from '@/hooks/useImageBatchGeneration';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
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

export const PostsCardView = memo(({
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
  const { generateAllImages, isGenerating } = useBulkImageGeneration();
  const { isProcessing: isProcessingCtx, setProcessing } = useProcessingStatesContext();
  const { setInstantLoading, debouncedAction, isGenerating: isInstantGenerating, getElapsedTime } = useInstantFeedback();
  const { themeData } = useEnhancedThemeDataPrefetch();
  const { generateWithCache } = useCachedPromptGeneration();
  const toAspect = (k: AspectRatioKey) => k.replace('_', ':') as any;
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleGenerateAllImages = async (post: SocialMediaPost) => {
    try {
      await generateAllImages({
        postId: post.id,
        title: post.title,
        description: post.description,
        category: post.category
      });
      onPostsChange();
    } catch (error) {
      console.error('Batch generation failed:', error);
    }
  };

  const handleRegeneratePrompt = useCallback(async (post: SocialMediaPost) => {
    setInstantLoading(post.id, true);
    setProcessing(post.id, 'regenerate_prompt', true);
    
    try {
      await onGenerateImagePrompt(post);
    } catch (error) {
      console.error('Failed to regenerate prompt:', error);
    } finally {
      setInstantLoading(post.id, false);
      setProcessing(post.id, 'regenerate_prompt', false);
    }
  }, [onGenerateImagePrompt, setInstantLoading, setProcessing]);

  const handleInstantImagePromptGeneration = useCallback((post: SocialMediaPost) => {
    setInstantLoading(post.id, true);
    
    debouncedAction(
      `generate_prompt_${post.id}`,
      async () => {
        try {
          setProcessing(post.id, 'generate', true);
          
          const generatedPrompt = await generateWithCache({
            postId: post.id,
            title: post.title,
            description: post.description,
            theme: themeData?.theme,
            themeId: themeData?.themeId,
            category: themeData?.category || post.category,
            aspectRatio: '1:1'
          });

          if (generatedPrompt) {
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
      100
    );
  }, [generateWithCache, themeData, setInstantLoading, setProcessing, debouncedAction]);

  return (
    <div className="grid grid-cols-1 gap-4 p-6">
      {posts.map((post, index) => (
        <Card key={post.id} className={`transition-all duration-300 hover:shadow-lg ${getRowAnimationClass(post.id)}`}>
          <div className="flex flex-col md:flex-row">
            {/* Image Section - Left */}
            <div className="md:w-64 md:shrink-0">
              {(() => {
                // Try to find the best image to display, preferring 1:1, then 4:3, then 16:9
                const imageOrder: AspectRatioKey[] = ['1_1', '4_3', '16_9'];
                let selectedImage = null;
                let selectedAspectRatio = null;
                
                for (const aspectKey of imageOrder) {
                  const imageUrl = post[`image_${aspectKey}_url` as keyof SocialMediaPost] as string;
                  const status = post[`image_${aspectKey}_status` as keyof SocialMediaPost] as string;
                  
                  if (imageUrl) {
                    selectedImage = imageUrl;
                    selectedAspectRatio = aspectKey.replace('_', ':');
                    break;
                  } else if (status === 'processing') {
                    selectedAspectRatio = aspectKey.replace('_', ':');
                    break;
                  }
                }
                
                const isProcessing = post.image_1_1_status === 'processing' || post.image_4_3_status === 'processing' || post.image_16_9_status === 'processing';
                
                return (
                  <div className="aspect-square relative group bg-muted rounded-md overflow-hidden">
                    {selectedImage ? (
                      <ImageHoverOverlay
                        onView={() => onPreviewImage(selectedImage, `${post.title} - ${selectedAspectRatio}`)}
                        imageUrl={selectedImage}
                        showUpload={false}
                        showDownload={true}
                        showDelete={false}
                        className="w-full h-full"
                      >
                        <img 
                          src={selectedImage}
                          alt={`${post.title} - ${selectedAspectRatio}`}
                          className="object-cover w-full h-full"
                        />
                      </ImageHoverOverlay>
                    ) : isProcessing ? (
                      <SimpleShimmer className="w-full h-full" />
                    ) : (
                      <button
                        onClick={() => {
                          // Start with 1:1 aspect ratio as default
                          onGenerateImage(post.id, '1_1', post.title, post.description, post.category);
                        }}
                        disabled={isProcessing}
                        className="w-full h-full flex flex-col items-center justify-center text-sm text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors group-hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Sparkles className="h-6 w-6" />
                          <span>Generate Image</span>
                        </div>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Content Section - Right */}
            <div className="flex-1 md:pl-6">
              <CardHeader className="pb-3">
                <div className="space-y-3">
                  {/* Title and Day Badge */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="text-xl leading-tight">{post.title}</CardTitle>
                    {post.day && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        Day {post.day}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Description */}
                  {post.description && (
                    <p className="text-sm text-muted-foreground">
                      {post.description}
                    </p>
                  )}
                  
                  {/* Action Buttons - Wrapping Below */}
                  <div className="flex gap-2 flex-wrap">
                    {/* Blog Post Button */}
                    {isAdmin && (
                      <BlogPostButtonForRow
                        post={post}
                        creatingBlogIds={creatingBlogIds}
                        onCreateBlogPost={onCreateBlogPost}
                        blogStatus={blogStatuses[post.id]}
                      />
                    )}
                    
                     <div className="flex gap-1 flex-wrap">
                       <ActionButton
                         icon={<Copy className="h-4 w-4" />}
                         onClick={() => onCopyContent(post)}
                         title="Copy content"
                         size="sm"
                       />
                       
                       <ActionButton
                         icon={<RefreshCw className="h-4 w-4" />}
                         onClick={() => handleRegeneratePrompt(post)}
                         title="Regenerate prompt"
                         loading={isProcessingCtx(post.id, 'regenerate_prompt') || isInstantGenerating(post.id)}
                         size="sm"
                       />
                       
                       {isAdmin && (
                         <>
                           <ActionButton
                             icon={<Sparkles className="h-4 w-4" />}
                             onClick={() => handleGenerateAllImages(post)}
                             loading={isGenerating(post.id)}
                             title="Bulk Generate"
                             size="sm"
                           />
                           
                           <ActionButton
                             icon={<Lightbulb className="h-4 w-4" />}
                             onClick={() => handleInstantImagePromptGeneration(post)}
                             title="Generate image prompt"
                             loading={isProcessingCtx(post.id, 'generate') || isInstantGenerating(post.id)}
                             size="sm"
                           />
                           
                           <ActionButton
                             icon={<Mic className="h-4 w-4" />}
                             onClick={() => onGenerateVoiceoverScript(post)}
                             title="Generate voiceover script"
                             size="sm"
                           />
                         </>
                       )}
                        
                        <ActionButton
                          icon={<ChevronDown className={`h-4 w-4 transition-transform ${expandedPosts.has(post.id) ? 'rotate-180' : ''}`} />}
                          onClick={() => togglePostExpansion(post.id)}
                          title="Toggle images"
                          size="sm"
                        />
                        
                        <ActionButton
                          icon={<Trash2 className="h-4 w-4" />}
                          onClick={() => onDeletePost(post.id)}
                          title="Delete post"
                          variant="destructive"
                          size="sm"
                        />
                      </div>
                   </div>
                 </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Small Images Grid - Collapsible */}
                {expandedPosts.has(post.id) && (
                  <div className="grid grid-cols-3 gap-2 animate-in slide-in-from-top-2 duration-200">
                    {(['16:9', '4:3', '1:1'] as const).map((aspectRatio) => {
                      const aspectKey = aspectRatio.replace(':', '_') as AspectRatioKey;
                      const imageUrl = post[`image_${aspectKey}_url` as keyof SocialMediaPost] as string;
                      const status = post[`image_${aspectKey}_status` as keyof SocialMediaPost] as string;
                      
                      return (
                        <div key={aspectRatio} className="aspect-[4/3] relative group bg-muted rounded-md overflow-hidden">
                          {imageUrl ? (
                            <ImageHoverOverlay
                              onView={() => onPreviewImage(imageUrl, `${post.title} - ${aspectRatio}`)}
                              imageUrl={imageUrl}
                              showUpload={false}
                              showDownload={true}
                              showDelete={false}
                              className="w-full h-full"
                            >
                              <img 
                                src={imageUrl}
                                alt={`${post.title} - ${aspectRatio}`}
                                className="object-cover w-full h-full"
                              />
                            </ImageHoverOverlay>
                          ) : status === 'processing' ? (
                            <SimpleShimmer className="w-full h-full" />
                          ) : (
                            <button
                              onClick={() => {
                                onGenerateImage(post.id, aspectKey, post.title, post.description, post.category);
                              }}
                              disabled={status === 'processing'}
                              className="w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors group-hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <Sparkles className="h-4 w-4" />
                                <span>{aspectRatio}</span>
                              </div>
                            </button>
                          )}
                          
                          <div className="absolute bottom-1 right-1">
                            <SingleAspectRatioSelector
                              post={post}
                              onGenerateImage={onGenerateImage}
                              onPostsChange={onPostsChange}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Status and Blog Info */}
                {isAdmin && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={getStatusColor(post.status)}>
                      {post.status}
                    </Badge>
                    <BlogStatusBadge postId={post.id} blogStatus={blogStatuses[post.id]} />
                    <InstantLoadingIndicator 
                      isVisible={isInstantGenerating(post.id)}
                      message="Generating..."
                      elapsedTime={getElapsedTime(post.id)}
                      className="text-xs"
                    />
                  </div>
                )}
              </CardContent>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

PostsCardView.displayName = 'PostsCardView';