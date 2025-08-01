import React, { useState } from 'react';
import { Loader2, Sparkles, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPost } from '@/types/socialMedia';
import { useBulkImageGeneration } from '@/hooks/useImageBatchGeneration';
import { useProcessingStates } from '@/hooks/useProcessingStates';
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
  const [isExpanded, setIsExpanded] = useState(false);

  const handleButtonClick = () => {
    if (!isExpanded && !isGenerating(post.id)) {
      // First click: expand to show confirmation
      setIsExpanded(true);
      console.log(`✨ [BulkGeneration] Expanding confirmation for post: ${post.id}`);
    }
  };

  const handleConfirmGeneration = async () => {
    if (!post) return;
    
    console.log(`🚀 [BulkGeneration] Starting bulk generation for post: ${post.id}`);
    
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
      
      // Close expansion after generation
      setIsExpanded(false);
      
    } catch (error) {
      console.error('❌ Optimized batch generation error:', error);
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    console.log(`❌ [BulkGeneration] Cancelled for post: ${post.id}`);
  };


  console.log('BulkImageGenerationButton rendered'); // Force re-compilation
  return (
    <>
      <Button
        onClick={handleButtonClick}
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
      
      {/* Expandable Confirmation Area */}
      {isExpanded && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* 4 Skeleton Grid - 2x2 layout */}
          <div className="grid grid-cols-2 gap-2">
            <div className="aspect-video">
              <Skeleton className="w-full h-full rounded border" />
            </div>
            <div className="aspect-[9/16]">
              <Skeleton className="w-full h-full rounded border" />
            </div>
            <div className="aspect-[4/3]">
              <Skeleton className="w-full h-full rounded border" />
            </div>
            <div className="aspect-[3/4]">
              <Skeleton className="w-full h-full rounded border" />
            </div>
          </div>
          
          {/* Confirmation Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleConfirmGeneration}
              disabled={isGenerating(post.id)}
              size="sm"
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Generate Images
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isGenerating(post.id)}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};