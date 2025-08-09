import { useState, useCallback, useEffect } from "react";
import { SocialMediaPost } from "@/types/socialMedia";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Eye } from "lucide-react";
import { PostCard } from "./PostCard";
import { PostsTableView } from "./PostsTableView";
import { ColorThemeSelector } from "./ColorThemeSelector";
import { useColorThemes } from "@/hooks/useColorThemes";
import { useIsMobile } from "@/hooks/use-mobile";
import { useModalManager } from "@/hooks/useModalManager";
import { usePostActions } from "@/hooks/usePostActions";
import { useImageManager } from "@/hooks/useImageManager";

import { useBatchBlogStatus } from "@/hooks/useBatchBlogStatus";

import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { VoiceoverScriptModal } from "@/components/voiceover/VoiceoverScriptModal";
import { useRowAnimations } from "@/hooks/useRowAnimations";
import { SystemPromptViewer } from "./SystemPromptViewer";
import { IndividualPromptViewer } from "./IndividualPromptViewer";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { PostsTableProps } from '@/types/stories';


export const PostsTable = ({
  posts,
  onPostsChange,
  isAdmin = false,
  category,
  selectedThemeId,
  onThemeChange,
}: PostsTableProps) => {
  const [activeTab, setActiveTab] = useState<"draft" | "published">("draft");
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [promptPanelWidth, setPromptPanelWidth] = useState(400); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const isMobile = useIsMobile();
  const [isBulk169, setIsBulk169] = useState(false);
  
  // Check user role for admin features
  const { isAdmin: userIsAdmin } = useUserRole();
  
  // Color themes
  const { data: colorThemes = [] } = useColorThemes();

  // Batch blog status for all posts
  const postIds = posts.map(post => post.id);
  const { blogStatuses, isLoading: blogStatusesLoading } = useBatchBlogStatus(postIds);


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
    openIndividualPromptPanel,
    closeIndividualPromptPanel,
    openPreviewImage,
    closePreviewImage
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
    handleGenerateImage
  } = useImageManager({
    onPostsChange
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

  // Handle bulk 16:9 generation for current category/theme (only missing images)
  const handleBulkGenerate169 = async () => {
    try {
      if (!category) {
        toast.error('Category not found');
        return;
      }
      setIsBulk169(true);

      // Ensure user is authenticated
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to generate images');
        setIsBulk169(false);
        return;
      }

      // Determine posts to process (missing or not-complete 16:9 only)
      const candidates = posts.filter(p =>
        p.category === category &&
        (!selectedThemeId || p.theme_id === selectedThemeId) &&
        (!p.image_16_9_url || (p.image_16_9_status ?? 'none') !== 'complete')
      );

      if (candidates.length === 0) {
        toast.info('All posts already have a 16:9 image');
        return;
      }

      toast.info(`Starting 16:9 generation for ${candidates.length} post(s)...`);

      // Concurrency-limited client-side batch using existing single-image flow
      const concurrency = Math.min(3, candidates.length);
      let successes = 0;

      const queue = [...candidates];
      const worker = async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) break;
          const res = await handleGenerateImage(next.id, '16_9', next.title, next.description, next.category);
          if (res.success) successes++;
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      toast.success(`Generated ${successes}/${candidates.length} 16:9 image(s)`);
      onPostsChange();
    } catch (e) {
      console.error(e);
      toast.error('Failed to run 16:9 generation');
    } finally {
      setIsBulk169(false);
    }
  };

  // Force-regenerate 16:9 images for all matching posts (category/theme)
  const handleBulkRegenerate169 = async () => {
    try {
      if (!category) {
        toast.error('Category not found');
        return;
      }
      const proceed = window.confirm('This will regenerate and replace 16:9 images for all matching posts. Continue?');
      if (!proceed) return;

      setIsBulk169(true);

      // Ensure user is authenticated
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to generate images');
        setIsBulk169(false);
        return;
      }

      // Determine posts to process (ALL matching posts regardless of existing image)
      const candidates = posts.filter(p =>
        p.category === category &&
        (!selectedThemeId || p.theme_id === selectedThemeId)
      );

      if (candidates.length === 0) {
        toast.info('No posts found for this theme');
        return;
      }

      toast.info(`Regenerating 16:9 for ${candidates.length} post(s)...`);

      // Concurrency-limited client-side batch using existing single-image flow
      const concurrency = Math.min(3, candidates.length);
      let successes = 0;

      const queue = [...candidates];
      const worker = async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) break;
          const res = await handleGenerateImage(next.id, '16_9', next.title, next.description, next.category);
          if (res.success) successes++;
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      toast.success(`Regenerated ${successes}/${candidates.length} 16:9 image(s)`);
      onPostsChange();
    } catch (e) {
      console.error(e);
      toast.error('Failed to run 16:9 regeneration');
    } finally {
      setIsBulk169(false);
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
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {userIsAdmin && (
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
                    )}
                  </div>
              
                  {category && userIsAdmin && (
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => setShowSystemPrompt(!showSystemPrompt)} className="gap-1 text-xs sm:text-sm">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Category Prompt</span>
                        <span className="sm:hidden">Category Prompt</span>
                      </Button>
                    </div>
                  )}
                </div>

                <TabsContent value="draft">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-lg font-medium mb-2">No draft posts</div>
                      <div className="text-sm">All posts in this theme are published or there are no posts yet.</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {filteredPosts.map(post => <PostCard key={post.id} post={post} onCopy={() => handleCopyContent(post)} onDelete={() => handleDeletePost(post.id)} onGeneratePrompt={() => openIndividualPromptPanel(post)} onGenerateVoiceover={() => openVoiceoverModal(post)} onVideoUpload={() => {}} onVideoRemove={() => {}} onImageDelete={handleImageDelete} onImageGenerated={() => onPostsChange()} onStatusChange={(postId, status) => handleStatusChange(postId, status)} onPostsChange={onPostsChange} processingStates={{}} completingPosts={new Set()} isGenerating={() => false} isAdmin={userIsAdmin} />)}
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
                      {filteredPosts.map(post => <PostCard key={post.id} post={post} onCopy={() => handleCopyContent(post)} onDelete={() => handleDeletePost(post.id)} onGeneratePrompt={() => openIndividualPromptPanel(post)} onGenerateVoiceover={() => openVoiceoverModal(post)} onVideoUpload={() => {}} onVideoRemove={() => {}} onImageDelete={handleImageDelete} onImageGenerated={() => onPostsChange()} onStatusChange={(postId, status) => handleStatusChange(postId, status)} onPostsChange={onPostsChange} processingStates={{}} completingPosts={new Set()} isGenerating={() => false} isAdmin={userIsAdmin} />)}
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
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {userIsAdmin && (
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
                    )}
                  </div>
              
                  {category && userIsAdmin && (
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={isBulk169}
                            className="gap-1 text-xs sm:text-sm"
                            aria-label="Bulk 16:9 actions"
                            title="Bulk 16:9 actions"
                          >
                            16:9
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg z-50">
                          <DropdownMenuLabel>Bulk 16:9</DropdownMenuLabel>
                          <DropdownMenuItem onClick={handleBulkGenerate169} disabled={isBulk169}>
                            Generate for missing only
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleBulkRegenerate169} disabled={isBulk169}>
                            Regenerate for all
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="sm" onClick={() => setShowSystemPrompt(!showSystemPrompt)} className="gap-1 text-xs sm:text-sm">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Category Prompt</span>
                        <span className="sm:hidden">Category Prompt</span>
                      </Button>
                    </div>
                  )}
                </div>

                <TabsContent value="draft">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-lg font-medium mb-2">No draft posts</div>
                      <div className="text-sm">All posts in this theme are published or there are no posts yet.</div>
                    </div>
                  ) : (
                     <PostsTableView posts={filteredPosts} activeTab={activeTab} creatingBlogIds={creatingBlogIds} onStatusChange={handleStatusChange} onCopyContent={handleCopyContent} onDeletePost={handleDeletePost} onCreateBlogPost={handleCreateBlogPost} onGenerateVoiceoverScript={openVoiceoverModal} onGenerateImagePrompt={openIndividualPromptPanel} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} onPostsChange={onPostsChange} isAdmin={userIsAdmin} animatingRows={animatingRows} completingRows={completingRows} getRowAnimationClass={getRowAnimationClass} blogStatuses={blogStatuses} />
                  )}
                </TabsContent>

                <TabsContent value="published">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-lg font-medium mb-2">No published posts</div>
                      <div className="text-sm">No posts have been published in this theme yet.</div>
                    </div>
                  ) : (
                    <PostsTableView posts={filteredPosts} activeTab={activeTab} creatingBlogIds={creatingBlogIds} onStatusChange={handleStatusChange} onCopyContent={handleCopyContent} onDeletePost={handleDeletePost} onCreateBlogPost={handleCreateBlogPost} onGenerateVoiceoverScript={openVoiceoverModal} onGenerateImagePrompt={openIndividualPromptPanel} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} onPostsChange={onPostsChange} isAdmin={userIsAdmin} animatingRows={animatingRows} completingRows={completingRows} getRowAnimationClass={getRowAnimationClass} blogStatuses={blogStatuses} />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        )}
      </div>

      {/* System Prompt Viewer Panel - Admin Only */}
      {showSystemPrompt && category && userIsAdmin && <div className="relative transition-all duration-300" style={{
      width: promptPanelWidth
    }}>
          {/* Resize handle */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-border hover:bg-accent cursor-col-resize z-10" onMouseDown={handleMouseDown} style={{
        background: isResizing ? 'hsl(var(--accent))' : 'hsl(var(--border))',
        width: '4px',
        marginLeft: '-2px'
      }} />
          <SystemPromptViewer 
            category={category} 
            isVisible={showSystemPrompt} 
            onClose={() => setShowSystemPrompt(false)} 
            selectedThemeId={selectedThemeId}
            themes={colorThemes}
            onThemeChange={onThemeChange}
          />
        </div>}

      {/* Individual Prompt Panel */}
      {individualPromptPanel.isOpen && (
        <div className="relative transition-all duration-300" style={{
          width: promptPanelWidth
        }}>
          <IndividualPromptViewer 
            post={individualPromptPanel.post}
            isVisible={individualPromptPanel.isOpen}
            onClose={closeIndividualPromptPanel}
          />
        </div>
      )}

      {previewImage && <ImagePreviewModal isOpen={!!previewImage} onClose={closePreviewImage} imageUrl={previewImage.url} alt={previewImage.alt} />}

      {voiceoverModal.isOpen && voiceoverModal.post && <VoiceoverScriptModal isOpen={voiceoverModal.isOpen} onClose={closeVoiceoverModal} sourceId={voiceoverModal.post.id} sourceType="social_media_post" originalContent={`${voiceoverModal.post.title}\n\n${voiceoverModal.post.description}`} />}

    </div>
  );
};