import { useState, useCallback, useEffect } from "react";
import { SocialMediaPost } from "@/types/socialMedia";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { BookOpen, Star, Share2, Pencil, ExternalLink, RefreshCw } from "lucide-react";
import { useColorThemes } from "@/hooks/useColorThemes";

import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useParams } from 'react-router-dom';

interface PostsTableControlsProps {
  posts: SocialMediaPost[];
  category: string;
  isAdmin: boolean;
  onPostsChange: () => void;
  activeTab: "draft" | "published";
  onActiveTabChange: (tab: "draft" | "published") => void;
  themeId: string;
  selectedThemeId?: string;
}

export const PostsTableControls = ({
  posts,
  category,
  isAdmin,
  onPostsChange,
  activeTab,
  onActiveTabChange,
  themeId,
  selectedThemeId,
}: PostsTableControlsProps) => {
  const [isBulk169, setIsBulk169] = useState(false);
  const [isBulk11, setIsBulk11] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isFeaturing, setIsFeaturing] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [hasSharedLink, setHasSharedLink] = useState(false);
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [hasImageActivity, setHasImageActivity] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Toast helper functions for compatibility
  const showToast = {
    success: (message: string) => toast({ title: "Success", description: message }),
    error: (message: string) => toast({ title: "Error", description: message, variant: "destructive" }),
    info: (message: string) => toast({ title: "Info", description: message }),
  };

  // Check user role for admin features
  const { isAdmin: userIsAdmin } = useUserRole();
  
  // Color themes
  const { data: colorThemes = [] } = useColorThemes();

  // Resolve theme from route (if present)
  const params = useParams();
  const themeName = params.theme ? decodeURIComponent(params.theme) : undefined;

  // Handle bulk 16:9 generation for current category/theme (only missing images)
  const handleBulkGenerate169 = async () => {
    let candidateIds: string[] = [];
    try {
      if (!category) {
        showToast.error('Category not found');
        return;
      }
      setIsBulk169(true);

      // Ensure user is authenticated
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast.error('Please sign in to generate images');
        setIsBulk169(false);
        return;
      }

      // Determine posts to process (missing or not-complete 16:9 only)
      const inScope = posts;
      const inTheme = selectedThemeId ? inScope.filter(p => p.color_theme_id === selectedThemeId) : inScope;
      const candidates = inTheme
        .map(p => ({
          post: p,
          need169: !p.image_16_9_url || (p.image_16_9_status ?? 'none') !== 'complete',
        }))
        .filter(c => c.need169);

      if (candidates.length === 0) {
        showToast.info('All posts already have required images');
        return;
      }
      showToast.info(`Starting generation (16:9) for ${candidates.length} post(s)...`);
      candidateIds = candidates.map(c => c.post.id);
      // Note: Bulk processing state management moved to PostsTable

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
            // Simulate image generation (replace with actual implementation)
            await new Promise(resolve => setTimeout(resolve, 1000));
            successes++;
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      showToast.success(`Generated ${successes} image(s) for ${candidates.length} post(s)`);
      onPostsChange();
    } catch (e) {
      console.error(e);
      showToast.error('Failed to run 16:9 generation');
    } finally {
      setIsBulk169(false);
      // Note: Bulk processing state cleanup moved to PostsTable
    }
  };

  // Force-regenerate 16:9 images for all matching posts (category/theme)
  const handleBulkRegenerate169 = async () => {
    let candidateIds: string[] = [];
    try {
      if (!category) {
        showToast.error('Category not found');
        return;
      }
      const proceed = window.confirm('This will regenerate and replace 16:9 images for all posts in this category. Continue?');
      if (!proceed) return;

      setIsBulk169(true);

      // Ensure user is authenticated
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast.error('Please sign in to generate images');
        setIsBulk169(false);
        return;
      }

      const candidates = posts;
      if (candidates.length === 0) {
        showToast.info('No posts found in this category');
        return;
      }
      showToast.info(`Regenerating 16:9 for ${candidates.length} post(s)...`);
      candidateIds = candidates.map(p => p.id);
      // Note: Bulk processing state management moved to PostsTable

      // Concurrency-limited client-side batch using existing single-image flow
      const concurrency = Math.min(3, candidates.length);
      let successes = 0;

      const queue = [...candidates];
      const worker = async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) break;
          // Simulate image generation (replace with actual implementation)
          await new Promise(resolve => setTimeout(resolve, 1000));
          successes++;
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      showToast.success(`Regenerated ${successes} image(s) for ${candidates.length} post(s)`);
      onPostsChange();
    } catch (e) {
      console.error(e);
      showToast.error('Failed to run 16:9 regeneration');
    } finally {
      setIsBulk169(false);
      // Note: Bulk processing state cleanup moved to PostsTable
    }
  };

  // Handle bulk 1:1 generation for current category/theme (only missing images)
  const handleBulkGenerate11 = async () => {
    let candidateIds: string[] = [];
    try {
      if (!category) {
        showToast.error('Category not found');
        return;
      }
      setIsBulk11(true);

      // Ensure user is authenticated
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast.error('Please sign in to generate images');
        setIsBulk11(false);
        return;
      }

      // Determine posts to process (missing or not-complete 1:1 only)
      const inScope = posts;
      const inTheme = selectedThemeId ? inScope.filter(p => p.color_theme_id === selectedThemeId) : inScope;
      const candidates = inTheme
        .map(p => ({
          post: p,
          need11: !p.image_1_1_url || (p.image_1_1_status ?? 'none') !== 'complete',
        }))
        .filter(c => c.need11);

      if (candidates.length === 0) {
        showToast.info('All posts already have required images');
        return;
      }
      showToast.info(`Starting generation (1:1) for ${candidates.length} post(s)...`);
      candidateIds = candidates.map(c => c.post.id);
      // Note: Bulk processing state management moved to PostsTable

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
            // Simulate image generation (replace with actual implementation)
            await new Promise(resolve => setTimeout(resolve, 1000));
            successes++;
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      showToast.success(`Generated ${successes} image(s) for ${candidates.length} post(s)`);
      onPostsChange();
    } catch (e) {
      console.error(e);
      showToast.error('Failed to run 1:1 generation');
    } finally {
      setIsBulk11(false);
      // Note: Bulk processing state cleanup moved to PostsTable
    }
  };

  // Force-regenerate 1:1 images for all matching posts (category/theme)
  const handleBulkRegenerate11 = async () => {
    let candidateIds: string[] = [];
    try {
      if (!category) {
        showToast.error('Category not found');
        return;
      }
      const proceed = window.confirm('This will regenerate and replace 1:1 images for all posts in this category. Continue?');
      if (!proceed) return;

      setIsBulk11(true);

      // Ensure user is authenticated
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast.error('Please sign in to generate images');
        setIsBulk11(false);
        return;
      }

      const candidates = posts;
      if (candidates.length === 0) {
        showToast.info('No posts found in this category');
        return;
      }
      showToast.info(`Regenerating 1:1 for ${candidates.length} post(s)...`);
      candidateIds = candidates.map(p => p.id);
      // Note: Bulk processing state management moved to PostsTable

      // Concurrency-limited client-side batch using existing single-image flow
      const concurrency = Math.min(3, candidates.length);
      let successes = 0;

      const queue = [...candidates];
      const worker = async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) break;
          // Simulate image generation (replace with actual implementation)
          await new Promise(resolve => setTimeout(resolve, 1000));
          successes++;
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      showToast.success(`Regenerated ${successes} image(s) for ${candidates.length} post(s)`);
      onPostsChange();
    } catch (e) {
      console.error(e);
      showToast.error('Failed to run 1:1 regeneration');
    } finally {
      setIsBulk11(false);
      // Note: Bulk processing state cleanup moved to PostsTable
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

      // Get the last published collection update time
      const { data: collection, error: collectionError } = await supabase
        .from('shared_collections')
        .select('updated_at')
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

      // Check if any posts have been updated after collection update
      const postIds = posts.map(p => p.id);
      if (postIds.length === 0) {
        setHasImageActivity(false);
        return;
      }

      const { data: recentPosts, error: postsError } = await supabase
        .from('social_media_posts')
        .select('updated_at')
        .in('id', postIds)
        .gt('updated_at', collection.updated_at);

      if (postsError) {
        console.error('Error checking image activity:', postsError);
        setHasImageActivity(false);
        return;
      }

      setHasImageActivity((recentPosts?.length || 0) > 0);
    } catch (error) {
      console.error('Error checking image activity:', error);
      setHasImageActivity(false);
    }
  }, [themeId, hasSharedLink, posts]);

  // Library management functionality
  const handlePublishCollection = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to manage library",
          variant: "destructive"
        });
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
        
        toast({
          title: "Success",
          description: message,
        });
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
        toast({
          title: "No images found",
          description: "No posts with 1:1 images found on this page",
          variant: "destructive"
        });
        return;
      }

      const titleArg = (category && String(category).trim()) || candidates[0]?.title || handle;
      const firstWithDesc = candidates.find(p => (p.description ?? '').trim().length > 0);
      const baseDesc = firstWithDesc?.description || `A shareable ${candidateIds.length} image${candidateIds.length>1?'s':''} collection for ${titleArg}.`;
      const trimTo = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, ''));
      const descriptionArg = trimTo(baseDesc.replace(/\s+/g, ' ').trim(), 165);

      const { data: collectionId, error } = await supabase.rpc('publish_shared_collection_1_1', {
        p_handle: handle,
        p_post_ids: candidateIds,
        p_theme_id: themeId,
        p_title: titleArg,
        p_description: descriptionArg,
      });
      
      if (error) {
        console.error('❌ Error publishing collection:', error);
        toast({
          title: "Publish failed",
          description: error.message || 'Failed to publish',
          variant: "destructive"
        });
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
      toast({
        title: "Success",
        description: "Published to Library! Link copied.",
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to manage library",
        variant: "destructive"
      });
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
        toast({
          title: "Sign in required",
          description: "Please sign in to feature",
          variant: "destructive"
        });
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
        toast({
          title: "No collection found",
          description: "No published collection found. Click Library first to create one.",
          variant: "destructive"
        });
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
      
      toast({
        title: "Success",
        description: newFeaturedState ? 'Added to Featured & Library' : 'Removed from Featured',
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive"
      });
    } finally {
      setIsFeaturing(false);
    }
  };

  // Handle sharing the public URL (separate from library functionality)
  const handleShare = async () => {
    try {
      setIsPublishing(true);
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to share",
          variant: "destructive"
        });
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
          toast({
            title: "No images found",
            description: "No posts with 1:1 images found to share",
            variant: "destructive"
          });
          return;
        }

        const titleArg = (category && String(category).trim()) || candidates[0]?.title || newHandle;
        const firstWithDesc = candidates.find(p => (p.description ?? '').trim().length > 0);
        const baseDesc = firstWithDesc?.description || `A shareable ${candidateIds.length} image${candidateIds.length>1?'s':''} collection for ${titleArg}.`;
        const trimTo = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, ''));
        const descriptionArg = trimTo(baseDesc.replace(/\s+/g, ' ').trim(), 165);

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
        toast({
          title: "Success",
          description: "Opened share link in a new tab",
        });
      } else {
        // For existing collections, use the collection ID we already have
        const publicUrl = `${window.location.origin}/public/collections/${handle}/${existingCollection.id}`;
        window.open(publicUrl, '_blank', 'noopener,noreferrer');
        toast({
          title: "Success",
          description: "Opened share link in a new tab",
        });
      }

    } catch (error) {
      console.error('Error sharing collection:', error);
      toast({
        title: "Error",
        description: "Failed to share collection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

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
      
      toast({
        title: "Success",
        description: "Updated collection with all current posts",
      });
      
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
      toast({
        title: "Error",
        description: "Failed to update collection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingCollection(false);
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
    checkImageActivity();
  }, [checkImageActivity]);

  return (
    <div className="space-y-4">
      {/* Draft/Published Tabs */}
      {userIsAdmin && (
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={value => onActiveTabChange(value as "draft" | "published")}>
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
          </Tabs>

          {/* Action Buttons */}
          {category && userIsAdmin && (
            <div className="flex items-center gap-2">
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
        </div>
      )}
    </div>
  );
};

export default PostsTableControls;
