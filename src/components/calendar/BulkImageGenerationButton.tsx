import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
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
  const { isGenerating, setBulkProcessing } = useProcessingStates();
  
  // Advanced debug logging
  console.log('🔍 [BulkImageButton] Post:', post.id, 'isGenerating:', isGenerating(post.id));
  console.log('🔍 [BulkImageButton] Progress:', progress);
  console.log('🔍 [BulkImageButton] Button disabled:', isGenerating(post.id) || isUploading(post.id));
  
  const isCurrentlyGenerating = isGenerating(post.id);
  const isCurrentlyUploading = isUploading(post.id);
  
  console.log('🔍 [BulkImageButton] States - generating:', isCurrentlyGenerating, 'uploading:', isCurrentlyUploading);

  const handleGenerateAllImages = async () => {
    if (!post) {
      console.log('❌ [BulkImageButton] No post provided');
      return;
    }
    
    try {
      console.log('🚀 [BulkImageButton] STARTING generation for post:', post.id);
      console.log('🚀 [BulkImageButton] Post data:', { id: post.id, title: post.title, category: post.category });
      
      // Set processing state immediately for visual feedback
      console.log('⏳ [BulkImageButton] Setting bulk processing to TRUE');
      setBulkProcessing(post.id, true);
      
      // Force a small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('⏳ [BulkImageButton] After delay - isGenerating:', isGenerating(post.id));
      
      const request: BulkImageGenerationRequest = {
        postId: post.id,
        title: post.title,
        description: post.description,
        category: post.category,
        context: 'table',
        colorThemeId: post.color_theme_id || undefined
      };

      console.log('📡 [BulkImageButton] Calling generateAllImages with request:', request);
      const response = await generateAllImages(request);
      console.log('📡 [BulkImageButton] Got response:', response);

      // Refresh the post data to show the new images
      if (response.success && onPostsChange) {
        console.log('🔄 [BulkImageButton] Refreshing posts data');
        const { data: refreshedPosts } = await supabase
          .from('social_media_posts')
          .select('*')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .order('day', { ascending: true });
        
        if (refreshedPosts) {
          console.log('🔄 [BulkImageButton] Updated posts data with', refreshedPosts.length, 'posts');
          onPostsChange(refreshedPosts as SocialMediaPost[]);
        }
      } else {
        console.log('⚠️ [BulkImageButton] Skipping refresh - success:', response.success, 'onPostsChange:', !!onPostsChange);
      }
      
    } catch (error) {
      console.error('❌ [BulkImageButton] Generation error:', error);
      console.error('❌ [BulkImageButton] Error stack:', error.stack);
    } finally {
      // Clear processing state when done
      console.log('🏁 [BulkImageButton] Setting bulk processing to FALSE');
      setBulkProcessing(post.id, false);
      console.log('✅ [BulkImageButton] Generation completed for post:', post.id);
      
      // Force another delay to ensure state clears
      setTimeout(() => {
        console.log('🏁 [BulkImageButton] Final check - isGenerating:', isGenerating(post.id));
      }, 100);
    }
  };

  return (
    <>
      <Button
        onClick={handleGenerateAllImages}
        disabled={isCurrentlyGenerating || isCurrentlyUploading}
        variant="outline"
        size="sm"
        className="h-8 flex-1"
        title="Generate All Images with AI"
      >
        {isCurrentlyGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </Button>
      
      {/* Skeleton Grid - shown during generation */}
      {(() => {
        const showShimmer = isCurrentlyGenerating;
        console.log('👻 [BulkImageButton] Shimmer decision - showing:', showShimmer, 'for post:', post.id);
        if (showShimmer) {
          console.log('👻 [BulkImageButton] RENDERING SHIMMER GRID');
        }
        return showShimmer ? (
          <div className="mt-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 w-full">
                <Skeleton className="w-full h-full rounded border" />
              </div>
              <div className="h-16 w-full">
                <Skeleton className="w-full h-full rounded border" />
              </div>
              <div className="h-16 w-full">
                <Skeleton className="w-full h-full rounded border" />
              </div>
              <div className="h-16 w-full">
                <Skeleton className="w-full h-full rounded border" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Generating images... {progress.currentAspectRatio || 'Preparing'}
            </p>
          </div>
        ) : null;
      })()}
    </>
  );
};