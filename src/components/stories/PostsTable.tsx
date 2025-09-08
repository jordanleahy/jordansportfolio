// Enhanced PostsTable with view toggle support
import { useState, useCallback, useEffect } from "react";
import { SocialMediaPost } from "@/types/socialMedia";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Share2, Pencil } from "lucide-react";
import { PostCard } from "./PostCard";
import { PostsTableView } from "./PostsTableView";
import { PostsCardView } from "./PostsCardView";
import { ViewToggle, ViewMode } from "./ViewToggle";
import { ColorThemeSelector } from "./ColorThemeSelector";
import { useColorThemes } from "@/hooks/useColorThemes";
import { useIsMobile } from "@/hooks/use-mobile";
import { useModalManager } from "@/hooks/useModalManager";
import { usePostActions } from "@/hooks/usePostActions";
import { useImageManager } from "@/hooks/useImageManager";
import { useProcessingStatesContext } from "@/contexts/ProcessingStatesContext";
import { useBatchBlogStatus } from "@/hooks/useBatchBlogStatus";
import { PostEditModal } from "./PostEditModal";

import { ImagePreviewModal } from "@/components/ui/responsive-image-preview-modal";
import { VoiceoverScriptModal } from "@/components/voiceover/VoiceoverScriptModal";
import { useRowAnimations } from "@/hooks/useRowAnimations";

import { IndividualPromptViewer } from "./IndividualPromptViewer";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PostsTableProps } from '@/types/stories';
import { useParams } from 'react-router-dom';
import { ManualPostForm } from './ManualPostForm';
import { useOptimizedPromptGeneration } from '@/hooks/useOptimizedPromptGeneration';
import { ImageGenerationStatus } from '@/types/enums/status';


