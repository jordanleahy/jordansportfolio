import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageHoverOverlay } from '@/components/ui/image-hover-overlay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Trash2, ImageIcon, Upload, Loader2, Lightbulb, ChevronDown, ChevronUp, Video, BookOpen, Mic, Sparkles } from 'lucide-react';

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
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostCardProps {
  post: SocialMediaPost;
  draftIndex?: number;
  onCopy: (post: SocialMediaPost) => void;
  onDelete: (postId: string) => void;
  onGeneratePrompt: (post: SocialMediaPost) => void;
  onGenerateVoiceover?: (post: SocialMediaPost) => void;
  onFileSelect: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', post: SocialMediaPost) => void;
  onVideoUpload: (postId: string, url: string, type: '16_9_video' | '3_4_video' | 'general_video') => void;
  onVideoRemove: (postId: string, type: '16_9_video' | '3_4_video' | 'general_video') => void;
  onImageDelete: (postId: string, type: '16_9' | '9_16' | '3_4' | '4_3') => void;
  onImageGenerated: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', imageUrl: string) => void;
  onStatusChange: (postId: string, newStatus: 'draft' | 'scheduled' | 'published') => void;
  onPostsChange?: () => void;
  uploadingStates: {
    [key: string]: boolean;
  };
  isAdmin?: boolean;
}

const PostCardComponent = ({ 
  post, 
  draftIndex, 
  onCopy, 
  onDelete,
  onGeneratePrompt,
  onGenerateVoiceover,
  onFileSelect,
  onVideoUpload,
  onVideoRemove,
  onImageDelete,
  onImageGenerated,
  onStatusChange,
  onPostsChange,
  uploadingStates,
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

  const isUploading = (postId: string, aspectRatio?: '16_9' | '9_16' | '3_4' | '4_3') => {
    if (aspectRatio) {
      return uploadingStates[`${postId}_${aspectRatio}`] || false;
    }
    return Object.keys(uploadingStates).some(key => key.startsWith(`${postId}_`));
  };

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




  return (
    <Card className="w-full">
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
          >
            Generate
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className={`grid gap-2 ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {isAdmin && <BlogPostButton post={post} />}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGeneratePrompt(post)}
                className="flex-1"
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
            )}
            {isAdmin && onGenerateVoiceover ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onGenerateVoiceover(post);
                }}
                className="flex-1"
                title="Generate Voiceover Script"
              >
                <Mic className="h-4 w-4" />
              </Button>
            ) : isAdmin ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <BookOpen className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          
          <div className="flex gap-2">
            {isAdmin && (
              <BulkImageGenerationButton
                post={post}
                isUploading={isUploading}
                getUploadType={getUploadType}
                onFileSelect={(postId, aspectRatio) => onFileSelect(postId, aspectRatio, post)}
                onPostsChange={onPostsChange}
              />
            )}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPhotos(!showPhotos)}
                className="h-8 flex-1"
                title={showPhotos ? "Hide photos" : "Show photos"}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVideos(!showVideos)}
                className="h-8 flex-1"
              >
                <Video className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Photos Section */}
        {showPhotos && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Photo Uploads</h4>
            <div className="grid grid-cols-2 gap-3">
              <PostImageUploadCard
                post={post}
                type="16_9"
                label="Landscape (16:9)"
                imageUrl={post.image_16_9_url || undefined}
                isUploading={uploadingStates[`${post.id}_16_9`] || false}
                onFileSelect={onFileSelect}
                onImageDelete={onImageDelete}
                onImageGenerated={onImageGenerated}
              />
              <PostImageUploadCard
                post={post}
                type="9_16"
                label="Portrait (9:16)"
                imageUrl={post.image_9_16_url || undefined}
                isUploading={uploadingStates[`${post.id}_9_16`] || false}
                onFileSelect={onFileSelect}
                onImageDelete={onImageDelete}
                onImageGenerated={onImageGenerated}
              />
              <PostImageUploadCard
                post={post}
                type="3_4"
                label="Social (3:4)"
                imageUrl={post.image_3_4_url || undefined}
                isUploading={uploadingStates[`${post.id}_3_4`] || false}
                onFileSelect={onFileSelect}
                onImageDelete={onImageDelete}
                onImageGenerated={onImageGenerated}
              />
              <PostImageUploadCard
                post={post}
                type="4_3"
                label="Standard (4:3)"
                imageUrl={post.image_4_3_url || undefined}
                isUploading={uploadingStates[`${post.id}_4_3`] || false}
                onFileSelect={onFileSelect}
                onImageDelete={onImageDelete}
                onImageGenerated={onImageGenerated}
              />
            </div>
          </div>
        )}

        {/* Videos Section */}
        {showVideos && (
          <div className="border-t pt-4">
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
        {(post.image_16_9_url || post.image_9_16_url || post.image_3_4_url || post.image_4_3_url || post.image_16_9_video_url || post.image_3_4_video_url || post.general_video_url) && !showPhotos && !showVideos && (
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