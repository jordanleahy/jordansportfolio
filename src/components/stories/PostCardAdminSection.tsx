import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Lightbulb, Mic, BookOpen, Video } from 'lucide-react';
import { BlogPostButton } from './BlogPostButton';
import { LibraryChipButton } from './LibraryChipButton';
import { BulkImageGenerationButton } from './BulkImageGenerationButton';
import { PostImageUploadCard } from './PostImageUploadCard';
import VideoUploadCard from './VideoUploadCard';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { PostCardProps } from '@/types/stories/ui';

interface PostCardAdminSectionProps {
  post: SocialMediaPost;
  processingStates: PostCardProps['processingStates'];
  onGeneratePrompt: (post: SocialMediaPost) => void;
  onGenerateVoiceover?: (post: SocialMediaPost) => void;
  onVideoUpload: (postId: string, url: string, type: string) => void;
  onVideoRemove: (postId: string, type: string) => void;
  onImageDelete: (postId: string, aspectRatio: string) => void;
  onImageGenerated: (postId: string, aspectRatio: string, imageUrl: string) => void;
  onPostsChange?: () => void;
}

export const PostCardAdminSection: React.FC<PostCardAdminSectionProps> = ({
  post,
  processingStates,
  onGeneratePrompt,
  onGenerateVoiceover,
  onVideoUpload,
  onVideoRemove,
  onImageDelete,
  onImageGenerated,
  onPostsChange
}) => {
  const { getCreditStatus, getBlockingMessage } = useCreditCheck();
  const creditStatus = getCreditStatus();
  
  const [showPhotos, setShowPhotos] = useState(false);
  const [showVideos, setShowVideos] = useState(false);

  const handleImageGenerationStart = (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3' | '1_1') => {
    // This is handled by the parent component through processingStates
  };

  const handleImageGenerationEnd = (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3' | '1_1') => {
    // This is handled by the parent component through processingStates
  };

  const handleImageGenerated = (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3' | '1_1', imageUrl: string) => {
    onImageGenerated(postId, aspectRatio, imageUrl);
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <h4 className="text-sm font-medium text-muted-foreground">Admin Actions</h4>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1">
          <LibraryChipButton post={post} />
          <BlogPostButton post={post} />
        </div>
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
          title={!creditStatus.hasCredits ? getBlockingMessage(creditStatus) : creditStatus.isLoading ? "Checking credits..." : (showPhotos ? "Hide image generation" : "Show image generation")}
          disabled={creditStatus.isLoading || !creditStatus.hasCredits}
        >
          <ImageIcon className={`h-4 w-4 ${(!creditStatus.hasCredits || creditStatus.isLoading) ? 'opacity-50' : ''}`} />
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

      {/* Photos Section */}
      {showPhotos && (
        <div id="photos-section" className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Image Generation</h4>
          
          {/* Reference Image */}
          <div className="mb-4">
            <img 
              src="/lovable-uploads/2a5cd48f-398c-4b72-893e-fe8f28261daf.png" 
              alt="Image generation reference" 
              className="w-full max-w-md rounded-lg border"
            />
          </div>

          {/* Primary card - 1:1 Square (default/cheapest) */}
          <div className="mb-3">
            <PostImageUploadCard
              post={post}
              type="1_1"
              label="Square (1:1) - Default"
              imageUrl={post.image_1_1_url || undefined}
              isUploading={processingStates[`${post.id}_1_1`]}
              onImageDelete={onImageDelete}
              onImageGenerated={handleImageGenerated}
              onGenerationStart={handleImageGenerationStart}
              onGenerationEnd={handleImageGenerationEnd}
            />
          </div>

          {/* Additional formats - top row */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <PostImageUploadCard
              post={post}
              type="16_9"
              label="Landscape (16:9)"
              imageUrl={post.image_16_9_url || undefined}
              isUploading={processingStates[`${post.id}_16_9`]}
              onImageDelete={onImageDelete}
              onImageGenerated={handleImageGenerated}
              onGenerationStart={handleImageGenerationStart}
              onGenerationEnd={handleImageGenerationEnd}
            />
            <PostImageUploadCard
              post={post}
              type="9_16"
              label="Portrait (9:16)"
              imageUrl={post.image_9_16_url || undefined}
              isUploading={processingStates[`${post.id}_9_16`]}
              onImageDelete={onImageDelete}
              onImageGenerated={handleImageGenerated}
              onGenerationStart={handleImageGenerationStart}
              onGenerationEnd={handleImageGenerationEnd}
            />
            <PostImageUploadCard
              post={post}
              type="3_4"
              label="Social (3:4)"
              imageUrl={post.image_3_4_url || undefined}
              isUploading={processingStates[`${post.id}_3_4`]}
              onImageDelete={onImageDelete}
              onImageGenerated={handleImageGenerated}
              onGenerationStart={handleImageGenerationStart}
              onGenerationEnd={handleImageGenerationEnd}
            />
          </div>

          {/* Bottom row - 1 column */}
          <div className="grid grid-cols-1 gap-3">
            <PostImageUploadCard
              post={post}
              type="4_3"
              label="Standard (4:3)"
              imageUrl={post.image_4_3_url || undefined}
              isUploading={processingStates[`${post.id}_4_3`]}
              onImageDelete={onImageDelete}
              onImageGenerated={handleImageGenerated}
              onGenerationStart={handleImageGenerationStart}
              onGenerationEnd={handleImageGenerationEnd}
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
    </div>
  );
};