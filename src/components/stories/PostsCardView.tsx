import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageHoverOverlay } from '@/components/ui/image-hover-overlay';
import { SingleAspectRatioSelector } from './SingleAspectRatioSelector';
import { BlogStatusBadge } from './BlogStatusBadge';
import { BlogPostButtonForRow } from './BlogPostButtonForRow';
import { ActionButton } from '@/components/ui/action-button';
import { Copy, Trash2, Lightbulb, Mic, Sparkles, Edit2, RefreshCw, ChevronDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleShimmer } from '@/components/ui/simple-shimmer';

import { useBulkImageGeneration } from '@/hooks/useImageBatchGeneration';
import { useInstantFeedback } from '@/hooks/useInstantFeedback';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
import { useEnhancedThemeDataPrefetch } from '@/hooks/useEnhancedThemeDataPrefetch';
import { useCachedPromptGeneration } from '@/hooks/useCachedPromptGeneration';
import { generatePostPDF, generateMultiplePostsPDF } from '@/utils/pdfGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserRole } from '@/hooks/useUserRole';
import { useImageGenerationTimerContext } from '@/contexts/ImageGenerationTimerContext';
import { UnifiedLoadingIndicator } from '@/components/ui/unified-loading-indicator';
import { ImageVersionThumbnails } from '@/components/ui/image-version-thumbnails';
import { PostImageWithVersions } from '@/components/ui/post-image-with-versions';
import { useImageVersions } from '@/hooks/useImageVersions';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { cn } from '@/lib/utils';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { AspectRatioKey, AspectRatio } from '@/types/bulkImageGeneration';
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
  const { setInstantLoading, debouncedAction, isGenerating: isInstantGenerating, getElapsedTime } = useInstantFeedback();
  const { setProcessing } = useProcessingStatesContext();
  const { themeData } = useEnhancedThemeDataPrefetch();
  const { generateWithCache } = useCachedPromptGeneration();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getCreditStatus, enforceUsage, getBlockingMessage } = useCreditCheck();
  const isMobile = useIsMobile();
  const { isAdmin: isUserAdmin } = useUserRole();
  
  const {
    isRunning,
    secondsRemaining,
    isExpired
  } = useImageGenerationTimerContext();
  
  const { isProcessing: isProcessingCtx, isGenerating: isGeneratingCtx, isAnyImageGenerating } = useProcessingStatesContext();
  const toAspect = (k: AspectRatioKey) => k.replace('_', ':') as any;
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  // Memoized state calculations for performance optimization
  const regenerateStates = useMemo(() => {
    const states = new Map();
    posts.forEach(post => {
      const aspectRatio = '1:1' as AspectRatio;
      const isCurrentProcessing = isProcessingCtx(post.id, 'generate', aspectRatio);
      const isOtherGenerating = isAnyImageGenerating() && !isCurrentProcessing;
      
      states.set(post.id, {
        isProcessing: isCurrentProcessing,
        isDisabled: isCurrentProcessing || isOtherGenerating,
        buttonText: isCurrentProcessing 
          ? 'Regenerating...' 
          : isOtherGenerating 
            ? 'Image Generation in Progress'
            : post.image_1_1_url ? 'Regenerate' : 'Generate',
        loadingMessage: post.image_1_1_url ? "Regenerating..." : "Generating..."
      });
    });
    return states;
  }, [posts, isProcessingCtx, isAnyImageGenerating]);

  // Debounced regenerate handler to prevent rapid clicks
  const [regenerateClickDebounce, setRegenerateClickDebounce] = useState<Set<string>>(new Set());
  
  const handleRegenerateImage = useCallback(async (
    post: SocialMediaPost, 
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    
    // Prevent rapid clicking
    if (regenerateClickDebounce.has(post.id)) return;
    
    setRegenerateClickDebounce(prev => new Set(prev).add(post.id));
    
    // Clear debounce after 1 second
    setTimeout(() => {
      setRegenerateClickDebounce(prev => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
    }, 1000);

    console.log('🔄 Regenerate button clicked for post:', post.id);
    const creditStatus = getCreditStatus();
    if (!creditStatus.hasCredits) {
      toast({
        title: "Credit limit reached",
        description: getBlockingMessage(creditStatus),
        variant: "destructive"
      });
      return;
    }

    // Always use AspectRatioKey format for consistency
    const aspectRatioKey = '1_1';
    onGenerateImage(post.id, aspectRatioKey, post.title, post.description, post.category);
  }, [regenerateClickDebounce, getCreditStatus, getBlockingMessage, toast, onGenerateImage]);

  // Timer is now auto-managed by ImageGenerationTimerContext

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
    console.log('🔄 Regenerate prompt started for post:', post.id);
    setInstantLoading(post.id, true);
    setProcessing(post.id, 'regenerate_prompt', true);
    
    try {
      await onGenerateImagePrompt(post);
      console.log('✅ Prompt regeneration completed for post:', post.id);
    } catch (error) {
      console.error('❌ Failed to regenerate prompt:', error);
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
            category: themeData?.category || post.category
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

  const handleDownloadPDF = useCallback(async (post: SocialMediaPost) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to download PDF",
        variant: "destructive"
      });
      return;
    }

    try {
      await generatePostPDF(post);
      toast({
        title: "PDF Downloaded",
        description: "Post has been saved as PDF"
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const handleDownloadAllPDF = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to download images",
        variant: "destructive"
      });
      return;
    }

    if (posts.length === 0) {
      toast({
        title: "No posts",
        description: "No posts available to download",
        variant: "destructive"
      });
      return;
    }

    // Check if any posts have 1:1 images for LinkedIn slideshow
    const postsWithImages = posts.filter(post => post.image_1_1_url);

    if (postsWithImages.length === 0) {
      toast({
        title: "No square images",
        description: "No square (1:1) images found for LinkedIn slideshow",
        variant: "destructive"
      });
      return;
    }

    try {
      await generateMultiplePostsPDF(postsWithImages, ['1_1'], themeData?.theme);
      toast({
        title: "LinkedIn Slideshow Downloaded",
        description: `${postsWithImages.length} square images saved as PDF for LinkedIn`
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to generate images PDF. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, toast, posts]);

  return (
    <div className="space-y-4">
      {/* Download All Button - Desktop/Tablet Only */}
      {user && posts.length > 1 && (
        <div className="hidden md:flex justify-end p-6 pb-0">
          <Button
            onClick={handleDownloadAllPDF}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Linkedin Slideshow
          </Button>
        </div>
      )}
      
      <div className={`grid grid-cols-1 gap-4 p-6${posts.length > 1 ? ' pt-0' : ''}`}>
      {posts.map((post, index) => {
        // Only display 1:1 images to maintain square container aspect
        const imageOrder: AspectRatioKey[] = ['1_1'];
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
        
        const isProcessing = post.image_1_1_status === 'processing';

        return (
        <Card key={post.id} className={`transition-all duration-300 hover:shadow-lg ${getRowAnimationClass(post.id)}`}>
          <div className="flex flex-col md:flex-row">
            {/* Image Section - Left */}
            <div className="md:w-64 md:shrink-0">
              <PostImageWithVersions 
                post={post}
                selectedImage={selectedImage}
                selectedAspectRatio={selectedAspectRatio}
                isProcessing={isProcessing}
                regenerateStates={regenerateStates}
                handleRegenerateImage={handleRegenerateImage}
                onPreviewImage={onPreviewImage}
                onGenerateImage={onGenerateImage}
                isProcessingCtx={isProcessingCtx}
                secondsRemaining={secondsRemaining}
                isRunning={isRunning}
                isExpired={isExpired}
              />
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

                         {user && (
                           <ActionButton
                             icon={<Download className="h-4 w-4" />}
                             onClick={() => handleDownloadPDF(post)}
                             title="Download as PDF"
                             size="sm"
                           />
                         )}

                         {user && (
                           <ActionButton
                             icon={<Mic className="h-4 w-4" />}
                             onClick={() => onGenerateVoiceoverScript(post)}
                             title="Generate voiceover script"
                             size="sm"
                           />
                         )}
                        
                         {isAdmin && (
                          <ActionButton
                            icon={<RefreshCw className="h-4 w-4" />}
                            onClick={() => handleRegeneratePrompt(post)}
                            title="Regenerate prompt"
                            loading={isProcessingCtx(post.id, 'regenerate_prompt') || isInstantGenerating(post.id)}
                            size="sm"
                          />
                        )}
                       
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
                         </>
                       )}
                        
                         {isUserAdmin && (
                           <ActionButton
                             icon={<ChevronDown className={`h-4 w-4 transition-transform ${expandedPosts.has(post.id) ? 'rotate-180' : ''}`} />}
                             onClick={() => togglePostExpansion(post.id)}
                             title="Toggle images"
                             size="sm"
                           />
                         )}
                        
                         {false && (
                           <ActionButton
                             icon={<Trash2 className="h-4 w-4" />}
                             onClick={() => onDeletePost(post.id)}
                             title="Delete post"
                             variant="destructive"
                             size="sm"
                           />
                         )}
                      </div>
                   </div>
                 </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Small Images Grid - Collapsible */}
                {expandedPosts.has(post.id) && (
                  <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-top-2 duration-200">
                    {(['16:9', '4:3', '3:4', '9:16'] as const).map((aspectRatio) => {
                      const aspectKey = aspectRatio.replace(':', '_') as AspectRatioKey;
                      const imageUrl = post[`image_${aspectKey}_url` as keyof SocialMediaPost] as string;
                      const status = post[`image_${aspectKey}_status` as keyof SocialMediaPost] as string;
                      
                      return (
                        <div key={aspectRatio} className={`${
                          aspectRatio === '16:9' ? 'aspect-video' :
                          aspectRatio === '4:3' ? 'aspect-[4/3]' :
                          aspectRatio === '3:4' ? 'aspect-[3/4]' :
                          aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'
                        } relative group bg-muted rounded-md overflow-hidden`}>
                          {imageUrl ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={imageUrl}
                                alt={`${post.title} - ${aspectRatio}`}
                                className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => onPreviewImage(imageUrl, `${post.title} - ${aspectRatio}`)}
                              />
                              {/* Regenerate button overlay */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const creditStatus = getCreditStatus();
                                    if (!creditStatus.hasCredits) {
                                      toast({
                                        title: "Credit limit reached",
                                        description: getBlockingMessage(creditStatus),
                                        variant: "destructive"
                                      });
                                      return;
                                    }
                                    onGenerateImage(post.id, aspectKey, post.title, post.description, post.category);
                                  }}
                                  disabled={isProcessingCtx(post.id, 'generate', aspectRatio) || isAnyImageGenerating()}
                                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-background/90 hover:bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground hover:text-primary transition-colors pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Regenerate image"
                                >
                                  {isProcessingCtx(post.id, 'generate', aspectRatio) ? 'Regenerating...' : imageUrl ? 'Regenerate' : 'Generate'}
                                </button>
                              </div>
                            </div>
                          ) : (status === 'processing' || isProcessingCtx(post.id, 'generate', aspectRatio)) ? (
                            <div className="relative w-full h-full">
                              <SimpleShimmer className="w-full h-full" aspectRatio={aspectRatio} />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <UnifiedLoadingIndicator 
                                  isVisible={true}
                                  variant="overlay"
                                  size="sm"
                                  message={imageUrl ? "Regenerating..." : "Generating..."}
                                   timerSeconds={secondsRemaining}
                                   showTimer={isRunning}
                                   isTimerExpired={isExpired}
                                />
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                onGenerateImage(post.id, aspectKey, post.title, post.description, post.category);
                              }}
                              disabled={status === 'processing' || isAnyImageGenerating()}
                              className="w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors group-hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <Sparkles className="h-4 w-4" />
                                <span>
                                  {isProcessingCtx(post.id, 'generate', aspectRatio) ? 'Generating...' : isAnyImageGenerating() ? 'Image Generation in Progress' : aspectRatio}
                                </span>
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
                    <UnifiedLoadingIndicator 
                      isVisible={isInstantGenerating(post.id)}
                      variant="inline"
                      size="sm"
                      message="Generating..."
                    />
                  </div>
                )}

                {/* Mobile Regenerate Button */}
                {isMobile && post.image_1_1_url && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const creditStatus = getCreditStatus();
                        if (!creditStatus.hasCredits) {
                          toast({
                            title: "Credits Required",
                            description: getBlockingMessage(creditStatus),
                            variant: "destructive"
                          });
                          return;
                        }
                        onGenerateImage(post.id, '1_1', post.title, post.description, post.category);
                      }}
                      disabled={regenerateStates.get(post.id)?.isDisabled}
                      className="w-full"
                    >
                      {isProcessingCtx(post.id, 'generate', '1:1') ? (
                        <UnifiedLoadingIndicator 
                          isVisible={true}
                          variant="button"
                          message="Regenerating..."
                          icon="refresh"
                        />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate Image
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </div>
          </div>
        </Card>
        );
      })}
      </div>
    </div>
  );
});

PostsCardView.displayName = 'PostsCardView';
