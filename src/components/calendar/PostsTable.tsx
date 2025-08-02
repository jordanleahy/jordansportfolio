import { useState, useCallback, useEffect } from "react";
import { SocialMediaPost } from "@/types/socialMedia";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Palette, Eye, Plus } from "lucide-react";
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
import { SystemPromptViewer } from "./SystemPromptViewer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
interface PostsTableOptimizedProps {
  posts: SocialMediaPost[];
  onPostsChange: () => void;
  isAdmin?: boolean;
  category?: string;
}
export const PostsTable = ({
  posts,
  onPostsChange,
  isAdmin = false,
  category
}: PostsTableOptimizedProps) => {
  const [activeTab, setActiveTab] = useState<"draft" | "published">("draft");
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [currentAppliedTheme, setCurrentAppliedTheme] = useState<any>(null);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [promptPanelWidth, setPromptPanelWidth] = useState(400); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const isMobile = useIsMobile();

  // Load color themes
  const {
    data: themes = []
  } = useColorThemes();

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
    uploadingPosts,
    handleFileSelect,
    handleGenerateImage,
    isUploading: originalIsUploading,
    getUploadType: originalGetUploadType
  } = useImageManager({
    onPostsChange
  });

  // Use unified processing states
  const {
    isUploading: unifiedIsUploading,
    getUploadType: unifiedGetUploadType
  } = useProcessingStates();

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

  // Convert nested uploading states to flat format for PostCard
  const flatUploadingStates = Object.entries(uploadingPosts).reduce((acc, [postId, aspectRatios]) => {
    Object.entries(aspectRatios).forEach(([aspectRatio, isUploading]) => {
      acc[`${postId}_${aspectRatio}`] = isUploading;
    });
    return acc;
  }, {} as Record<string, boolean>);

  // Handle color theme update for category with enhanced logging
  const handleThemeUpdate = async (themeId: string) => {
    if (!category) {
      toast.error('Category not available');
      return;
    }
    const timestamp = new Date().toISOString();
    console.log('🎨 THEME UPDATE INITIATED:', {
      timestamp,
      category,
      themeId,
      available_themes: themes.length
    });
    setIsUpdatingTheme(true);
    try {
      // Get selected theme data
      const selectedTheme = themes.find(t => t.id === themeId);
      if (!selectedTheme) {
        console.error('❌ THEME NOT FOUND:', {
          themeId,
          available_themes: themes.map(t => ({
            id: t.id,
            name: t.name
          }))
        });
        toast.error('Selected theme not found');
        return;
      }
      console.log('✅ THEME SELECTED:', {
        theme: {
          id: selectedTheme.id,
          name: selectedTheme.name,
          slug: selectedTheme.slug,
          colors: {
            primary: selectedTheme.primary_color,
            secondary: selectedTheme.secondary_color,
            accent: selectedTheme.accent_color,
            background: selectedTheme.background_color,
            text: selectedTheme.text_color,
            border: selectedTheme.border_color
          },
          visual_style: selectedTheme.visual_style,
          color_instructions: selectedTheme.color_instructions
        }
      });

      // Import supabase client
      const {
        supabase
      } = await import('@/integrations/supabase/client');

      // Get current user
      const {
        data: {
          user
        },
        error: userError
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ USER AUTHENTICATION ERROR:', userError);
        throw new Error('User not authenticated');
      }
      console.log('🔐 USER AUTHENTICATED:', {
        user_id: user.id
      });
      const requestPayload = {
        category,
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
        }
      };
      console.log('🚀 CALLING EDGE FUNCTION: invoke-system-prompt-agent');
      console.log('📤 REQUEST PAYLOAD:', requestPayload);

      // Call the edge function for variable-based color replacement
      const {
        data,
        error
      } = await supabase.functions.invoke('invoke-system-prompt-agent', {
        body: requestPayload
      });
      console.log('📥 EDGE FUNCTION RESPONSE:', {
        success: !!data?.success,
        error: error,
        data: data,
        response_timestamp: new Date().toISOString()
      });
      if (error) {
        console.error('❌ EDGE FUNCTION ERROR:', error);
        throw new Error(error.message || 'Failed to update system prompt');
      }
      if (data?.success) {
        console.log('✅ THEME UPDATE SUCCESS:', {
          message: data.message,
          agents_updated: data.agents_updated,
          updated_agents: data.updated_agents,
          category: data.category,
          applied_theme: selectedTheme.name
        });

        // Verify database update by checking agents
        console.log('🔍 VERIFYING DATABASE UPDATE...');
        const {
          data: verifyData,
          error: verifyError
        } = await supabase.from('openai_agents').select('name, system_prompts, updated_at').eq('user_id', user.id).not('system_prompts', 'is', null);
        if (!verifyError && verifyData) {
          console.log('📊 DATABASE VERIFICATION:', {
            total_agents: verifyData.length,
            agents_with_prompts: verifyData.filter(agent => agent.system_prompts && Array.isArray(agent.system_prompts) && agent.system_prompts.some((p: any) => p.category === category)).length,
            latest_updates: verifyData.map(agent => ({
              name: agent.name,
              updated_at: agent.updated_at,
              has_category_prompt: agent.system_prompts && Array.isArray(agent.system_prompts) && agent.system_prompts.some((p: any) => p.category === category)
            }))
          });

          // Check if the system prompt actually contains the new colors
          const updatedAgent = verifyData.find(agent => agent.system_prompts && Array.isArray(agent.system_prompts) && agent.system_prompts.some((p: any) => p.category === category));
          if (updatedAgent) {
            const systemPrompts = Array.isArray(updatedAgent.system_prompts) ? updatedAgent.system_prompts as Array<{
              category: string;
              prompt: string;
            }> : [];
            const categoryPrompt = systemPrompts.find((p: any) => p.category === category);
            if (categoryPrompt) {
              const containsNewColors = selectedTheme.primary_color && categoryPrompt.prompt.includes(selectedTheme.primary_color);
              const containsThemeName = categoryPrompt.prompt.includes(selectedTheme.name);
              console.log('🎨 COLOR VERIFICATION:', {
                agent_name: updatedAgent.name,
                prompt_length: categoryPrompt.prompt.length,
                contains_primary_color: containsNewColors,
                contains_theme_name: containsThemeName,
                searching_for_color: selectedTheme.primary_color,
                searching_for_theme: selectedTheme.name,
                prompt_has_color_table: categoryPrompt.prompt.includes('| Primary') && categoryPrompt.prompt.includes('| Secondary'),
                prompt_snippet: categoryPrompt.prompt.substring(0, 300) + '...'
              });
            }
          }
        }

        // Use verification data to show accurate count
        const actualUpdatedCount = verifyData ? verifyData.filter(agent => agent.system_prompts && Array.isArray(agent.system_prompts) && agent.system_prompts.some((p: any) => p.category === category) && agent.system_prompts.some((p: any) => p.prompt.includes(selectedTheme.primary_color))).length : data.agents_updated;

        // Update the current applied theme state
        setCurrentAppliedTheme(selectedTheme);
        toast.success(`${selectedTheme.name} color theme applied successfully! ${actualUpdatedCount} agent(s) updated.`);
      } else {
        console.log('⚠️  UNEXPECTED RESPONSE:', data);
        toast.error('Theme update completed but response was unexpected.');
      }
    } catch (error) {
      console.error('💥 THEME UPDATE EXCEPTION:', error);
      toast.error(`Failed to update color theme: ${error.message}`);
    } finally {
      setIsUpdatingTheme(false);
      console.log('🏁 THEME UPDATE COMPLETE:', {
        timestamp: new Date().toISOString(),
        category,
        success: true
      });
    }
  };

  // Filter posts by status
  const filteredPosts = posts.filter(post => post.status === activeTab);
  return <div className="flex gap-4 h-full">
      {/* Main content - table */}
      <div className="transition-all duration-300 flex-1" style={{
      width: showSystemPrompt ? `calc(100% - ${promptPanelWidth}px - 1rem)` : '100%'
    }}>
        <Card className="h-full">
          <div className="p-6">
            
        
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as "draft" | "published")}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <TabsList>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Post
              </Button>
            </div>
            
            {category && <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowSystemPrompt(!showSystemPrompt)} className="gap-2">
                  <Eye className="h-4 w-4" />
                  {showSystemPrompt ? 'Hide Prompt' : 'View Prompt'}
                </Button>
                
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" disabled={isUpdatingTheme}>
                    <Palette className="h-4 w-4" />
                    {isUpdatingTheme ? 'Updating...' : <div className="flex gap-1">
                        {(() => {
                          // Use the current applied theme state, fallback to first theme
                          const currentTheme = currentAppliedTheme || themes[0];
                          if (!currentTheme) return null;

                          // Show the 4 main colors from the currently applied theme
                          const currentColors = [{
                            color: currentTheme.primary_color,
                            name: 'Primary'
                          }, {
                            color: currentTheme.secondary_color,
                            name: 'Secondary'
                          }, {
                            color: currentTheme.accent_color,
                            name: 'Accent'
                          }, {
                            color: currentTheme.text_color,
                            name: 'Text'
                          }];
                          return currentColors.map((colorInfo, index) => <div key={index} className="w-3 h-3 rounded-full border border-border" style={{
                            backgroundColor: colorInfo.color
                          }} title={`${currentTheme.name} - ${colorInfo.name}: ${colorInfo.color}`} />);
                        })()}
                      </div>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-background border border-border shadow-lg z-50">
                  <DropdownMenuLabel className="text-sm font-medium">Color Themes</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {themes.map(theme => <DropdownMenuItem key={theme.id} onClick={() => handleThemeUpdate(theme.id)} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full border border-border" style={{
                          backgroundColor: theme.primary_color
                        }} />
                        <div className="w-3 h-3 rounded-full border border-border" style={{
                          backgroundColor: theme.secondary_color
                        }} />
                        <div className="w-3 h-3 rounded-full border border-border" style={{
                          backgroundColor: theme.accent_color
                        }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{theme.name}</span>
                        </div>
                      </div>
                    </DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
              </div>}
          </div>

          <TabsContent value="draft">
            {isMobile ? <div className="space-y-4">
                {filteredPosts.map(post => <PostCard key={post.id} post={post} onCopy={() => handleCopyContent(post)} onDelete={() => handleDeletePost(post.id)} onGeneratePrompt={() => openImagePromptModal(post)} onGenerateVoiceover={() => openVoiceoverModal(post)} onFileSelect={(postId, aspectRatio) => handleFileSelect(postId, aspectRatio, post)} onVideoUpload={() => {}} onVideoRemove={() => {}} onImageDelete={handleImageDelete} onImageGenerated={() => onPostsChange()} onStatusChange={(postId, status) => handleStatusChange(postId, status)} onPostsChange={onPostsChange} uploadingStates={flatUploadingStates} isAdmin={isAdmin} />)}
              </div> : <PostsTableView posts={filteredPosts} activeTab={activeTab} creatingBlogIds={creatingBlogIds} isUploading={isUploading} getUploadType={getUploadType} onStatusChange={handleStatusChange} onCopyContent={handleCopyContent} onDeletePost={handleDeletePost} onCreateBlogPost={handleCreateBlogPost} onGenerateVoiceoverScript={openVoiceoverModal} onGenerateImagePrompt={openImagePromptModal} onFileSelect={(postId, aspectRatio, post) => handleFileSelect(postId, aspectRatio, post)} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} onPostsChange={onPostsChange} isAdmin={isAdmin} animatingRows={animatingRows} completingRows={completingRows} getRowAnimationClass={getRowAnimationClass} />}
          </TabsContent>

          <TabsContent value="published">
            {isMobile ? <div className="space-y-4">
                {filteredPosts.map(post => <PostCard key={post.id} post={post} onCopy={() => handleCopyContent(post)} onDelete={() => handleDeletePost(post.id)} onGeneratePrompt={() => openImagePromptModal(post)} onGenerateVoiceover={() => openVoiceoverModal(post)} onFileSelect={(postId, aspectRatio) => handleFileSelect(postId, aspectRatio, post)} onVideoUpload={() => {}} onVideoRemove={() => {}} onImageDelete={handleImageDelete} onImageGenerated={() => onPostsChange()} onStatusChange={(postId, status) => handleStatusChange(postId, status)} onPostsChange={onPostsChange} uploadingStates={flatUploadingStates} isAdmin={isAdmin} />)}
              </div> : <PostsTableView posts={filteredPosts} activeTab={activeTab} creatingBlogIds={creatingBlogIds} isUploading={isUploading} getUploadType={getUploadType} onStatusChange={handleStatusChange} onCopyContent={handleCopyContent} onDeletePost={handleDeletePost} onCreateBlogPost={handleCreateBlogPost} onGenerateVoiceoverScript={openVoiceoverModal} onGenerateImagePrompt={openImagePromptModal} onFileSelect={(postId, aspectRatio, post) => handleFileSelect(postId, aspectRatio, post)} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} onPostsChange={onPostsChange} isAdmin={isAdmin} animatingRows={animatingRows} completingRows={completingRows} getRowAnimationClass={getRowAnimationClass} />}
          </TabsContent>
        </Tabs>
          </div>
        </Card>
      </div>

      {/* System Prompt Viewer Panel */}
      {showSystemPrompt && category && <div className="relative transition-all duration-300" style={{
      width: promptPanelWidth
    }}>
          {/* Resize handle */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-border hover:bg-accent cursor-col-resize z-10" onMouseDown={handleMouseDown} style={{
        background: isResizing ? 'hsl(var(--accent))' : 'hsl(var(--border))',
        width: '4px',
        marginLeft: '-2px'
      }} />
          <SystemPromptViewer category={category} isVisible={showSystemPrompt} onClose={() => setShowSystemPrompt(false)} />
        </div>}

      {/* Modals */}
      <ImagePromptModal isOpen={imagePromptModal.isOpen} onClose={closeImagePromptModal} postId={imagePromptModal.postId} title={imagePromptModal.title} description={imagePromptModal.description} cachedPrompt={imagePromptModal.cachedPrompt} category={imagePromptModal.category} />

      {previewImage && <ImagePreviewModal isOpen={!!previewImage} onClose={closePreviewImage} imageUrl={previewImage.url} alt={previewImage.alt} />}

      {voiceoverModal.isOpen && voiceoverModal.post && <VoiceoverScriptModal isOpen={voiceoverModal.isOpen} onClose={closeVoiceoverModal} sourceId={voiceoverModal.post.id} sourceType="social_media_post" originalContent={`${voiceoverModal.post.title}\n\n${voiceoverModal.post.description}`} />}
    </div>;
};