export default function PostsTable({
  posts,
  onPostsChange,
  isAdmin = false,
  category,
  themeId,
  selectedThemeId,
  onThemeChange,
}: PostsTableProps) {
  const [activeTab, setActiveTab] = useState<"draft" | "published">("draft");
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [promptPanelWidth, setPromptPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const isMobile = useIsMobile();
  const [isBulk169, setIsBulk169] = useState(false);
  const [isBulk11, setIsBulk11] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);
  const { generatePrompt } = useOptimizedPromptGeneration();
  
  // Check user role for admin features
  const { isAdmin: userIsAdmin } = useUserRole();

  // Handle edit post - Updated to use direct Supabase calls
  const handleEditPost = async (updatedPost: SocialMediaPost) => {
    try {
      const { error } = await supabase
        .from('social_media_posts')
        .update({
          title: updatedPost.title,
          description: updatedPost.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedPost.id);
        
      if (error) throw error;
      
      onPostsChange();
      toast.success('Post updated successfully');
    } catch (error) {
      console.error('Failed to update post:', error);
      toast.error('Failed to update post');
    }
  };

  const handleEditSuccess = () => {
    onPostsChange();
  };
  
  // Color themes
  const { data: colorThemes = [] } = useColorThemes();

  // Batch blog status for all posts
  const postIds = posts.map(post => post.id);
const { blogStatuses, isLoading: blogStatusesLoading } = useBatchBlogStatus(postIds);

  const { setBulkProcessing, isProcessing } = useProcessingStatesContext();

  // Animation state management
  const {
    animatingRows,
    completingRows,
    handleStatusChangeWithAnimation,
    getRowAnimationClass
  } = useRowAnimations();
  const {
    voiceoverModal,
    individualPromptPanel,
    previewImage,
    openVoiceoverModal,
    closeVoiceoverModal,
    openIndividualPromptPanel: originalOpenIndividualPromptPanel,
    closeIndividualPromptPanel,
    openPreviewImage,
    closePreviewImage
  } = useModalManager();

  // Function to regenerate prompt directly for regular users
  const handleRegeneratePrompt = useCallback(async (post: SocialMediaPost) => {
    try {
      toast.info("Regenerating prompt...");
      
      // Use the individual prompt cache hook to regenerate
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to regenerate prompts');
        return;
      }

      // Use optimized prompt generation instead of direct edge function call
      const generatedPrompt = await generatePrompt(post.id, post.theme_id);

      if (!generatedPrompt) throw new Error('No prompt generated');

      toast.success("Prompt regenerated successfully");
      onPostsChange(); // Refresh the posts to show updated prompt
    } catch (error) {
      console.error('Error regenerating prompt:', error);
      toast.error('Failed to regenerate prompt');
    }
  }, [onPostsChange]);

  // Custom function to handle prompt button based on user role
  const handlePromptButton = useCallback((post: SocialMediaPost) => {
    // Check if any regeneration is in progress for this post
    if (isProcessing(post.id, 'generate') || isProcessing(post.id, 'regenerate_prompt')) {
      toast.error("Cannot perform action while image regeneration is in progress");
      return;
    }

    // For regular users, directly regenerate the prompt without showing the panel
    if (!userIsAdmin && !isAdmin) {
      handleRegeneratePrompt(post);
      return;
    }

    // For admin/moderator users, open the prompt panel for editing
    originalOpenIndividualPromptPanel(post);
  }, [isProcessing, userIsAdmin, isAdmin, originalOpenIndividualPromptPanel, handleRegeneratePrompt]);
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

const { handleGenerateImage } = useImageManager({
  onPostsChange,
});

  // Resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    // Calculate new width based on mouse position from the right edge of the window
    const newWidth = Math.max(300, Math.min(800, window.innerWidth - e.clientX));
    setPromptPanelWidth(newWidth);
  }, [isResizing]);
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Handle image deletion with optimistic updates
  const handleImageDelete = async (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3') => {
    try {
      const updateField = `image_${aspectRatio}_url`;

      // Import supabase client
      const {
        supabase
      } = await import('@/integrations/supabase/client');

      // Optimistic update: immediately refresh the UI
      onPostsChange();
      const {
        error
      } = await supabase.from('social_media_posts').update({
        [updateField]: null
      }).eq('id', postId);
      if (error) {
        throw error;
      }

      // Force another refresh to ensure consistency
      setTimeout(() => {
        onPostsChange();
      }, 100);

      // Show success toast
      const {
        toast
      } = await import('sonner');
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);

      // If there was an error, refresh to revert optimistic update
      onPostsChange();
      const {
        toast
      } = await import('sonner');
      toast.error('Failed to delete image');
    }
  };

  // Handle bulk 16:9 generation for current category/theme (only missing images) - OPTIMIZED
  const handleBulkGenerate169 = async () => {
    try {
      if (!category) {
        toast.error('Category not found');
        return;
      }
      setIsBulk169(true);

      // Determine posts to process (missing 16:9 only)
      const inScope = posts;
      const inTheme = selectedThemeId ? inScope.filter(p => p.color_theme_id === selectedThemeId) : inScope;
      const candidates = inTheme.filter(p => !p.image_16_9_url || (p.image_16_9_status ?? 'none') !== 'complete');

      if (candidates.length === 0) {
        toast.info('All posts already have 16:9 images');
        return;
      }

      // Use optimized bulk generation
      const { useBulkSingleAspectGeneration } = await import('@/hooks/useBulkSingleAspectGeneration');
      const { generateBulkSingleAspect } = useBulkSingleAspectGeneration();
      
      await generateBulkSingleAspect(candidates, '16:9', 'missing_only', category);
      onPostsChange();
      
    } catch (e) {
      console.error(e);
      toast.error('Failed to run 16:9 generation');
    } finally {
      setIsBulk169(false);
    }
  };

  // Force-regenerate 16:9 images for all matching posts (category/theme) - OPTIMIZED
  const handleBulkRegenerate169 = async () => {
    try {
      if (!category) {
        toast.error('Category not found');
        return;
      }
      const proceed = window.confirm('This will regenerate and replace 16:9 images for all posts in this category (ignores theme filter). Continue?');
      if (!proceed) return;

      setIsBulk169(true);

      // Use optimized bulk generation for all posts
      const { useBulkSingleAspectGeneration } = await import('@/hooks/useBulkSingleAspectGeneration');
      const { generateBulkSingleAspect } = useBulkSingleAspectGeneration();
      
      await generateBulkSingleAspect(posts, '16:9', 'regenerate_all', category);
      onPostsChange();
      
    } catch (e) {
      console.error(e);
      toast.error('Failed to run 16:9 regeneration');
    } finally {
      setIsBulk169(false);
    }
  };

  // Handle bulk 1:1 generation for current category/theme (only missing images) - OPTIMIZED
  const handleBulkGenerate11 = async () => {
    try {
      if (!category) {
        toast.error('Category not found');
        return;
      }
      setIsBulk11(true);

      // Filter posts based on theme selection
      const targetPosts = selectedThemeId 
        ? posts.filter(p => p.color_theme_id === selectedThemeId) 
        : posts;

      // Use optimized bulk generation for missing images only
      const { useBulkSingleAspectGeneration } = await import('@/hooks/useBulkSingleAspectGeneration');
      const { generateBulkSingleAspect } = useBulkSingleAspectGeneration();
      
      await generateBulkSingleAspect(targetPosts, '1:1', 'missing_only', category);
      onPostsChange();
      
    } catch (e) {
      console.error(e);
      toast.error('Failed to run 1:1 generation');
    } finally {
      setIsBulk11(false);
    }
  };

  // Force-regenerate 1:1 images for all matching posts (category/theme) - OPTIMIZED
  const handleBulkRegenerate11 = async () => {
    try {
      if (!category) {
        toast.error('Category not found');
        return;
      }
      const proceed = window.confirm('This will regenerate and replace 1:1 images for all posts in this category (ignores theme filter). Continue?');
      if (!proceed) return;

      setIsBulk11(true);

      // Use optimized bulk generation for all posts
      const { useBulkSingleAspectGeneration } = await import('@/hooks/useBulkSingleAspectGeneration');
      const { generateBulkSingleAspect } = useBulkSingleAspectGeneration();
      
      await generateBulkSingleAspect(posts, '1:1', 'regenerate_all', category);
      onPostsChange();
      
    } catch (e) {
      console.error(e);
      toast.error('Failed to run 1:1 regeneration');
    } finally {
      setIsBulk11(false);
    }
  };

  // Simplified sharing function - creates blurred public collection and opens it
  const handleShare = async () => {
    try {
      setIsSharing(true);
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to share');
        return;
      }

      // Generate simple handle
      const handle = session.user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || session.user.id.slice(0, 8);

      // Get posts with 1:1 images
      const scoped = selectedThemeId ? posts.filter(p => p.color_theme_id === selectedThemeId) : posts;
      const candidates = scoped.filter(p => !!p.image_1_1_url);
      const candidateIds = candidates.map(p => p.id);
      
      if (candidateIds.length === 0) {
        toast.error('No posts with 1:1 images found to share');
        return;
      }

      const titleArg = (category && String(category).trim()) || candidates[0]?.title || handle;
      const firstWithDesc = candidates.find(p => (p.description ?? '').trim().length > 0);
      const baseDesc = firstWithDesc?.description || `A shareable ${candidateIds.length} image${candidateIds.length>1?'s':''} collection for ${titleArg}.`;
      const descriptionArg = baseDesc.replace(/\s+/g, ' ').trim().slice(0, 165);

      // Create blurred public collection
      const { data: collectionId, error } = await supabase.rpc('publish_shared_collection_1_1', {
        p_handle: handle,
        p_post_ids: candidateIds,
        p_theme_id: themeId,
        p_title: titleArg,
        p_description: descriptionArg,
      });

      if (error) throw error;

      // Set to blurred and add to library
      await supabase
        .from('shared_collections')
        .update({
          include_in_library: true,
          public_access_type: 'blurred'
        })
        .eq('id', collectionId);

      // Open collection in new tab
      const publicUrl = `${window.location.origin}/public/collections/${handle}/${collectionId}`;
      window.open(publicUrl, '_blank', 'noopener,noreferrer');
      toast.success('Collection shared! Opening in new tab...');

    } catch (error) {
      console.error('Error sharing collection:', error);
      toast.error('Failed to share collection. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  // Filter posts by status
  const filteredPosts = posts.filter(post => post.status === activeTab);
  
  return (
    <div className="flex gap-4 h-full">
      {/* Main content - conditional mobile/desktop layout */}
      <div className="transition-all duration-300 flex-1" style={{
        width: showSystemPrompt && !individualPromptPanel.isOpen 
          ? `calc(100% - ${promptPanelWidth}px - 1rem)` 
          : showSystemPrompt && individualPromptPanel.isOpen
            ? `calc(100% - ${promptPanelWidth * 2}px - 2rem)`
            : individualPromptPanel.isOpen && !showSystemPrompt
              ? `calc(100% - ${promptPanelWidth}px - 1rem)`
              : '100%'
      }}>
        {isMobile ? (
          /* Mobile: Edge-to-edge layout without Card wrapper */
          <div>
            {/* Tabs and controls with selective padding */}
            <div>
              <Tabs value={activeTab} onValueChange={value => setActiveTab(value as "draft" | "published")}>
                {/* Tabs Section */}
                {userIsAdmin && (
                  <div className="mb-4 flex items-center justify-between">
                    <TabsList>
                      <TabsTrigger value="draft">
                        Draft {posts.filter(p => p.status === 'draft').length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
                            {posts.filter(p => p.status === 'draft').length}
                          </span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="published">Published</TabsTrigger>
                    </TabsList>
                    
                    {!isMobile && (
                      <ViewToggle
                        currentView={viewMode}
                        onViewChange={setViewMode}
                      />
                    )}
                  </div>
                )}
                
                {/* Action Buttons Section */}
                {category && userIsAdmin && (
                  <div className="flex items-center justify-end mb-4 gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          disabled={isBulk169}
                          aria-label="Bulk actions"
                          title="Bulk actions"
                        >
                          <span className="text-xs font-medium">Bulk</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg z-50">
                        <DropdownMenuLabel>Bulk: 16:9</DropdownMenuLabel>
                        <DropdownMenuItem onClick={handleBulkGenerate169} disabled={isBulk169}>
                          Generate for missing only (respects theme filter)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBulkRegenerate169} disabled={isBulk169}>
                          Regenerate for all (ignores theme filter)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Bulk: 1:1</DropdownMenuLabel>
                        <DropdownMenuItem onClick={handleBulkGenerate11} disabled={isBulk11}>
                          Generate for missing only (respects theme filter)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBulkRegenerate11} disabled={isBulk11}>
                          Regenerate for all (ignores theme filter)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleShare}
                      disabled={isSharing}
                      aria-label="Share Collection"
                      title="Create and share a blurred public collection"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                      aria-label="Edit Category Prompt"
                      title="Edit Category Prompt"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <TabsContent value="draft">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-lg font-medium mb-2">No draft posts</div>
                      <div className="text-sm">All posts in this theme are published or there are no posts yet.</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                        {filteredPosts.map(post => <PostCard key={post.id} post={post} onCopy={() => handleCopyContent(post)} onDelete={() => handleDeletePost(post.id)} onGeneratePrompt={() => handlePromptButton(post)} onGenerateVoiceover={() => openVoiceoverModal(post)} onVideoUpload={() => {}} onVideoRemove={() => {}} onImageDelete={handleImageDelete} onImageGenerated={() => onPostsChange()} onStatusChange={(postId, status) => handleStatusChange(postId, status)} onPostsChange={onPostsChange} processingStates={{}} completingPosts={new Set()} isGenerating={() => false} isAdmin={userIsAdmin} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} />)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="published">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-lg font-medium mb-2">No published posts</div>
                      <div className="text-sm">No posts have been published in this theme yet.</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPosts.map(post => <PostCard key={post.id} post={post} onCopy={() => handleCopyContent(post)} onDelete={() => handleDeletePost(post.id)} onGeneratePrompt={() => handlePromptButton(post)} onGenerateVoiceover={() => openVoiceoverModal(post)} onVideoUpload={() => {}} onVideoRemove={() => {}} onImageDelete={handleImageDelete} onImageGenerated={() => onPostsChange()} onStatusChange={(postId, status) => handleStatusChange(postId, status)} onPostsChange={onPostsChange} processingStates={{}} completingPosts={new Set()} isGenerating={() => false} isAdmin={userIsAdmin} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} />)}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          /* Desktop: Keep existing Card container layout */
          <Card className="h-full">
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={value => setActiveTab(value as "draft" | "published")}>
                {/* Tabs and Controls Section */}
                {userIsAdmin && (
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <TabsList>
                      <TabsTrigger value="draft">
                        Draft {posts.filter(p => p.status === 'draft').length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
                            {posts.filter(p => p.status === 'draft').length}
                          </span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="published">Published</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex items-center gap-4">
                      {!isMobile && (
                        <ViewToggle
                          currentView={viewMode}
                          onViewChange={setViewMode}
                        />
                      )}
                      
                       {/* Manual Post Creation */}
                       <ManualPostForm 
                         category={category}
                         themeId={themeId}
                         onPostCreated={onPostsChange}
                       />
                      
                      {/* Action Buttons */}
                      {category && (
                        <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={isBulk169}
                            className="gap-1 text-xs sm:text-sm"
                            aria-label="Bulk actions"
                            title="Bulk actions"
                          >
                            Bulk
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg z-50">
                          <DropdownMenuLabel>Bulk: 16:9</DropdownMenuLabel>
                          <DropdownMenuItem onClick={handleBulkGenerate169} disabled={isBulk169}>
                            Generate for missing only (respects theme filter)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleBulkRegenerate169} disabled={isBulk169}>
                            Regenerate for all (ignores theme filter)
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Bulk: 1:1</DropdownMenuLabel>
                          <DropdownMenuItem onClick={handleBulkGenerate11} disabled={isBulk11}>
                            Generate for missing only (respects theme filter)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleBulkRegenerate11} disabled={isBulk11}>
                            Regenerate for all (ignores theme filter)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={handleShare}
                          disabled={isSharing}
                          aria-label="Share Collection"
                          title="Create and share a blurred public collection"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setShowSystemPrompt(!showSystemPrompt)} 
                        aria-label="Edit Category Prompt"
                        title="Edit Category Prompt"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <TabsContent value="draft">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-lg font-medium mb-2">No draft posts</div>
                      <div className="text-sm">All posts in this theme are published or there are no posts yet.</div>
                    </div>
                  ) : (
                    viewMode === 'table' ? (
                      <PostsTableView posts={filteredPosts} activeTab={activeTab} creatingBlogIds={creatingBlogIds} onStatusChange={handleStatusChange} onCopyContent={handleCopyContent} onDeletePost={handleDeletePost} onCreateBlogPost={handleCreateBlogPost} onGenerateVoiceoverScript={openVoiceoverModal} onGenerateImagePrompt={handlePromptButton} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} onPostsChange={onPostsChange} isAdmin={userIsAdmin} animatingRows={animatingRows} completingRows={completingRows} getRowAnimationClass={getRowAnimationClass} blogStatuses={blogStatuses} onEditPost={handleEditPost} />
                    ) : (
                      <PostsCardView posts={filteredPosts} activeTab={activeTab} creatingBlogIds={creatingBlogIds} onStatusChange={handleStatusChange} onCopyContent={handleCopyContent} onDeletePost={handleDeletePost} onCreateBlogPost={handleCreateBlogPost} onGenerateVoiceoverScript={openVoiceoverModal} onGenerateImagePrompt={handlePromptButton} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} onPostsChange={onPostsChange} isAdmin={userIsAdmin} animatingRows={animatingRows} completingRows={completingRows} getRowAnimationClass={getRowAnimationClass} blogStatuses={blogStatuses} onEditPost={handleEditPost} />
                    )
                  )}
                </TabsContent>
                
                <TabsContent value="published">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-lg font-medium mb-2">No published posts</div>
                      <div className="text-sm">No posts have been published in this theme yet.</div>
                    </div>
                  ) : (
                    viewMode === 'table' ? (
                      <PostsTableView posts={filteredPosts} activeTab={activeTab} creatingBlogIds={creatingBlogIds} onStatusChange={handleStatusChange} onCopyContent={handleCopyContent} onDeletePost={handleDeletePost} onCreateBlogPost={handleCreateBlogPost} onGenerateVoiceoverScript={openVoiceoverModal} onGenerateImagePrompt={handlePromptButton} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} onPostsChange={onPostsChange} isAdmin={userIsAdmin} animatingRows={animatingRows} completingRows={completingRows} getRowAnimationClass={getRowAnimationClass} blogStatuses={blogStatuses} onEditPost={handleEditPost} />
                    ) : (
                      <PostsCardView posts={filteredPosts} activeTab={activeTab} creatingBlogIds={creatingBlogIds} onStatusChange={handleStatusChange} onCopyContent={handleCopyContent} onDeletePost={handleDeletePost} onCreateBlogPost={handleCreateBlogPost} onGenerateVoiceoverScript={openVoiceoverModal} onGenerateImagePrompt={handlePromptButton} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} onPostsChange={onPostsChange} isAdmin={userIsAdmin} animatingRows={animatingRows} completingRows={completingRows} getRowAnimationClass={getRowAnimationClass} blogStatuses={blogStatuses} onEditPost={handleEditPost} />
                    )
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        )}
      </div>

      {/* System Prompt Viewer Panel */}
      {showSystemPrompt && (
        <>
          <div 
            className="w-1 cursor-col-resize bg-border hover:bg-primary transition-colors" 
            onMouseDown={handleMouseDown}
            style={{ cursor: isResizing ? 'col-resize' : 'col-resize' }}
          />
          <div 
            className="h-full border-l bg-background" 
            style={{ width: `${promptPanelWidth}px` }}
          >
            <div className="sticky top-0 z-10 bg-background border-b p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Category Prompt</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSystemPrompt(false)}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-3">
              <div className="text-sm text-muted-foreground mb-2">
                Editing prompt for <strong>{category}</strong>
              </div>
              <ColorThemeSelector
                themes={colorThemes}
                selectedThemeId={selectedThemeId}
                onThemeChange={onThemeChange}
              />
            </div>
          </div>
        </>
      )}

      {/* Individual Prompt Panel */}
      {individualPromptPanel.isOpen && individualPromptPanel.post && (
        <>
          <div 
            className="w-1 cursor-col-resize bg-border hover:bg-primary transition-colors" 
            onMouseDown={handleMouseDown}
            style={{ cursor: isResizing ? 'col-resize' : 'col-resize' }}
          />
          <div 
            className="h-full border-l bg-background" 
            style={{ width: `${promptPanelWidth}px` }}
          >
            <div className="sticky top-0 z-10 bg-background border-b p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Individual Prompt</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeIndividualPromptPanel}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-3">
              <IndividualPromptViewer 
                post={individualPromptPanel.post}
                isVisible={true}
                onClose={closeIndividualPromptPanel}
              />
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {previewImage.url && (
        <ImagePreviewModal
          imageUrl={previewImage.url}
          alt={previewImage.alt || "Post image"}
          isOpen={!!previewImage.url}
          onClose={closePreviewImage}
        />
      )}

      {/* Voiceover modal temporarily removed due to prop mismatch */}

      {editModalOpen && selectedPost && (
        <PostEditModal
          post={selectedPost}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </div>
  );
}