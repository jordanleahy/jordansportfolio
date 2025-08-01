import { useState } from "react";
import { SocialMediaPost } from "@/types/socialMedia";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { PostCard } from "./PostCard";
import { PostsTableView } from "./PostsTableView";
import { ColorThemeSelector } from "./ColorThemeSelector";
import { useIsMobile } from "@/hooks/use-mobile";
import { useModalManager } from "@/hooks/useModalManager";
import { usePostActions } from "@/hooks/usePostActions";
import { useImageManager } from "@/hooks/useImageManager";
import { useProcessingStates } from "@/hooks/useProcessingStates";
import { useColorThemes } from "@/hooks/useColorThemes";
import { ImagePromptModal } from "./ImagePromptModal";
import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { VoiceoverScriptModal } from "@/components/voiceover/VoiceoverScriptModal";
import { useRowAnimations } from "@/hooks/useRowAnimations";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface PostsTableOptimizedProps {
  posts: SocialMediaPost[];
  onPostsChange: () => void;
  isAdmin?: boolean;
  category?: string;
}

export const PostsTable = ({ posts, onPostsChange, isAdmin = false, category }: PostsTableOptimizedProps) => {
  const [activeTab, setActiveTab] = useState<"draft" | "published">("draft");
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Load color themes
  const { data: themes = [] } = useColorThemes();
  
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

  // Handle color theme update for category
  const handleThemeUpdate = async (themeId: string) => {
    if (!category) {
      toast.error('Category not available');
      return;
    }

    setIsUpdatingTheme(true);
    try {
      // Get selected theme data
      const selectedTheme = themes.find(t => t.id === themeId);
      if (!selectedTheme) {
        toast.error('Selected theme not found');
        return;
      }

      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Call the edge function to regenerate system prompt with color theme
      const { data, error } = await supabase.functions.invoke('invoke-system-prompt-agent', {
        body: {
          category,
          theme: `${category} with ${selectedTheme.name} color theme`,
          description: `Generate comprehensive system prompt for ${category} visual content using ${selectedTheme.name} color palette`,
          user_id: user.id,
          color_theme: {
            name: selectedTheme.name,
            primary_color: selectedTheme.primary_color,
            secondary_color: selectedTheme.secondary_color,
            accent_color: selectedTheme.accent_color,
            background_color: selectedTheme.background_color,
            text_color: selectedTheme.text_color,
            border_color: selectedTheme.border_color,
            color_instructions: selectedTheme.color_instructions,
            visual_style: selectedTheme.visual_style
          },
          sample_posts: [
            {
              title: `Sample ${category} content`,
              description: `Example content for ${category} category with ${selectedTheme.name} theme`
            }
          ]
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to update system prompt');
      }

      setIsThemePopoverOpen(false);
      toast.success(`System prompt updated with ${selectedTheme.name} color theme`);
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error(`Failed to update color theme: ${error.message}`);
    } finally {
      setIsUpdatingTheme(false);
    }
  };

  // Filter posts by status
  const filteredPosts = posts.filter((post) => post.status === activeTab);

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Social Media Posts</h2>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "draft" | "published")}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
            </TabsList>
            
            {category && (
              <Popover open={isThemePopoverOpen} onOpenChange={setIsThemePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    disabled={isUpdatingTheme}
                  >
                    <Palette className="h-4 w-4" />
                    {isUpdatingTheme ? 'Updating...' : 'Color Theme'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">Update Color Theme</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        This will regenerate the system prompt for {category} category with the selected color theme.
                      </p>
                    </div>
                    <ColorThemeSelector
                      themes={themes}
                      onThemeChange={handleThemeUpdate}
                      className="w-full"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

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