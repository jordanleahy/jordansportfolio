import { useState } from "react";
import { SocialMediaPost } from "@/types/socialMedia";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "./PostCard";
import { PostsTableView } from "./PostsTableView";
import { useIsMobile } from "@/hooks/use-mobile";
import { useModalManager } from "@/hooks/useModalManager";
import { usePostActions } from "@/hooks/usePostActions";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImagePromptModal } from "./ImagePromptModal";
import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { VoiceoverScriptModal } from "@/components/voiceover/VoiceoverScriptModal";

interface PostsTableOptimizedProps {
  posts: SocialMediaPost[];
  onPostsChange: () => void;
  isAdmin?: boolean;
}

export const PostsTable = ({ posts, onPostsChange, isAdmin = false }: PostsTableOptimizedProps) => {
  const [activeTab, setActiveTab] = useState<"draft" | "published">("draft");
  const isMobile = useIsMobile();

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
    handleStatusChange,
    handleCopyContent,
    handleDeletePost,
    handleCreateBlogPost
  } = usePostActions(onPostsChange);

  const {
    uploadingPosts,
    handleFileSelect,
    isUploading,
    getUploadType,
  } = useImageUpload({ onPostsChange });

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
                    onImageDelete={() => {}}
                    onImageGenerated={() => onPostsChange()}
                    onStatusChange={(postId, status) => handleStatusChange(postId, status)}
                    uploadingStates={{}}
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
                onPreviewImage={openPreviewImage}
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
                    onCopy={() => handleCopyContent(post)}
                    onDelete={() => handleDeletePost(post.id)}
                    onGeneratePrompt={() => openImagePromptModal(post)}
                    onGenerateVoiceover={() => openVoiceoverModal(post)}
                    onFileSelect={(postId, aspectRatio) => handleFileSelect(postId, aspectRatio, post)}
                    onVideoUpload={() => {}}
                    onVideoRemove={() => {}}
                    onImageDelete={() => {}}
                    onImageGenerated={() => onPostsChange()}
                    onStatusChange={(postId, status) => handleStatusChange(postId, status)}
                    uploadingStates={{}}
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
                onPreviewImage={openPreviewImage}
                isAdmin={isAdmin}
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