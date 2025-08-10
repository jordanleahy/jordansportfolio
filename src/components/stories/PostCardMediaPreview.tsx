import React from 'react';
import { ImageHoverOverlay } from '@/components/ui/image-hover-overlay';
import { useNavigate } from 'react-router-dom';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostCardMediaPreviewProps {
  post: SocialMediaPost;
  isAdmin: boolean;
  showPhotos: boolean;
  showVideos: boolean;
  onImageDelete: (postId: string, aspectRatio: string) => void;
  onShowGallery: () => void;
}

export const PostCardMediaPreview: React.FC<PostCardMediaPreviewProps> = ({
  post,
  isAdmin,
  showPhotos,
  showVideos,
  onImageDelete,
  onShowGallery
}) => {
  const navigate = useNavigate();

  const hasAnyMedia = post.image_16_9_url || post.image_9_16_url || post.image_3_4_url || 
                     post.image_4_3_url || post.image_16_9_video_url || post.image_3_4_video_url || 
                     post.general_video_url;

  if (!isAdmin || !hasAnyMedia || showPhotos || showVideos) {
    return null;
  }

  return (
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
            onClick={onShowGallery}
          />
        </div>
      )}
      {post.image_3_4_video_url && (
        <div className="flex-shrink-0">
          <video
            src={post.image_3_4_video_url}
            className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onShowGallery}
          />
        </div>
      )}
      {post.general_video_url && (
        <div className="flex-shrink-0">
          <video
            src={post.general_video_url}
            className="h-12 w-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onShowGallery}
          />
        </div>
      )}
    </div>
  );
};