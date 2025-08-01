import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPost } from '@/types/socialMedia';
import { useBulkImageGeneration } from '@/hooks/useImageBatchGeneration';
import { useProcessingStates } from '@/hooks/useProcessingStates';
import { BulkGenerationThumbnails } from './BulkGenerationThumbnails';
import { MobileBatchSkeleton } from './MobileBatchSkeleton';
import type { AspectRatioKey, BulkImageGenerationRequest } from '@/types/bulkImageGeneration';

interface BulkImageGenerationButtonProps {
  post: SocialMediaPost;
  isUploading: (postId: string, aspectRatio?: AspectRatioKey) => boolean;
  getUploadType: (postId: string) => AspectRatioKey | null;
  onFileSelect: (postId: string, aspectRatio: AspectRatioKey) => void;
  onPostsChange?: (posts: SocialMediaPost[]) => void;
}

export const BulkImageGenerationButton: React.FC<BulkImageGenerationButtonProps> = ({
  post,
  isUploading,
  getUploadType,
  onFileSelect,
  onPostsChange,
}) => {
  const { generateAllImages, progress } = useBulkImageGeneration();
  const { isGenerating } = useProcessingStates();
  const [showThumbnails, setShowThumbnails] = useState(false);

  const handleGenerateAllImages = async () => {
    if (!showThumbnails) {
      // First click: show thumbnails to confirm intent
      setShowThumbnails(true);
      console.log(`👆 [SimplifiedDropdown] First click - showing thumbnails for post: ${post.id}`);
      return;
    }

    // Second click: start actual generation
    setShowThumbnails(false);
    if (!post) return;
    
    console.log(`🚀 [SimplifiedDropdown] Second click - starting bulk generation for post: ${post.id}`);
    
    try {
      const request: BulkImageGenerationRequest = {
        postId: post.id,
        title: post.title,
        description: post.description,
        category: post.category,
        context: 'table'
      };

      const response = await generateAllImages(request);

      // Refresh the post data to show the new images
      if (response.success && onPostsChange) {
        const { data: refreshedPosts } = await supabase
          .from('social_media_posts')
          .select('*')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .order('day', { ascending: true });
        
        if (refreshedPosts) {
          onPostsChange(refreshedPosts as SocialMediaPost[]);
        }
      }
      
    } catch (error) {
      console.error('❌ Optimized batch generation error:', error);
    }
  };


  return (
    <>
      <Button
        onClick={() => {
          const generating = isGenerating(post.id);
          const uploading = isUploading(post.id);
          console.log(`✨ [SimplifiedDropdown] Button clicked for ${post.id} - generating: ${generating}, uploading: ${uploading}`);
          handleGenerateAllImages();
        }}
        disabled={isGenerating(post.id) || isUploading(post.id)}
        variant="outline"
        size="sm"
        className="h-8 flex-1"
        title="Generate All Images with AI"
      >
        {isGenerating(post.id) ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </Button>
      
      {/* Thumbnail Preview - shown on first click */}
      <BulkGenerationThumbnails 
        showThumbnails={showThumbnails && !isGenerating(post.id)}
        className="mt-4"
      />
      
      {/* Mobile Skeleton - shown during generation */}
      <MobileBatchSkeleton
        isGenerating={isGenerating(post.id)}
        className="mt-4"
      />
    </>
  );
};