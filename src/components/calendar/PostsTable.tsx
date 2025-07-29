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
  const [localPosts, setLocalPosts] = useState<SocialMediaPost[]>(posts);
  const isMobile = useIsMobile();
  
  // Update local posts when props change
  React.useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);
  
  // Custom hooks for better separation of concerns
  const modalManager = useModalManager();
  const postActions = usePostActions(onPostsChange);
  const imageUpload = useImageUpload(posts, onPostsChange, setLocalPosts);

  // Memoized filtered posts for performance
  const { draftPosts, publishedPosts, filteredPosts } = useMemo(() => {
    const draftPosts = localPosts.filter(post => post.status === 'draft');
    const publishedPosts = localPosts.filter(post => post.status === 'published');
    const filteredPosts = activeTab === 'draft' ? draftPosts : publishedPosts;
    return { draftPosts, publishedPosts, filteredPosts };
  }, [localPosts, activeTab]);

  // Handle watermark upload completion
  const handleWatermarkedUpload = async (watermarkedFile: File) => {
    if (!imageUpload.selectedPost) {
      console.error('No selected post for upload!'); // Debug log
      return;
    }

    console.log('Uploading watermarked file for post:', imageUpload.selectedPost.title, 'ID:', imageUpload.selectedPost.id); // Debug log

    const uploadFunctions = {
      '16_9': imageUpload.handleImageUpload,
      '9_16': imageUpload.handleImage916Upload,
      '3_4': imageUpload.handleImage34Upload,
      '4_3': imageUpload.handleImage43Upload
    };

    const uploadFunction = uploadFunctions[imageUpload.uploadType];
    if (uploadFunction) {
      await uploadFunction(imageUpload.selectedPost.id, watermarkedFile);
    }

    modalManager.closeWatermarkModal();
  };

  // Handle file selection with watermark modal
  const handleFileSelect = (postId: string, event: React.ChangeEvent<HTMLInputElement>, type: '16_9' | '9_16' | '3_4' | '4_3') => {
    console.log('File selected for post ID:', postId); // Debug log
    const file = event.target.files?.[0];
    if (file) {
      // Use posts prop instead of localPosts to avoid stale state
      const post = posts.find(p => p.id === postId);
      console.log('Found post:', post?.title, 'ID:', post?.id); // Debug log
      imageUpload.setSelectedPost(post || null);
      imageUpload.setSelectedFile(file);
      imageUpload.setUploadType(type);
      modalManager.openWatermarkModal();
    }
    
    if (event.target) {
      event.target.value = '';
    }
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
                    onFileSelect={handleFileSelect}
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
                uploadingPostId={imageUpload.uploadingPostId}
                uploading916PostId={imageUpload.uploading916PostId}
                uploading34PostId={imageUpload.uploading34PostId}
                uploading43PostId={imageUpload.uploading43PostId}
                uploadingGeneralVideoPostId={imageUpload.uploadingGeneralVideoPostId}
                onStatusChange={postActions.handleStatusChange}
                onCopyContent={postActions.handleCopyContent}
                onDeletePost={postActions.handleDeletePost}
                onCreateBlogPost={postActions.handleCreateBlogPost}
                onGenerateVoiceoverScript={modalManager.openVoiceoverModal}
                onGenerateImagePrompt={modalManager.openImagePromptModal}
                onImageUpload={(postId, event) => handleFileSelect(postId, event, '16_9')}
                onImage916Upload={(postId, event) => handleFileSelect(postId, event, '9_16')}
                onImage34Upload={(postId, event) => handleFileSelect(postId, event, '3_4')}
                onImage43Upload={(postId, event) => handleFileSelect(postId, event, '4_3')}
                onPreviewImage={modalManager.openPreviewImage}
                fileInputRef={imageUpload.fileInputRef}
                file916InputRef={imageUpload.file916InputRef}
                file34InputRef={imageUpload.file34InputRef}
                file43InputRef={imageUpload.file43InputRef}
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
                  onFileSelect={handleFileSelect}
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
                uploadingPostId={imageUpload.uploadingPostId}
                uploading916PostId={imageUpload.uploading916PostId}
                uploading34PostId={imageUpload.uploading34PostId}
                uploading43PostId={imageUpload.uploading43PostId}
                uploadingGeneralVideoPostId={imageUpload.uploadingGeneralVideoPostId}
                onStatusChange={postActions.handleStatusChange}
                onCopyContent={postActions.handleCopyContent}
                onDeletePost={postActions.handleDeletePost}
                onCreateBlogPost={postActions.handleCreateBlogPost}
                onGenerateVoiceoverScript={modalManager.openVoiceoverModal}
                onGenerateImagePrompt={modalManager.openImagePromptModal}
                onImageUpload={(postId, event) => handleFileSelect(postId, event, '16_9')}
                onImage916Upload={(postId, event) => handleFileSelect(postId, event, '9_16')}
                onImage34Upload={(postId, event) => handleFileSelect(postId, event, '3_4')}
                onImage43Upload={(postId, event) => handleFileSelect(postId, event, '4_3')}
                onPreviewImage={modalManager.openPreviewImage}
                fileInputRef={imageUpload.fileInputRef}
                file916InputRef={imageUpload.file916InputRef}
                file34InputRef={imageUpload.file34InputRef}
                file43InputRef={imageUpload.file43InputRef}
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
            imageUpload.setSelectedPost(null);
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