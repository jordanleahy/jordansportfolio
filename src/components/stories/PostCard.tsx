import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageHoverOverlay } from '@/components/ui/image-hover-overlay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { StreamingShimmer } from '@/components/ui/streaming-shimmer';
import { Copy, Trash2, ImageIcon, Upload, Loader2, Lightbulb, ChevronDown, ChevronUp, Video, BookOpen, Mic, Sparkles, Share } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ImagePreviewModal } from './ImagePreviewModal';
import { PostMediaGalleryModal } from './PostMediaGalleryModal';
import { PostImageUploadCard } from './PostImageUploadCard';
import { BulkImageGenerationButton } from './BulkImageGenerationButton';
import VideoUploadCard from './VideoUploadCard';
import { BlogPostButton } from './BlogPostButton';
import { BlogStatusBadge } from './BlogStatusBadge';
import { useColorTheme } from '@/hooks/useColorThemes';
import { supabase } from '@/integrations/supabase/client';
import StoryTellingModal from './StoryTellingModal';
import type { SocialMediaPost } from '@/types/socialMedia';

import type { PostCardProps } from '@/types/stories/ui';

const PostCardComponent = ({ 
  post, 
  draftIndex, 
  onCopy, 
  onDelete,
  onGeneratePrompt,
  onGenerateVoiceover,
  onVideoUpload,
  onVideoRemove,
  onImageDelete,
  onImageGenerated,
  onStatusChange,
  onPostsChange,
  uploadingStates,
  completingPosts,
  isUploading: isUploadingProp,
  isAdmin = false
}: PostCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { data: colorTheme } = useColorTheme(post.color_theme_id || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showVideos, setShowVideos] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [isGeneratingHero, setIsGeneratingHero] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [showStoryTellingModal, setShowStoryTellingModal] = useState(false);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-700 border-green-500/20';
      case 'scheduled': return 'bg-blue-500/20 text-blue-700 border-blue-500/20';
      default: return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20';
    }
  };

  const truncateText = (text: string, limit: number) => {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  const isUploading = isUploadingProp || ((postId: string, aspectRatio?: '16_9' | '9_16' | '3_4' | '4_3') => {
    if (aspectRatio) {
      return uploadingStates[`${postId}_${aspectRatio}`] || false;
    }
    return Object.keys(uploadingStates).some(key => key.startsWith(`${postId}_`));
  });

  const getUploadType = (postId: string): '16_9' | '9_16' | '3_4' | '4_3' | null => {
    const uploadKey = Object.keys(uploadingStates).find(key => 
      key.startsWith(`${postId}_`) && uploadingStates[key]
    );
    if (uploadKey) {
      const parts = uploadKey.split('_');
      return parts.slice(1).join('_') as '16_9' | '9_16' | '3_4' | '4_3';
    }
    return null;
  };

  const handleHeroImageGenerate = async () => {
    try {
      setIsGeneratingHero(true);
      setGenerationStep('Generating prompt...');
      
      // Generate prompt using Supabase functions
      const { data: promptData, error: promptError } = await supabase.functions.invoke('generate-image-prompt-dynamic', {
        body: {
          title: post.title,
          description: post.description,
          category: post.category || 'general',
          colorTheme: colorTheme?.name || ''
        }
      });

      if (promptError) {
        throw new Error(`Failed to generate prompt: ${promptError.message}`);
      }

      console.log('Prompt response:', promptData);
      
      // Try different possible response structures
      const prompt = promptData?.generatedPrompt || 
                    promptData?.generatedText || 
                    promptData?.prompt || 
                    promptData?.generated_prompt || 
                    promptData?.result ||
                    (typeof promptData === 'string' ? promptData : null);
      
      if (!prompt) {
        console.error('No prompt found in response:', promptData);
        throw new Error(`No prompt generated. Response: ${JSON.stringify(promptData)}`);
      }

      setGenerationStep('Generating image...');
      
      // Generate image using the prompt
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-image-gpt', {
        body: {
          prompt: prompt,
          aspectRatio: '16_9'
        }
      });

      if (imageError) {
        throw new Error(`Failed to generate image: ${imageError.message}`);
      }

      console.log('Image response:', imageData);

      const base64Image = imageData?.image;
      if (!base64Image) {
        console.error('No image found in response:', imageData);
        throw new Error(`No image generated. Response: ${JSON.stringify(imageData)}`);
      }

      setGenerationStep('Uploading image...');
      
      // Convert base64 to blob and upload to storage
      const response = await fetch(`data:image/png;base64,${base64Image}`);
      const blob = await response.blob();
      
      // Create file object
      const fileName = `generated_${post.id}_16_9_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('social-media-images')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('social-media-images')
        .getPublicUrl(uploadData.path);

      // Update post with image URL
      await supabase
        .from('social_media_posts')
        .update({ 
          image_16_9_url: urlData.publicUrl,
          image_16_9_status: 'complete'
        })
        .eq('id', post.id);

      // Refresh the posts data
      onPostsChange?.();
      
      toast({
        title: "Hero image generated!",
        description: "Your 16:9 hero image has been created successfully.",
      });

    } catch (error) {
      console.error('Error generating hero image:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate hero image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingHero(false);
      setGenerationStep('');
    }
  };




  return (
    <Card className="w-full">
      {/* 16:9 Hero Image */}
      <div className="aspect-video rounded-t-lg overflow-hidden">
        {isGeneratingHero ? (
          <StreamingShimmer 
            isGenerating={true}
            className="w-full h-full"
            fallbackIcon={<ImageIcon className="h-8 w-8 text-primary/40" />}
          />
        ) : isUploading(post.id, '16_9') ? (
          <SimpleShimmer aspectRatio="16/9" className="w-full h-full" />
        ) : post.image_16_9_url ? (
          <img
            src={post.image_16_9_url}
            alt="Hero image"
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="bg-muted w-full h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">16:9 Hero Image</p>
            </div>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
            <div className="flex gap-2 mt-2 flex-wrap">
              {isAdmin && (
                <Badge 
                  className={`${getStatusColor(post.status)} text-xs cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => {
                    if (post.status === 'draft') {
                      onStatusChange(post.id, 'published');
                      toast({
                        title: "Status Updated",
                        description: "Post marked as published",
                      });
                    }
                  }}
                >
                  {post.status === 'published' ? new Date(post.updated_at).toLocaleDateString() : post.status}
                </Badge>
              )}
              {isAdmin && post.status === 'draft' && post.day && (
                <Badge variant="outline" className="text-xs">
                  {post.day}
                </Badge>
              )}
              <BlogStatusBadge postId={post.id} />
              {colorTheme && (
                <Badge variant="outline" className="text-xs" title={`Theme: ${colorTheme.name}`}>
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full border border-border" 
                      style={{ backgroundColor: colorTheme.primary_color }}
                    />
                    {colorTheme.name}
                  </div>
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: post.title || 'Check out this post',
                      text: `${post.title || 'Post'}${post.description ? `\n\n${post.description}` : ''}`,
                      url: window.location.href
                    });
                  } catch (error) {
                    // User cancelled or error occurred
                    console.log('Share cancelled or failed:', error);
                  }
                } else {
                  // Fallback: copy to clipboard
                  navigator.clipboard.writeText(`${post.title || 'Post'}${post.description ? `\n\n${post.description}` : ''}\n\n${window.location.href}`);
                }
              }}
              className="h-8 w-8 p-0"
            >
              <Share className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStoryTellingModal(true)}
              className="h-8 w-8 p-0"
              title="Create Story Narration"
            >
              <Mic className="h-4 w-4" />
            </Button>
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
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        <div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {post.description}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={handleHeroImageGenerate}
            disabled={isGeneratingHero || isUploading(post.id, '16_9')}
          >
            {isGeneratingHero ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">{generationStep}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate
              </div>
            )}
          </Button>
        </div>

        {/* Admin Action Buttons */}
        {isAdmin && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Admin Actions</h4>
            
            <div className="grid grid-cols-3 gap-2">
              <BlogPostButton post={post} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGeneratePrompt(post)}
                className="flex-1"
                title="Generate Prompt"
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
              {onGenerateVoiceover ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGenerateVoiceover(post)}
                  className="flex-1"
                  title="Generate Voiceover Script"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled
                  title="Voiceover not available"
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <BulkImageGenerationButton
                post={post}
                onPostsChange={onPostsChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPhotos(!showPhotos)}
                className="flex-1"
                title={showPhotos ? "Hide photo uploads" : "Show photo uploads"}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVideos(!showVideos)}
                className="flex-1"
                title={showVideos ? "Hide video uploads" : "Show video uploads"}
              >
                <Video className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Photos Section */}
        {showPhotos && (
          <div id="photos-section" className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Photo Uploads</h4>
            <div className="grid grid-cols-2 gap-3">
              <PostImageUploadCard
                post={post}
                type="16_9"
                label="Landscape (16:9)"
                imageUrl={post.image_16_9_url || undefined}
                isUploading={uploadingStates[`${post.id}_16_9`] || false}
                onImageDelete={onImageDelete}
                onImageGenerated={onImageGenerated}
              />
              <PostImageUploadCard
                post={post}
                type="9_16"
                label="Portrait (9:16)"
                imageUrl={post.image_9_16_url || undefined}
                isUploading={uploadingStates[`${post.id}_9_16`] || false}
                onImageDelete={onImageDelete}
                onImageGenerated={onImageGenerated}
              />
              <PostImageUploadCard
                post={post}
                type="3_4"
                label="Social (3:4)"
                imageUrl={post.image_3_4_url || undefined}
                isUploading={uploadingStates[`${post.id}_3_4`] || false}
                onImageDelete={onImageDelete}
                onImageGenerated={onImageGenerated}
              />
              <PostImageUploadCard
                post={post}
                type="4_3"
                label="Standard (4:3)"
                imageUrl={post.image_4_3_url || undefined}
                isUploading={uploadingStates[`${post.id}_4_3`] || false}
                onImageDelete={onImageDelete}
                onImageGenerated={onImageGenerated}
              />
            </div>
          </div>
        )}

        {/* Videos Section */}
        {showVideos && (
          <div id="videos-section" className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Video Uploads</h4>
            <div className="grid grid-cols-1 gap-3">
              <VideoUploadCard
                title="16:9 Video (Landscape)"
                aspectRatio="16/9"
                videoUrl={post.image_16_9_video_url || undefined}
                onVideoUpload={(url) => onVideoUpload(post.id, url, '16_9_video')}
                onVideoRemove={() => onVideoRemove(post.id, '16_9_video')}
              />
              <VideoUploadCard
                title="3:4 Video (Portrait)"
                aspectRatio="3/4"
                videoUrl={post.image_3_4_video_url || undefined}
                onVideoUpload={(url) => onVideoUpload(post.id, url, '3_4_video')}
                onVideoRemove={() => onVideoRemove(post.id, '3_4_video')}
              />
              <VideoUploadCard
                title="General Video"
                aspectRatio="16/9"
                videoUrl={post.general_video_url || undefined}
                onVideoUpload={(url) => onVideoUpload(post.id, url, 'general_video')}
                onVideoRemove={() => onVideoRemove(post.id, 'general_video')}
              />
              
            </div>
          </div>
        )}

        {/* Media Previews - Show any existing images or videos */}
        {isAdmin && (post.image_16_9_url || post.image_9_16_url || post.image_3_4_url || post.image_4_3_url || post.image_16_9_video_url || post.image_3_4_video_url || post.general_video_url) && !showPhotos && !showVideos && (
          <div className="flex gap-2 overflow-x-auto">
            {post.image_16_9_url && (
              <ImageHoverOverlay
                onView={() => navigate(`/stories/post/${post.id}`)}
                onDelete={() => onImageDelete(post.id, '16_9')}
                imageUrl={post.image_16_9_url}
                showUpload={false}
                className="flex-shrink-0"
              >
                <img
                  src={post.image_16_9_url}
                  alt="16:9 image"
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  loading="lazy"
                  onClick={() => navigate(`/stories/post/${post.id}`)}
                />
              </ImageHoverOverlay>
            )}
            {post.image_9_16_url && (
              <ImageHoverOverlay
                onView={() => navigate(`/stories/post/${post.id}`)}
                onDelete={() => onImageDelete(post.id, '9_16')}
                imageUrl={post.image_9_16_url}
                showUpload={false}
                className="flex-shrink-0"
              >
                <img
                  src={post.image_9_16_url}
                  alt="9:16 image"
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  loading="lazy"
                  onClick={() => navigate(`/stories/post/${post.id}`)}
                />
              </ImageHoverOverlay>
            )}
            {post.image_3_4_url && (
              <ImageHoverOverlay
                onView={() => navigate(`/stories/post/${post.id}`)}
                onDelete={() => onImageDelete(post.id, '3_4')}
                imageUrl={post.image_3_4_url}
                showUpload={false}
                className="flex-shrink-0"
              >
                <img
                  src={post.image_3_4_url}
                  alt="3:4 image"
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  loading="lazy"
                  onClick={() => navigate(`/stories/post/${post.id}`)}
                />
              </ImageHoverOverlay>
            )}
            {post.image_4_3_url && (
              <ImageHoverOverlay
                onView={() => navigate(`/stories/post/${post.id}`)}
                onDelete={() => onImageDelete(post.id, '4_3')}
                imageUrl={post.image_4_3_url}
                showUpload={false}
                className="flex-shrink-0"
              >
                <img
                  src={post.image_4_3_url}
                  alt="4:3 image"
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  loading="lazy"
                  onClick={() => navigate(`/stories/post/${post.id}`)}
                />
              </ImageHoverOverlay>
            )}
            {post.image_16_9_video_url && (
              <div className="flex-shrink-0">
                <video
                  src={post.image_16_9_video_url}
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowGallery(true)}
                />
              </div>
            )}
            {post.image_3_4_video_url && (
              <div className="flex-shrink-0">
                <video
                  src={post.image_3_4_video_url}
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowGallery(true)}
                />
              </div>
            )}
            {post.general_video_url && (
              <div className="flex-shrink-0">
                <video
                  src={post.general_video_url}
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowGallery(true)}
                />
              </div>
            )}
          </div>
        )}

        {/* Gallery Modal */}
        <PostMediaGalleryModal
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          post={post}
        />

        {/* Image Preview Modal */}
        {previewImage && (
          <ImagePreviewModal
            isOpen={true}
            onClose={() => setPreviewImage(null)}
            imageUrl={previewImage.url}
            imageAlt={previewImage.alt}
          />
        )}
        
        {/* Story Telling Modal */}
        <StoryTellingModal
          isOpen={showStoryTellingModal}
          onClose={() => setShowStoryTellingModal(false)}
          post={{
            id: post.id,
            title: post.title,
            description: post.description,
            theme: post.category, // Use category as theme for now
            category: post.category
          }}
        />
      </CardContent>
    </Card>
  );
};

// Memoized component to prevent unnecessary re-renders
export const PostCard = memo(PostCardComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.title === nextProps.post.title &&
    prevProps.post.description === nextProps.post.description &&
    prevProps.post.status === nextProps.post.status &&
    prevProps.post.image_16_9_url === nextProps.post.image_16_9_url &&
    prevProps.post.image_9_16_url === nextProps.post.image_9_16_url &&
    prevProps.post.image_3_4_url === nextProps.post.image_3_4_url &&
    prevProps.post.image_4_3_url === nextProps.post.image_4_3_url &&
    
    prevProps.post.day === nextProps.post.day &&
    prevProps.draftIndex === nextProps.draftIndex &&
    JSON.stringify(prevProps.uploadingStates) === JSON.stringify(nextProps.uploadingStates)
  );
});