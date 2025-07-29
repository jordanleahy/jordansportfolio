import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImagePromptModal } from './ImagePromptModal';
import { ImageWatermarkModal } from './ImageWatermarkModal';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';
import { PostCard } from './PostCard';
import { PostsTableView } from './PostsTableView';
import { VoiceoverScriptModal } from '@/components/voiceover/VoiceoverScriptModal';
import { useModalManager } from '@/hooks/useModalManager';
import { usePostActions } from '@/hooks/usePostActions';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostsTableOptimizedProps {
  posts: SocialMediaPost[];
  onPostsChange: () => void;
  isAdmin?: boolean;
}

export const PostsTable = ({ posts, onPostsChange, isAdmin = false }: PostsTableOptimizedProps) => {
  const [activeTab, setActiveTab] = useState<'draft' | 'published'>('draft');
  const isMobile = useIsMobile();
  
  // Custom hooks for better separation of concerns
  const modalManager = useModalManager();
  const postActions = usePostActions(onPostsChange);
  const imageUpload = useImageUpload(onPostsChange);

  // Memoized filtered posts for performance - use posts prop directly
  const { draftPosts, publishedPosts, filteredPosts } = useMemo(() => {
    const draftPosts = posts.filter(post => post.status === 'draft');
    const publishedPosts = posts.filter(post => post.status === 'published');
    const filteredPosts = activeTab === 'draft' ? draftPosts : publishedPosts;
    return { draftPosts, publishedPosts, filteredPosts };
  }, [posts, activeTab]);

  // Handle watermark upload completion
  const handleWatermarkedUpload = async (watermarkedFile: File) => {
    if (!imageUpload.selectedPostId) {
      return;
    }

    const post = posts.find(p => p.id === imageUpload.selectedPostId);
    await imageUpload.handleUpload(imageUpload.selectedPostId, watermarkedFile, imageUpload.uploadType, post);
    modalManager.closeWatermarkModal();
  };

  // Handle file selection with watermark modal
  const handleFileSelect = (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', file: File) => {
    const post = posts.find(p => p.id === postId);
    imageUpload.setSelectedPostId(postId);
    imageUpload.setSelectedFile(file);
    imageUpload.setUploadType(aspectRatio);
    modalManager.openWatermarkModal();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'draft' | 'published')}>
          <TabsList>
            <TabsTrigger value="draft">
              Draft ({draftPosts.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              Published ({publishedPosts.length})
            </TabsTrigger>
          </TabsList>

           <TabsContent value="draft">
            {isMobile ? (
              <div className="space-y-4">
                {filteredPosts.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    draftIndex={post.status === 'draft' ? index + 1 : undefined}
                    onCopy={postActions.handleCopyContent}
                    onDelete={postActions.handleDeletePost}
                    onGeneratePrompt={modalManager.openImagePromptModal}
                    onGenerateVoiceover={modalManager.openVoiceoverModal}
                    onFileSelect={(postId, event, type) => {
                      const file = event.target.files?.[0];
                      if (file) handleFileSelect(postId, type, file);
                    }}
                    onVideoUpload={() => {}}
                    onVideoRemove={() => {}}
                    onImageDelete={() => {}}
                    onStatusChange={postActions.handleStatusChange}
                    uploadingStates={{}}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            ) : (
              <PostsTableView
                posts={filteredPosts}
                activeTab={activeTab}
                creatingBlogIds={postActions.creatingBlogIds}
                isUploading={imageUpload.isUploading}
                getUploadType={imageUpload.getUploadType}
                onStatusChange={postActions.handleStatusChange}
                onCopyContent={postActions.handleCopyContent}
                onDeletePost={postActions.handleDeletePost}
                onCreateBlogPost={postActions.handleCreateBlogPost}
                onGenerateVoiceoverScript={modalManager.openVoiceoverModal}
                onGenerateImagePrompt={modalManager.openImagePromptModal}
                onFileSelect={imageUpload.handleFileSelect}
                onPreviewImage={modalManager.openPreviewImage}
                isAdmin={isAdmin}
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
                  onCopy={postActions.handleCopyContent}
                  onDelete={postActions.handleDeletePost}
                  onGeneratePrompt={modalManager.openImagePromptModal}
                  onGenerateVoiceover={modalManager.openVoiceoverModal}
                  onFileSelect={(postId, event, type) => {
                    const file = event.target.files?.[0];
                    if (file) handleFileSelect(postId, type, file);
                  }}
                  onVideoUpload={() => {}}
                  onVideoRemove={() => {}}
                  onImageDelete={() => {}}
                  onStatusChange={postActions.handleStatusChange}
                  uploadingStates={{}}
                  isAdmin={isAdmin}
                />
                ))}
              </div>
            ) : (
              <PostsTableView
                posts={filteredPosts}
                activeTab={activeTab}
                creatingBlogIds={postActions.creatingBlogIds}
                isUploading={imageUpload.isUploading}
                getUploadType={imageUpload.getUploadType}
                onStatusChange={postActions.handleStatusChange}
                onCopyContent={postActions.handleCopyContent}
                onDeletePost={postActions.handleDeletePost}
                onCreateBlogPost={postActions.handleCreateBlogPost}
                onGenerateVoiceoverScript={modalManager.openVoiceoverModal}
                onGenerateImagePrompt={modalManager.openImagePromptModal}
                onFileSelect={imageUpload.handleFileSelect}
                onPreviewImage={modalManager.openPreviewImage}
                isAdmin={isAdmin}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <ImagePromptModal
          isOpen={modalManager.imagePromptModal.isOpen}
          onClose={modalManager.closeImagePromptModal}
          postId={modalManager.imagePromptModal.postId}
          title={modalManager.imagePromptModal.title}
          description={modalManager.imagePromptModal.description}
          cachedPrompt={modalManager.imagePromptModal.cachedPrompt}
          category={modalManager.imagePromptModal.category}
        />

        <ImageWatermarkModal
          isOpen={modalManager.showWatermarkModal}
          onClose={() => {
            modalManager.closeWatermarkModal();
            // Clear selected state to prevent stale references
            imageUpload.setSelectedPostId(null);
            imageUpload.setSelectedFile(null);
          }}
          file={imageUpload.selectedFile}
          onConfirm={handleWatermarkedUpload}
        />

        {modalManager.previewImage && (
          <ImagePreviewModal
            isOpen={!!modalManager.previewImage}
            onClose={modalManager.closePreviewImage}
            imageUrl={modalManager.previewImage.url}
            alt={modalManager.previewImage.alt}
          />
        )}

        {modalManager.voiceoverModal.isOpen && modalManager.voiceoverModal.post && (
          <VoiceoverScriptModal
            isOpen={modalManager.voiceoverModal.isOpen}
            onClose={modalManager.closeVoiceoverModal}
            sourceId={modalManager.voiceoverModal.post.id}
            sourceType="social_media_post"
            originalContent={`${modalManager.voiceoverModal.post.title}\n\n${modalManager.voiceoverModal.post.description}`}
          />
        )}
      </CardContent>
    </Card>
  );
};