import React, { useState, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useColorTheme } from '@/hooks/useColorThemes';

import { PostCardHeader } from './PostCardHeader';
import { PostCardHeroImage } from './PostCardHeroImage';
import { PostCardAdminSection } from './PostCardAdminSection';
import { PostCardMediaPreview } from './PostCardMediaPreview';
import { PostMediaGalleryModal } from './PostMediaGalleryModal';
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
  processingStates,
  completingPosts,
  isGenerating: isGeneratingProp,
  onGenerateImage,
  onPreviewImage,
  isAdmin = false
}: PostCardProps) => {
  const { toast } = useToast();
  
  const { data: colorTheme } = useColorTheme(post.color_theme_id || '');
  
  const [showGallery, setShowGallery] = useState(false);
  const [showStoryTellingModal, setShowStoryTellingModal] = useState(false);
  
  const isProcessing = (aspectRatio?: '16_9' | '9_16' | '3_4' | '4_3' | '1_1'): boolean => {
    if (aspectRatio) {
      return processingStates[`${post.id}_${aspectRatio}`] || false;
    }
    return Object.keys(processingStates).some(key => key.startsWith(`${post.id}_`));
  };

  const handleStatusChange = (postId: string, status: "published" | "scheduled" | "draft") => {
    onStatusChange(postId, status);
    toast({
      title: "Status Updated",
      description: "Post marked as published",
    });
  };


  return (
    <Card className="w-full">
      <PostCardHeroImage
        post={post}
        colorTheme={colorTheme}
        isProcessing={isProcessing('1_1')}
        onGenerateImage={onGenerateImage}
        onPreviewImage={onPreviewImage}
      />
      
      <PostCardHeader
        post={post}
        isAdmin={isAdmin}
        colorTheme={colorTheme}
        onCopy={onCopy}
        onDelete={onDelete}
        onStatusChange={handleStatusChange}
        onStoryTelling={() => setShowStoryTellingModal(true)}
      />
      
      <CardContent className="space-y-4">
        {/* Admin Section */}
        {isAdmin && (
          <PostCardAdminSection
            post={post}
            processingStates={processingStates}
            onGeneratePrompt={onGeneratePrompt}
            onGenerateVoiceover={onGenerateVoiceover}
            onVideoUpload={onVideoUpload}
            onVideoRemove={onVideoRemove}
            onImageDelete={onImageDelete}
            onImageGenerated={onImageGenerated}
            onPostsChange={onPostsChange}
            themeId={post.theme_id}
          />
        )}

        {/* Media Previews */}
        <PostCardMediaPreview
          post={post}
          isAdmin={isAdmin}
          showPhotos={false}
          showVideos={false}
          onImageDelete={onImageDelete}
          onShowGallery={() => setShowGallery(true)}
        />

        {/* Gallery Modal */}
        <PostMediaGalleryModal
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          post={post}
        />

        {/* Story Telling Modal */}
        <StoryTellingModal
          isOpen={showStoryTellingModal}
          onClose={() => setShowStoryTellingModal(false)}
          post={{
            id: post.id,
            title: post.title,
            description: post.description,
            theme: post.category,
            category: post.category
          }}
        />
      </CardContent>
    </Card>
  );
};

// Optimized memo comparison
export const PostCard = memo(PostCardComponent, (prevProps, nextProps) => {
  // Basic equality checks
  if (
    prevProps.isAdmin !== nextProps.isAdmin ||
    prevProps.post.id !== nextProps.post.id ||
    prevProps.post.title !== nextProps.post.title ||
    prevProps.post.description !== nextProps.post.description ||
    prevProps.post.status !== nextProps.post.status ||
    prevProps.post.day !== nextProps.post.day ||
    prevProps.draftIndex !== nextProps.draftIndex ||
    prevProps.post.color_theme_id !== nextProps.post.color_theme_id
  ) {
    return false;
  }

  // Check image URLs
  const imageFields = ['image_16_9_url', 'image_9_16_url', 'image_3_4_url', 'image_4_3_url', 'image_1_1_url', 'image_16_9_video_url', 'image_3_4_video_url', 'general_video_url'] as const;
  for (const field of imageFields) {
    if (prevProps.post[field] !== nextProps.post[field]) {
      return false;
    }
  }

  // Check processing states more efficiently
  const prevProcessingKeys = Object.keys(prevProps.processingStates).filter(key => key.startsWith(`${prevProps.post.id}_`));
  const nextProcessingKeys = Object.keys(nextProps.processingStates).filter(key => key.startsWith(`${nextProps.post.id}_`));
  
  if (prevProcessingKeys.length !== nextProcessingKeys.length) {
    return false;
  }

  for (const key of prevProcessingKeys) {
    if (prevProps.processingStates[key] !== nextProps.processingStates[key]) {
      return false;
    }
  }

  return true;
});