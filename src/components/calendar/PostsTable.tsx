import { useState } from "react";
import { SocialMediaPost } from "@/types/socialMedia";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "./PostCard";
import { PostsTableView } from "./PostsTableView";
import { useIsMobile } from "@/hooks/use-mobile";
import { useModalManager } from "@/hooks/useModalManager";
import { usePostActions } from "@/hooks/usePostActions";
import { useImageManager } from "@/hooks/useImageManager";
import { useProcessingStates } from "@/hooks/useProcessingStates";
import { ImagePromptModal } from "./ImagePromptModal";
import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { VoiceoverScriptModal } from "@/components/voiceover/VoiceoverScriptModal";
import { useRowAnimations } from "@/hooks/useRowAnimations";

interface PostsTableOptimizedProps {
  posts: SocialMediaPost[];
  onPostsChange: () => void;
  isAdmin?: boolean;
}

export const PostsTable = ({ posts, onPostsChange, isAdmin = false }: PostsTableOptimizedProps) => {
  const [activeTab, setActiveTab] = useState<"draft" | "published">("draft");
  const isMobile = useIsMobile();
  
  // Animation state management
  const { 
    animatingRows, 
    completingRows, 
    handleStatusChangeWithAnimation,
    getRowAnimationClass 
  } = useRowAnimations();

  const {
    voiceoverModal,
    imagePromptModal,
    previewImage,
    openVoiceoverModal,
    closeVoiceoverModal,
    openImagePromptModal,
    closeImagePromptModal,
    openPreviewImage,
    closePreviewImage,
  } = useModalManager();

  const { 
    creatingBlogIds,
    handleStatusChange: originalHandleStatusChange,
    handleCopyContent,
    handleDeletePost,
    handleCreateBlogPost
  } = usePostActions(onPostsChange);

  // Enhanced status change with animation
  const handleStatusChange = async (postId: string, newStatus: 'draft' | 'scheduled' | 'published') => {
    await handleStatusChangeWithAnimation(postId, newStatus, originalHandleStatusChange, onPostsChange);
  };

  const {
    uploadingPosts,
    handleFileSelect,
    handleGenerateImage,
    isUploading: originalIsUploading,
    getUploadType: originalGetUploadType,
  } = useImageManager({ onPostsChange });

  // Use unified processing states
  const { isUploading: unifiedIsUploading, getUploadType: unifiedGetUploadType } = useProcessingStates();

  // Combine original upload states with unified processing states
  const isUploading = (postId: string, aspectRatio?: any) => {
    console.log(`🔍 [PostsTable] Checking upload state for ${postId}${aspectRatio ? ` (${aspectRatio})` : ''}`);
    const originalState = originalIsUploading(postId, aspectRatio);
    const unifiedState = unifiedIsUploading(postId, aspectRatio);
    const result = originalState || unifiedState;
    console.log(`🔍 [PostsTable] Upload states - original: ${originalState}, unified: ${unifiedState}, final: ${result}`);
    return result;
  };

  const getUploadType = (postId: string): any => {
    const originalType = originalGetUploadType(postId);
    const unifiedType = unifiedGetUploadType(postId);
    const result = originalType || unifiedType;
    console.log(`🔍 [PostsTable] Upload type for ${postId} - original: ${originalType}, unified: ${unifiedType}, final: ${result}`);
    return result;
  };

  // Handle image deletion with optimistic updates
  const handleImageDelete = async (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3') => {
    try {
      const updateField = `image_${aspectRatio}_url`;
      
      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Optimistic update: immediately refresh the UI
      onPostsChange();
      
      const { error } = await supabase
        .from('social_media_posts')
        .update({ [updateField]: null })
        .eq('id', postId);

      if (error) {
        throw error;
      }

      // Force another refresh to ensure consistency
      setTimeout(() => {
        onPostsChange();
      }, 100);
      
      // Show success toast
      const { toast } = await import('sonner');
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      
      // If there was an error, refresh to revert optimistic update
      onPostsChange();
      
      const { toast } = await import('sonner');
      toast.error('Failed to delete image');
    }
  };

  // Convert nested uploading states to flat format for PostCard
  const flatUploadingStates = Object.entries(uploadingPosts).reduce((acc, [postId, aspectRatios]) => {
    Object.entries(aspectRatios).forEach(([aspectRatio, isUploading]) => {
      acc[`${postId}_${aspectRatio}`] = isUploading;
    });
    return acc;
  }, {} as Record<string, boolean>);

  // Filter posts by status
  const filteredPosts = posts.filter((post) => post.status === activeTab);

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Social Media Posts</h2>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "draft" | "published")}>
          <TabsList className="mb-4">
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>

          <TabsContent value="draft">
            {isMobile ? (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onCopy={() => handleCopyContent(post)}
                    onDelete={() => handleDeletePost(post.id)}
                    onGeneratePrompt={() => openImagePromptModal(post)}
                    onGenerateVoiceover={() => openVoiceoverModal(post)}
                    onFileSelect={(postId, aspectRatio) => handleFileSelect(postId, aspectRatio, post)}
                    onVideoUpload={() => {}}
                    onVideoRemove={() => {}}
                    onImageDelete={handleImageDelete}
                    onImageGenerated={() => onPostsChange()}
                    onStatusChange={(postId, status) => handleStatusChange(postId, status)}
                    onPostsChange={onPostsChange}
                    uploadingStates={flatUploadingStates}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            ) : (
              <PostsTableView
                posts={filteredPosts}
                activeTab={activeTab}
                creatingBlogIds={creatingBlogIds}
                isUploading={isUploading}
                getUploadType={getUploadType}
                onStatusChange={handleStatusChange}
                onCopyContent={handleCopyContent}
                onDeletePost={handleDeletePost}
                onCreateBlogPost={handleCreateBlogPost}
                onGenerateVoiceoverScript={openVoiceoverModal}
                onGenerateImagePrompt={openImagePromptModal}
                onFileSelect={(postId, aspectRatio, post) => handleFileSelect(postId, aspectRatio, post)}
                onGenerateImage={handleGenerateImage}
                onPreviewImage={openPreviewImage}
                onPostsChange={onPostsChange}
                isAdmin={isAdmin}
                animatingRows={animatingRows}
                completingRows={completingRows}
                getRowAnimationClass={getRowAnimationClass}
              />
            )}
          </TabsContent>

          <TabsContent value="published">
            {isMobile ? (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onCopy={() => handleCopyContent(post)}
                    onDelete={() => handleDeletePost(post.id)}
                    onGeneratePrompt={() => openImagePromptModal(post)}
                    onGenerateVoiceover={() => openVoiceoverModal(post)}
                    onFileSelect={(postId, aspectRatio) => handleFileSelect(postId, aspectRatio, post)}
                    onVideoUpload={() => {}}
                    onVideoRemove={() => {}}
                    onImageDelete={handleImageDelete}
                    onImageGenerated={() => onPostsChange()}
                    onStatusChange={(postId, status) => handleStatusChange(postId, status)}
                    onPostsChange={onPostsChange}
                    uploadingStates={flatUploadingStates}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            ) : (
              <PostsTableView
                posts={filteredPosts}
                activeTab={activeTab}
                creatingBlogIds={creatingBlogIds}
                isUploading={isUploading}
                getUploadType={getUploadType}
                onStatusChange={handleStatusChange}
                onCopyContent={handleCopyContent}
                onDeletePost={handleDeletePost}
                onCreateBlogPost={handleCreateBlogPost}
                onGenerateVoiceoverScript={openVoiceoverModal}
                onGenerateImagePrompt={openImagePromptModal}
                onFileSelect={(postId, aspectRatio, post) => handleFileSelect(postId, aspectRatio, post)}
                onGenerateImage={handleGenerateImage}
                onPreviewImage={openPreviewImage}
                onPostsChange={onPostsChange}
                isAdmin={isAdmin}
                animatingRows={animatingRows}
                completingRows={completingRows}
                getRowAnimationClass={getRowAnimationClass}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ImagePromptModal
        isOpen={imagePromptModal.isOpen}
        onClose={closeImagePromptModal}
        postId={imagePromptModal.postId}
        title={imagePromptModal.title}
        description={imagePromptModal.description}
        cachedPrompt={imagePromptModal.cachedPrompt}
        category={imagePromptModal.category}
      />

      {previewImage && (
        <ImagePreviewModal
          isOpen={!!previewImage}
          onClose={closePreviewImage}
          imageUrl={previewImage.url}
          alt={previewImage.alt}
        />
      )}

      {voiceoverModal.isOpen && voiceoverModal.post && (
        <VoiceoverScriptModal
          isOpen={voiceoverModal.isOpen}
          onClose={closeVoiceoverModal}
          sourceId={voiceoverModal.post.id}
          sourceType="social_media_post"
          originalContent={`${voiceoverModal.post.title}\n\n${voiceoverModal.post.description}`}
        />
      )}
    </Card>
  );
};