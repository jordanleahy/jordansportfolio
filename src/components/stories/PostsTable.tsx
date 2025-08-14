// Enhanced PostsTable with view toggle support
import { useState, useCallback, useEffect } from "react";
import { SocialMediaPost } from "@/types/socialMedia";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Eye, BookOpen, Star, Share2, Pencil, ExternalLink, RefreshCw } from "lucide-react";
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
import { optimizedSocialMediaService } from "@/services/optimizedSocialMediaService";

import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { VoiceoverScriptModal } from "@/components/voiceover/VoiceoverScriptModal";
import { useRowAnimations } from "@/hooks/useRowAnimations";
import { SystemPromptViewer } from "./SystemPromptViewer";
import { IndividualPromptViewer } from "./IndividualPromptViewer";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { PostsTableProps } from '@/types/stories';
import { useParams } from 'react-router-dom';
import { ManualPostForm } from './ManualPostForm';


export const PostsTable = ({
  posts,
  onPostsChange,
  isAdmin = false,
  category,
  themeId,
  selectedThemeId,
  onThemeChange,
}: PostsTableProps) => {
  const [activeTab, setActiveTab] = useState<"draft" | "published">("draft");
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [promptPanelWidth, setPromptPanelWidth] = useState(400); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const isMobile = useIsMobile();
  const [isBulk169, setIsBulk169] = useState(false);
  const [isBulk11, setIsBulk11] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isFeaturing, setIsFeaturing] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [hasSharedLink, setHasSharedLink] = useState(false);
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [hasImageActivity, setHasImageActivity] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);
  
  // Check user role for admin features
  const { isAdmin: userIsAdmin } = useUserRole();

  // Handle edit post
  const handleEditPost = async (updatedPost: SocialMediaPost) => {
    try {
      await optimizedSocialMediaService.updatePost(updatedPost.id, {
        title: updatedPost.title,
        description: updatedPost.description
      });
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

  // Custom function to check processing state before opening prompt panel
  const openIndividualPromptPanel = useCallback((post: SocialMediaPost) => {
    // Check if any regeneration is in progress for this post
    if (isProcessing(post.id, 'generate') || isProcessing(post.id, 'regenerate_prompt')) {
      toast.error("Cannot open prompt viewer while image regeneration is in progress");
      return;
    }
    originalOpenIndividualPromptPanel(post);
  }, [isProcessing, originalOpenIndividualPromptPanel]);
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

// Resolve theme from route (if present)
const params = useParams();
const themeName = params.theme ? decodeURIComponent(params.theme) : undefined;

// themeId is now a required prop; no longer derived from posts

const { handleGenerateImage } = useImageManager({
  onPostsChange,
  themeName,
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
    let candidateIds: string[] = [];
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
      const inScope = posts; // already scoped by current page (theme or category)
      const inTheme = selectedThemeId ? inScope.filter(p => p.color_theme_id === selectedThemeId) : inScope;
      const statusDist = inTheme.reduce((acc, p) => {
        const s = (p.image_16_9_status ?? 'none');
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const withUrl = inTheme.filter(p => !!p.image_16_9_url).length;
      const withoutUrl = inTheme.length - withUrl;
      console.groupCollapsed('[Bulk 16:9] Generate missing only – filter debug');
      console.info('Filters', { category, selectedThemeId, note: 'Using posts array as scope; theme filter = color_theme_id' });
      console.info('Counts', { total: posts.length, inScope: inScope.length, withUrl, withoutUrl, statusDist });
      console.table(inTheme.map(p => ({ id: p.id, day: p.day ?? '', theme: p.theme_id, color_theme: p.color_theme_id, hasUrl: !!p.image_16_9_url, status: p.image_16_9_status ?? 'none' })));
      console.groupEnd();
      const candidates = inTheme
        .map(p => ({
          post: p,
          need169: !p.image_16_9_url || (p.image_16_9_status ?? 'none') !== 'complete',
        }))
        .filter(c => c.need169);

      if (candidates.length === 0) {
        console.warn('[Bulk] No candidates (generate missing only)', { category, selectedThemeId, reason: 'All posts have required images', counts: { inTheme: inTheme.length } });
        toast.info('All posts already have required images');
        return;
      }
      toast.info(`Starting generation (16:9) for ${candidates.length} post(s)...`);
      candidateIds = candidates.map(c => c.post.id);
      candidateIds.forEach(id => setBulkProcessing(id, true));

      // Concurrency-limited client-side batch using existing single-image flow
      const concurrency = Math.min(3, candidates.length);
      let successes = 0;

      const queue = [...candidates];
      const worker = async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) break;
          const { post, need169 } = next as any;
          if (need169) {
            const r1 = await handleGenerateImage(post.id, '16_9', post.title, post.description, post.category);
            if (r1.success) successes++;
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      toast.success(`Generated ${successes} image(s) for ${candidates.length} post(s)`);
      onPostsChange();
    } catch (e) {
      console.error(e);
      toast.error('Failed to run 16:9 generation');
    } finally {
      setIsBulk169(false);
      try { candidateIds.forEach(id => setBulkProcessing(id, false)); } catch {}
    }
  };

  // Force-regenerate 16:9 images for all matching posts (category/theme)
  const handleBulkRegenerate169 = async () => {
    let candidateIds: string[] = [];
    try {
      if (!category) {
        toast.error('Category not found');
        return;
      }
      const proceed = window.confirm('This will regenerate and replace 16:9 images for all posts in this category (ignores theme filter). Continue?');
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

      // Determine posts to process (ALL posts visible on this page, ignoring color theme)
      const inScope = posts;
      const statusDist = inScope.reduce((acc, p) => {
        const s = (p.image_16_9_status ?? 'none');
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const withUrl = inScope.filter(p => !!p.image_16_9_url).length;
      const withoutUrl = inScope.length - withUrl;
      console.groupCollapsed('[Bulk 16:9] Regenerate all – filter debug');
      console.info('Filters', { category, selectedThemeId, note: 'Theme filter ignored; using posts array as scope' });
      console.info('Counts', { total: posts.length, inScope: inScope.length, withUrl, withoutUrl, statusDist });
      console.table(inScope.map(p => ({ id: p.id, day: p.day ?? '', theme: p.theme_id, color_theme: p.color_theme_id, hasUrl: !!p.image_16_9_url, status: p.image_16_9_status ?? 'none' })));
      console.groupEnd();
      const candidates = inScope;

      if (candidates.length === 0) {
        console.warn('[Bulk 16:9] No candidates (regenerate all)', { category, counts: { inScope: inScope.length } });
        toast.info('No posts found in this category');
        return;
      }
      toast.info(`Regenerating 16:9 for ${candidates.length} post(s)...`);
      candidateIds = candidates.map(p => p.id);
      candidateIds.forEach(id => setBulkProcessing(id, true));

      // Concurrency-limited client-side batch using existing single-image flow
      const concurrency = Math.min(3, candidates.length);
      let successes = 0;

      const queue = [...candidates];
      const worker = async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) break;
          const r1 = await handleGenerateImage(next.id, '16_9', next.title, next.description, next.category);
          if (r1.success) successes++;
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      toast.success(`Regenerated ${successes} image(s) for ${candidates.length} post(s)`);
      onPostsChange();
    } catch (e) {
      console.error(e);
      toast.error('Failed to run 16:9 regeneration');
    } finally {
      setIsBulk169(false);
      try { candidateIds.forEach(id => setBulkProcessing(id, false)); } catch {}

    }
  };

  // Handle bulk 1:1 generation for current category/theme (only missing images)
  const handleBulkGenerate11 = async () => {
    let candidateIds: string[] = [];
    try {
      if (!category) {
        toast.error('Category not found');
        return;
      }
      setIsBulk11(true);

      // Ensure user is authenticated
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to generate images');
        setIsBulk11(false);
        return;
      }

      // Determine posts to process (missing or not-complete 1:1 only)
      const inScope = posts; // already scoped by current page (theme or category)
      const inTheme = selectedThemeId ? inScope.filter(p => p.color_theme_id === selectedThemeId) : inScope;
      const statusDist = inTheme.reduce((acc, p) => {
        const s = (p.image_1_1_status ?? 'none');
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const withUrl = inTheme.filter(p => !!p.image_1_1_url).length;
      const withoutUrl = inTheme.length - withUrl;
      console.groupCollapsed('[Bulk 1:1] Generate missing only – filter debug');
      console.info('Filters', { category, selectedThemeId, note: 'Using posts array as scope; theme filter = color_theme_id' });
      console.info('Counts', { total: posts.length, inScope: inScope.length, withUrl, withoutUrl, statusDist });
      console.table(inTheme.map(p => ({ id: p.id, day: p.day ?? '', theme: p.theme_id, color_theme: p.color_theme_id, hasUrl: !!p.image_1_1_url, status: p.image_1_1_status ?? 'none' })));
      console.groupEnd();
      const candidates = inTheme
        .map(p => ({
          post: p,
          need11: !p.image_1_1_url || (p.image_1_1_status ?? 'none') !== 'complete',
        }))
        .filter(c => c.need11);

      if (candidates.length === 0) {
        console.warn('[Bulk] No candidates (generate missing only)', { category, selectedThemeId, reason: 'All posts have required images', counts: { inTheme: inTheme.length } });
        toast.info('All posts already have required images');
        return;
      }
      toast.info(`Starting generation (1:1) for ${candidates.length} post(s)...`);
      candidateIds = candidates.map(c => c.post.id);
      candidateIds.forEach(id => setBulkProcessing(id, true));

      // Concurrency-limited client-side batch using existing single-image flow
      const concurrency = Math.min(3, candidates.length);
      let successes = 0;

      const queue = [...candidates];
      const worker = async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) break;
          const { post, need11 } = next as any;
          if (need11) {
            const r1 = await handleGenerateImage(post.id, '1_1', post.title, post.description, post.category);
            if (r1.success) successes++;
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      toast.success(`Generated ${successes} image(s) for ${candidates.length} post(s)`);
      onPostsChange();
    } catch (e) {
      console.error(e);
      toast.error('Failed to run 1:1 generation');
    } finally {
      setIsBulk11(false);
      try { candidateIds.forEach(id => setBulkProcessing(id, false)); } catch {}
    }
  };

  // Force-regenerate 1:1 images for all matching posts (category/theme)
  const handleBulkRegenerate11 = async () => {
    let candidateIds: string[] = [];
    try {
      if (!category) {
        toast.error('Category not found');
        return;
      }
      const proceed = window.confirm('This will regenerate and replace 1:1 images for all posts in this category (ignores theme filter). Continue?');
      if (!proceed) return;

      setIsBulk11(true);

      // Ensure user is authenticated
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to generate images');
        setIsBulk11(false);
        return;
      }

      // Determine posts to process (ALL posts visible on this page, ignoring color theme)
      const inScope = posts;
      const statusDist = inScope.reduce((acc, p) => {
        const s = (p.image_1_1_status ?? 'none');
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const withUrl = inScope.filter(p => !!p.image_1_1_url).length;
      const withoutUrl = inScope.length - withUrl;
      console.groupCollapsed('[Bulk 1:1] Regenerate all – filter debug');
      console.info('Filters', { category, selectedThemeId, note: 'Theme filter ignored; using posts array as scope' });
      console.info('Counts', { total: posts.length, inScope: inScope.length, withUrl, withoutUrl, statusDist });
      console.table(inScope.map(p => ({ id: p.id, day: p.day ?? '', theme: p.theme_id, color_theme: p.color_theme_id, hasUrl: !!p.image_1_1_url, status: p.image_1_1_status ?? 'none' })));
      console.groupEnd();
      const candidates = inScope;

      if (candidates.length === 0) {
        console.warn('[Bulk 1:1] No candidates (regenerate all)', { category, counts: { inScope: inScope.length } });
        toast.info('No posts found in this category');
        return;
      }
      toast.info(`Regenerating 1:1 for ${candidates.length} post(s)...`);
      candidateIds = candidates.map(p => p.id);
      candidateIds.forEach(id => setBulkProcessing(id, true));

      // Concurrency-limited client-side batch using existing single-image flow
      const concurrency = Math.min(3, candidates.length);
      let successes = 0;

      const queue = [...candidates];
      const worker = async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) break;
          const r1 = await handleGenerateImage(next.id, '1_1', next.title, next.description, next.category);
          if (r1.success) successes++;
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      toast.success(`Regenerated ${successes} image(s) for ${candidates.length} post(s)`);
      onPostsChange();
    } catch (e) {
      console.error(e);
      toast.error('Failed to run 1:1 regeneration');
    } finally {
      setIsBulk11(false);
      try { candidateIds.forEach(id => setBulkProcessing(id, false)); } catch {}

    }
  };

  // Publish 16:9 collection (exactly 10 posts)
  // Publish/remove from library toggle
  const handlePublishCollection = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to manage library');
        return;
      }

      setIsPublishing(true);

      // Check if we already have a published collection for this theme to toggle
      const { data: existing, error: checkErr } = await supabase
        .from('shared_collections')
        .select('id, include_in_library, featured')
        .eq('user_id', session.user.id)
        .eq('status', 'published')
        .eq('theme_id', themeId)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkErr) throw checkErr;

      if (existing) {
        const newLibraryState = !existing.include_in_library;
        
        // If removing from library and it's featured, also remove from featured
        const updateData = newLibraryState
          ? { include_in_library: true }
          : { include_in_library: false, featured: false };

        const { error: updateErr } = await supabase
          .from('shared_collections')
          .update(updateData)
          .eq('id', existing.id);

        if (updateErr) throw updateErr;
        
        // Update local state
        setIsInLibrary(newLibraryState);
        if (!newLibraryState) {
          setIsFeatured(false); // Can't be featured if not in library
        }
        
        const message = newLibraryState 
          ? 'Added to Library' 
          : existing.featured 
            ? 'Removed from Library & Featured' 
            : 'Removed from Library';
        
        toast.success(message);
        return;
      }

      // Create new collection if none exists
      const rawHandle = (session.user.user_metadata?.preferred_username
        || session.user.email?.split('@')[0]
        || session.user.id.slice(0, 8)) as string;
      const handle = rawHandle.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 32).replace(/^-+|-+$/g, '') || session.user.id.slice(0, 8);

      const scoped = selectedThemeId ? posts.filter(p => p.color_theme_id === selectedThemeId) : posts;
      const candidates = scoped.filter(p => !!p.image_1_1_url);
      const candidateIds = candidates.map(p => p.id);
      
      if (candidateIds.length === 0) {
        toast.error('No posts with 1:1 images found on this page');
        return;
      }

      const titleArg = (category && String(category).trim()) || candidates[0]?.title || handle;
      const firstWithDesc = candidates.find(p => (p.description ?? '').trim().length > 0);
      const baseDesc = firstWithDesc?.description || `A shareable ${candidateIds.length} image${candidateIds.length>1?'s':''} collection for ${titleArg}.`;
      const trimTo = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, ''));
      const descriptionArg = trimTo(baseDesc.replace(/\s+/g, ' ').trim(), 165);

      console.log('🔍 Publishing collection with params:', {
        p_handle: handle,
        p_post_ids: candidateIds,
        p_theme_id: themeId,
        p_title: titleArg,
        p_description: descriptionArg,
      });

      const { data: collectionId, error } = await supabase.rpc('publish_shared_collection_1_1', {
        p_handle: handle,
        p_post_ids: candidateIds,
        p_theme_id: themeId,
        p_title: titleArg,
        p_description: descriptionArg,
      });
      
      if (error) {
        console.error('❌ Error publishing collection:', error);
        toast.error(error.message || 'Failed to publish');
        return;
      }
      const { error: includeErr } = await supabase
        .from('shared_collections')
        .update({ include_in_library: true })
        .eq('id', collectionId);
      
      if (includeErr) {
        console.warn('Failed to add to Library', includeErr);
      }
      
      setIsInLibrary(true);
      const publicUrl = `${window.location.origin}/public/collections/${handle}/${collectionId}`;
      try { await navigator.clipboard.writeText(publicUrl); } catch {}
      toast.success('Published to Library! Link copied.');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to manage library');
    } finally {
      setIsPublishing(false);
    }
  };

  // Check current featured and library status for this theme
  const checkCollectionStatus = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: latest, error } = await supabase
        .from('shared_collections')
        .select('id, featured, include_in_library')
        .eq('user_id', session.user.id)
        .eq('status', 'published')
        .eq('theme_id', themeId)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && latest) {
        setIsFeatured(latest.featured || false);
        setIsInLibrary(latest.include_in_library || false);
        setHasSharedLink(true);
        setCollectionId(latest.id);

        // Check if there are new posts not in the collection
        const { data: collectionItems, error: itemsError } = await supabase
          .from('shared_collection_items')
          .select('post_id')
          .eq('collection_id', latest.id);

        if (!itemsError && collectionItems) {
          const collectionPostIds = new Set(collectionItems.map(item => item.post_id));
          const currentPostsWithImages = posts.filter(p => !!p.image_1_1_url);
          const newPosts = currentPostsWithImages.filter(p => !collectionPostIds.has(p.id));
          setNewPostsCount(newPosts.length);
        }
      } else {
        setHasSharedLink(false);
        setCollectionId(null);
        setNewPostsCount(0);
      }
    } catch (e) {
      console.error('Failed to check collection status', e);
    }
  };

  // Check for image generation activity since last publish
  const checkImageActivity = useCallback(async () => {
    if (!themeId || !hasSharedLink) {
      setHasImageActivity(false);
      return;
    }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      // Get the last published collection with its items
      const { data: collection, error: collectionError } = await supabase
        .from('shared_collections')
        .select('id, updated_at')
        .eq('user_id', session.user.id)
        .eq('status', 'published')
        .eq('theme_id', themeId)
        .order('published_at', { ascending: false })
        .limit(1)
        .single();

      if (collectionError || !collection) {
        setHasImageActivity(false);
        return;
      }

      // Get the current collection items to compare image URLs
      const { data: collectionItems, error: itemsError } = await supabase
        .from('shared_collection_items')
        .select('post_id, image_1_1_url')
        .eq('collection_id', collection.id);

      if (itemsError) {
        console.error('Error fetching collection items:', itemsError);
        setHasImageActivity(false);
        return;
      }

      // Create a map of post_id to published image URL
      const publishedImageUrls = new Map(
        collectionItems?.map(item => [item.post_id, item.image_1_1_url]) || []
      );

      // Check if any current posts have different image URLs than what was published
      const postsWithImages = posts.filter(p => !!p.image_1_1_url);
      const hasImageChanges = postsWithImages.some(post => {
        const publishedUrl = publishedImageUrls.get(post.id);
        return !publishedUrl || publishedUrl !== post.image_1_1_url;
      });

      // Also check if there are new posts with images that weren't in the collection
      const currentPostIds = new Set(postsWithImages.map(p => p.id));
      const publishedPostIds = new Set(publishedImageUrls.keys());
      const hasNewPosts = Array.from(currentPostIds).some(id => !publishedPostIds.has(id));

      setHasImageActivity(hasImageChanges || hasNewPosts);
    } catch (error) {
      console.error('Error checking image activity:', error);
      setHasImageActivity(false);
    }
  }, [themeId, hasSharedLink, posts]);

  // Handle updating existing collection with new posts
  const handleUpdateCollection = async () => {
    if (!collectionId) return;
    
    try {
      setIsUpdatingCollection(true);
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: updatedCollectionId, error } = await supabase.rpc('update_shared_collection_1_1', {
        p_collection_id: collectionId,
        p_theme_id: themeId,
      });

      if (error) {
        throw error;
      }

      // Refresh collection status to update the UI
      await checkCollectionStatus();
      
      toast.success(`Updated collection with all current posts`);
      
      // Open the updated collection
      const { data: collectionData, error: fetchError } = await supabase
        .from('shared_collections')
        .select('handle')
        .eq('id', updatedCollectionId)
        .single();
        
      if (!fetchError && collectionData) {
        const publicUrl = `${window.location.origin}/public/collections/${collectionData.handle}/${updatedCollectionId}`;
        window.open(publicUrl, '_blank', 'noopener,noreferrer');
      }
      
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('Failed to update collection. Please try again.');
    } finally {
      setIsUpdatingCollection(false);
    }
  };

  // Handle sharing the public URL (separate from library functionality)
  const handleShare = async () => {
    try {
      setIsPublishing(true);
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to share');
        return;
      }

      // Check if there's already a published collection for this theme
      let existingCollection = null;
      if (themeId) {
        const { data, error: checkError } = await supabase
          .from('shared_collections')
          .select('handle, id')
          .eq('user_id', session.user.id)
          .eq('status', 'published')
          .eq('theme_id', themeId)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          // Only throw if it's not a "no rows returned" error
          if (checkError.code !== 'PGRST116') {
            console.error('Error checking existing collection:', checkError);
          }
        } else {
          existingCollection = data;
        }
      }

      let handle = existingCollection?.handle;

      // If no published collection exists, create one first
      if (!existingCollection) {
        const rawHandle = (session.user.user_metadata?.preferred_username
          || session.user.email?.split('@')[0]
          || session.user.id.slice(0, 8)) as string;
        const newHandle = rawHandle.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 32).replace(/^-+|-+$/g, '') || session.user.id.slice(0, 8);

        const scoped = selectedThemeId ? posts.filter(p => p.color_theme_id === selectedThemeId) : posts;
        const candidates = scoped.filter(p => !!p.image_1_1_url);
        const candidateIds = candidates.map(p => p.id);
        
        if (candidateIds.length === 0) {
          toast.error('No posts with 1:1 images found to share');
          return;
        }

        const titleArg = (category && String(category).trim()) || candidates[0]?.title || newHandle;
        const firstWithDesc = candidates.find(p => (p.description ?? '').trim().length > 0);
        const baseDesc = firstWithDesc?.description || `A shareable ${candidateIds.length} image${candidateIds.length>1?'s':''} collection for ${titleArg}.`;
        const trimTo = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, ''));
        const descriptionArg = trimTo(baseDesc.replace(/\s+/g, ' ').trim(), 165);

        console.log('🔍 Sharing collection with params:', {
          p_handle: newHandle,
          p_post_ids: candidateIds,
          p_theme_id: themeId,
          p_title: titleArg,
          p_description: descriptionArg,
        });

        const { data: collectionId, error } = await supabase.rpc('publish_shared_collection_1_1', {
          p_handle: newHandle,
          p_post_ids: candidateIds,
          p_theme_id: themeId,
          p_title: titleArg,
          p_description: descriptionArg,
        });

        if (error) {
          console.error('❌ Error sharing collection:', error);
          throw error;
        }

        handle = newHandle;
        setHasSharedLink(true);
        setCollectionId(collectionId);
        const publicUrl = `${window.location.origin}/public/collections/${handle}/${collectionId}`;
        window.open(publicUrl, '_blank', 'noopener,noreferrer');
        toast.success('Opened share link in a new tab');
      } else {
        // For existing collections, check if we need to update with new images
        if (hasImageActivity) {
          console.log('🔄 Updating existing collection with new images');
          await handleUpdateCollection();
        } else {
          // No changes, just open the existing collection
          const publicUrl = `${window.location.origin}/public/collections/${handle}/${existingCollection.id}`;
          window.open(publicUrl, '_blank', 'noopener,noreferrer');
          toast.success('Opened share link in a new tab');
        }
      }

    } catch (error) {
      console.error('Error sharing collection:', error);
      toast.error('Failed to share collection. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Feature/unfeature the latest published collection for this theme
  const handleFeatureLatestCollection = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to feature');
        return;
      }
      setIsFeaturing(true);
      
      // Find most recent published shared collection for this theme
      const { data: latest, error: selErr } = await supabase
        .from('shared_collections')
        .select('id, featured, include_in_library')
        .eq('user_id', session.user.id)
        .eq('status', 'published')
        .eq('theme_id', themeId)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (selErr) throw selErr;
      if (!latest) {
        toast.error('No published collection found. Click Library first to create one.');
        return;
      }

      const newFeaturedState = !latest.featured;
      
      // If featuring, ensure it's also in library. If unfeaturing, keep library status as is
      const updateData = newFeaturedState 
        ? { featured: true, include_in_library: true }
        : { featured: false };
        
      const { error: updErr } = await supabase
        .from('shared_collections')
        .update(updateData)
        .eq('id', latest.id);
      
      if (updErr) throw updErr;
      
      // Update local state
      setIsFeatured(newFeaturedState);
      if (newFeaturedState) {
        setIsInLibrary(true); // Featured items are always in library
      }
      
      toast.success(newFeaturedState ? 'Added to Featured & Library' : 'Removed from Featured');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update featured status');
    } finally {
      setIsFeaturing(false);
    }
  };

  // Check collection status on mount and when theme changes or posts change
  useEffect(() => {
    if (userIsAdmin && category) {
      checkCollectionStatus();
    }
  }, [selectedThemeId, category, userIsAdmin, posts]);

  // Check for image activity when collection status or posts change
  useEffect(() => {
    if (userIsAdmin && category) {
      checkImageActivity();
    }
  }, [checkImageActivity, userIsAdmin, category]);

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
                    
                    <ViewToggle
                      currentView={viewMode}
                      onViewChange={setViewMode}
                    />
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
                      variant={isFeatured ? "default" : "outline"}
                      size="icon"
                      onClick={handleFeatureLatestCollection}
                      disabled={isFeaturing}
                      aria-label={isFeatured ? "Remove from Featured" : "Add to Featured"}
                      title={isFeaturing ? 'Updating…' : (isFeatured ? 'Remove from Featured' : 'Add to Featured')}
                    >
                      <Star className={`h-4 w-4 ${isFeatured ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      variant={isInLibrary ? "default" : "outline"}
                      size="icon"
                      onClick={handlePublishCollection}
                      disabled={isPublishing}
                      aria-label={isInLibrary ? "Remove from Library" : "Add to Library"}
                      title={isPublishing ? 'Updating…' : (isInLibrary ? 'Remove from Library' : 'Add to Library')}
                    >
                      <BookOpen className={`h-4 w-4 ${isInLibrary ? 'fill-current' : ''}`} />
                    </Button>
                    {hasSharedLink && newPostsCount > 0 ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleUpdateCollection}
                        disabled={isUpdatingCollection}
                        className="gap-1 text-xs"
                        aria-label={`Update & Share (${newPostsCount} new images)`}
                        title={`Update collection with ${newPostsCount} new images and open in new tab`}
                      >
                        <Share2 className="h-3 w-3" />
                        Update ({newPostsCount})
                      </Button>
                     ) : (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleShare}
                        disabled={isPublishing}
                        aria-label={
                          !hasSharedLink 
                            ? "Share" 
                            : hasImageActivity 
                              ? "Update & Open" 
                              : "Open"
                        }
                        title={
                          !hasSharedLink 
                            ? "Publish collection and open in new tab" 
                            : hasImageActivity 
                              ? "Update collection with new images and open in new tab" 
                              : "Open collection in new tab"
                        }
                      >
                        {!hasSharedLink ? (
                          <ExternalLink className="h-4 w-4" />
                        ) : hasImageActivity ? (
                          <RefreshCw className="h-4 w-4" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                      </Button>
                     )}
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
                      <ViewToggle
                        currentView={viewMode}
                        onViewChange={setViewMode}
                      />
                      
                      {/* Manual Post Creation */}
                      <ManualPostForm 
                        category={category}
                        themeId={selectedThemeId}
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
                          variant={isFeatured ? "default" : "outline"}
                          size="sm"
                          onClick={handleFeatureLatestCollection}
                          disabled={isFeaturing}
                          className="rounded-sm px-3 text-xs sm:text-sm"
                          aria-label={isFeatured ? "Remove from Featured" : "Add to Featured"}
                          title={isFeaturing ? 'Updating…' : (isFeatured ? 'Remove from Featured' : 'Add to Featured')}
                        >
                          <Star className={`h-3 w-3 ${isFeatured ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          variant={isInLibrary ? "default" : "outline"}
                          size="icon"
                          onClick={handlePublishCollection}
                          disabled={isPublishing}
                          className=""
                          aria-label={isInLibrary ? "Remove from Library" : "Add to Library"}
                          title={isPublishing ? 'Updating…' : (isInLibrary ? 'Remove from Library' : 'Add to Library')}
                        >
                          <BookOpen className={`h-4 w-4 ${isInLibrary ? 'fill-current' : ''}`} />
                        </Button>
                        {hasSharedLink && newPostsCount > 0 ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleUpdateCollection}
                            disabled={isUpdatingCollection}
                            className="gap-1 text-xs"
                            aria-label={`Update & Share (${newPostsCount} new images)`}
                            title={`Update collection with ${newPostsCount} new images and open in new tab`}
                          >
                            <Share2 className="h-3 w-3" />
                            Update ({newPostsCount})
                          </Button>
                         ) : (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={handleShare}
                            disabled={isPublishing}
                            className=""
                            aria-label={
                              !hasSharedLink 
                                ? "Share" 
                                : hasImageActivity 
                                  ? "Update & Open" 
                                  : "Open"
                            }
                            title={
                              !hasSharedLink 
                                ? "Publish collection and open in new tab" 
                                : hasImageActivity 
                                  ? "Update collection with new images and open in new tab" 
                                  : "Open collection in new tab"
                            }
                          >
                            {!hasSharedLink ? (
                              <ExternalLink className="h-4 w-4" />
                            ) : hasImageActivity ? (
                              <RefreshCw className="h-4 w-4" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                          </Button>
                         )}
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
                      <PostsTableView posts={filteredPosts} activeTab={activeTab} creatingBlogIds={creatingBlogIds} onStatusChange={handleStatusChange} onCopyContent={handleCopyContent} onDeletePost={handleDeletePost} onCreateBlogPost={handleCreateBlogPost} onGenerateVoiceoverScript={openVoiceoverModal} onGenerateImagePrompt={openIndividualPromptPanel} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} onPostsChange={onPostsChange} isAdmin={userIsAdmin} animatingRows={animatingRows} completingRows={completingRows} getRowAnimationClass={getRowAnimationClass} blogStatuses={blogStatuses} onEditPost={handleEditPost} />
                    ) : (
                      <PostsCardView posts={filteredPosts} activeTab={activeTab} creatingBlogIds={creatingBlogIds} onStatusChange={handleStatusChange} onCopyContent={handleCopyContent} onDeletePost={handleDeletePost} onCreateBlogPost={handleCreateBlogPost} onGenerateVoiceoverScript={openVoiceoverModal} onGenerateImagePrompt={openIndividualPromptPanel} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} onPostsChange={onPostsChange} isAdmin={userIsAdmin} animatingRows={animatingRows} completingRows={completingRows} getRowAnimationClass={getRowAnimationClass} blogStatuses={blogStatuses} onEditPost={handleEditPost} />
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
                      <PostsTableView posts={filteredPosts} activeTab={activeTab} creatingBlogIds={creatingBlogIds} onStatusChange={handleStatusChange} onCopyContent={handleCopyContent} onDeletePost={handleDeletePost} onCreateBlogPost={handleCreateBlogPost} onGenerateVoiceoverScript={openVoiceoverModal} onGenerateImagePrompt={openIndividualPromptPanel} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} onPostsChange={onPostsChange} isAdmin={userIsAdmin} animatingRows={animatingRows} completingRows={completingRows} getRowAnimationClass={getRowAnimationClass} blogStatuses={blogStatuses} onEditPost={handleEditPost} />
                    ) : (
                      <PostsCardView posts={filteredPosts} activeTab={activeTab} creatingBlogIds={creatingBlogIds} onStatusChange={handleStatusChange} onCopyContent={handleCopyContent} onDeletePost={handleDeletePost} onCreateBlogPost={handleCreateBlogPost} onGenerateVoiceoverScript={openVoiceoverModal} onGenerateImagePrompt={openIndividualPromptPanel} onGenerateImage={handleGenerateImage} onPreviewImage={openPreviewImage} onPostsChange={onPostsChange} isAdmin={userIsAdmin} animatingRows={animatingRows} completingRows={completingRows} getRowAnimationClass={getRowAnimationClass} blogStatuses={blogStatuses} onEditPost={handleEditPost} />
                    )
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
            theme={category} 
            themeId={themeId}
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
            themeId={themeId}
          />
        </div>
      )}

      {previewImage && <ImagePreviewModal isOpen={!!previewImage} onClose={closePreviewImage} imageUrl={previewImage.url} alt={previewImage.alt} />}

      {voiceoverModal.isOpen && voiceoverModal.post && <VoiceoverScriptModal isOpen={voiceoverModal.isOpen} onClose={closeVoiceoverModal} sourceId={voiceoverModal.post.id} sourceType="social_media_post" originalContent={`${voiceoverModal.post.title}\n\n${voiceoverModal.post.description}`} />}

      {/* Edit Post Modal */}
      <PostEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        post={selectedPost}
        onSuccess={handleEditSuccess}
      />

    </div>
  );
};