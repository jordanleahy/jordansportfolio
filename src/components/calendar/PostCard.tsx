import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ImageHoverOverlay } from '@/components/ui/image-hover-overlay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Trash2, ImageIcon, Upload, Loader2, Lightbulb, ChevronDown, ChevronUp, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImagePreviewModal } from './ImagePreviewModal';
import VideoUploadCard from './VideoUploadCard';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostCardProps {
  post: SocialMediaPost;
  onCopy: (post: SocialMediaPost) => void;
  onDelete: (postId: string) => void;
  onGeneratePrompt: (post: SocialMediaPost) => void;
  onFileSelect: (postId: string, event: React.ChangeEvent<HTMLInputElement>, type: '16_9' | '9_16' | '3_4' | '4_3') => void;
  onVideoUpload: (postId: string, url: string, type: '16_9_video' | '3_4_video' | 'general_video') => void;
  onVideoRemove: (postId: string, type: '16_9_video' | '3_4_video' | 'general_video') => void;
  onStatusChange: (postId: string, newStatus: 'draft' | 'scheduled' | 'published') => void;
  uploadingStates: {
    [key: string]: boolean;
  };
}

export const PostCard = ({ 
  post, 
  onCopy, 
  onDelete, 
  onGeneratePrompt, 
  onFileSelect, 
  onVideoUpload,
  onVideoRemove,
  onStatusChange,
  uploadingStates 
}: PostCardProps) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showVideos, setShowVideos] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);

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

  const ImageUploadButton = ({ type, label, isUploading }: { 
    type: '16_9' | '9_16' | '3_4' | '4_3'; 
    label: string; 
    isUploading: boolean;
  }) => {
    const imageUrl = type === '16_9' ? post.image_16_9_url :
                    type === '9_16' ? post.image_9_16_url :
                    type === '3_4' ? post.image_3_4_url :
                    post.image_4_3_url;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{label}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={isUploading}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => onFileSelect(post.id, e as any, type);
              input.click();
            }}
          >
            {isUploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
          </Button>
        </div>
        {imageUrl && (
          <div className="relative">
            <OptimizedImage
              src={imageUrl}
              alt={`${label} for ${post.title}`}
              className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setPreviewImage({ url: imageUrl, alt: `${label} for ${post.title}` })}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
            <Badge 
              className={`${getStatusColor(post.status)} mt-2 text-xs cursor-pointer hover:opacity-80 transition-opacity`}
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
            {isExpanded ? post.description : truncateText(post.description, 120)}
          </p>
          {post.description.length > 120 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-auto p-0 mt-1 text-xs text-primary"
            >
              {isExpanded ? (
                <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
              ) : (
                <>Read more <ChevronDown className="h-3 w-3 ml-1" /></>
              )}
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGeneratePrompt(post)}
            className="w-full"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Generate Prompt
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPhotos(!showPhotos)}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Photos
              {showPhotos ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVideos(!showVideos)}
              className="flex-1"
            >
              <Video className="h-4 w-4 mr-2" />
              Videos
              {showVideos ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </Button>
          </div>
        </div>

        {/* Photos Section */}
        {showPhotos && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Photo Uploads</h4>
            <div className="grid grid-cols-2 gap-3">
              <ImageUploadButton 
                type="16_9" 
                label="Landscape (16:9)" 
                isUploading={uploadingStates[`${post.id}_16_9`] || false} 
              />
              <ImageUploadButton 
                type="9_16" 
                label="Portrait (9:16)" 
                isUploading={uploadingStates[`${post.id}_9_16`] || false} 
              />
              <ImageUploadButton 
                type="3_4" 
                label="Social (3:4)" 
                isUploading={uploadingStates[`${post.id}_3_4`] || false} 
              />
              <ImageUploadButton 
                type="4_3" 
                label="Standard (4:3)" 
                isUploading={uploadingStates[`${post.id}_4_3`] || false} 
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
                onView={() => setPreviewImage({ url: post.image_16_9_url!, alt: "16:9 image for " + post.title })}
                imageUrl={post.image_16_9_url}
                showUpload={false}
                className="flex-shrink-0"
              >
                <OptimizedImage
                  src={post.image_16_9_url}
                  alt="16:9 image"
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                />
              </ImageHoverOverlay>
            )}
            {post.image_9_16_url && (
              <ImageHoverOverlay
                onView={() => setPreviewImage({ url: post.image_9_16_url!, alt: "16:9 video for " + post.title })}
                imageUrl={post.image_9_16_url}
                showUpload={false}
                className="flex-shrink-0"
              >
                <OptimizedImage
                  src={post.image_9_16_url}
                  alt="16:9 video"
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                />
              </ImageHoverOverlay>
            )}
            {post.image_3_4_url && (
              <ImageHoverOverlay
                onView={() => setPreviewImage({ url: post.image_3_4_url!, alt: "3:4 image for " + post.title })}
                imageUrl={post.image_3_4_url}
                showUpload={false}
                className="flex-shrink-0"
              >
                <OptimizedImage
                  src={post.image_3_4_url}
                  alt="3:4 image"
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                />
              </ImageHoverOverlay>
            )}
            {post.image_4_3_url && (
              <ImageHoverOverlay
                onView={() => setPreviewImage({ url: post.image_4_3_url!, alt: "3:4 video for " + post.title })}
                imageUrl={post.image_4_3_url}
                showUpload={false}
                className="flex-shrink-0"
              >
                <OptimizedImage
                  src={post.image_4_3_url}
                  alt="3:4 video"
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                />
              </ImageHoverOverlay>
            )}
            {post.image_16_9_video_url && (
              <div className="flex-shrink-0">
                <video
                  src={post.image_16_9_video_url}
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setPreviewImage({ url: post.image_16_9_video_url!, alt: "16:9 video for " + post.title })}
                />
              </div>
            )}
            {post.image_3_4_video_url && (
              <div className="flex-shrink-0">
                <video
                  src={post.image_3_4_video_url}
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setPreviewImage({ url: post.image_3_4_video_url!, alt: "3:4 video for " + post.title })}
                />
              </div>
            )}
            {post.general_video_url && (
              <div className="flex-shrink-0">
                <video
                  src={post.general_video_url}
                  className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setPreviewImage({ url: post.general_video_url!, alt: "General video for " + post.title })}
                />
              </div>
            )}
          </div>
        )}

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