import { useState, useCallback, useEffect } from "react";
import { SocialMediaPost } from "@/types/socialMedia";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { BookOpen, Star, Share2, Pencil, ExternalLink, RefreshCw } from "lucide-react";
import { useColorThemes } from "@/hooks/useColorThemes";
import { useImageManager } from "@/hooks/useImageManager";
import { useProcessingStatesContext } from "@/contexts/ProcessingStatesContext";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useParams } from 'react-router-dom';

interface PostsTableControlsProps {
  posts: SocialMediaPost[];
  category: string;
  isAdmin: boolean;
  onPostsChange: () => void;
  activeTab: "draft" | "published";
  onActiveTabChange: (tab: "draft" | "published") => void;
}

export const PostsTableControls = ({
  posts,
  category,
  isAdmin,
  onPostsChange,
  activeTab,
  onActiveTabChange,
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
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');

  // Check user role for admin features
  const { isAdmin: userIsAdmin } = useUserRole();
  
  // Color themes
  const { data: colorThemes = [] } = useColorThemes();

  const { setBulkProcessing } = useProcessingStatesContext();

  // Resolve theme from route (if present)
  const params = useParams();
  const themeName = params.theme ? decodeURIComponent(params.theme) : undefined;

  const { handleGenerateImage } = useImageManager({
    onPostsChange,
    themeName,
  });

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
      const inScope = posts;
      const inTheme = selectedThemeId ? inScope.filter(p => p.color_theme_id === selectedThemeId) : inScope;
      const candidates = inTheme
        .map(p => ({
          post: p,
          need169: !p.image_16_9_url || (p.image_16_9_status ?? 'none') !== 'complete',
        }))
        .filter(c => c.need169);

      if (candidates.length === 0) {
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
      const proceed = window.confirm('This will regenerate and replace 16:9 images for all posts in this category. Continue?');
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

      const candidates = posts;
      if (candidates.length === 0) {
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
      const inScope = posts;
      const inTheme = selectedThemeId ? inScope.filter(p => p.color_theme_id === selectedThemeId) : inScope;
      const candidates = inTheme
        .map(p => ({
          post: p,
          need11: !p.image_1_1_url || (p.image_1_1_status ?? 'none') !== 'complete',
        }))
        .filter(c => c.need11);

      if (candidates.length === 0) {
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
      const proceed = window.confirm('This will regenerate and replace 1:1 images for all posts in this category. Continue?');
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

      const candidates = posts;
      if (candidates.length === 0) {
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

  // Placeholder functions for collection management
  const handlePublishCollection = async () => {
    setIsPublishing(true);
    try {
      // Simulate a library action
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsInLibrary(!isInLibrary);
    } catch (error) {
      toast.error('Failed to perform library action');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleFeatureLatestCollection = async () => {
    setIsFeaturing(true);
    try {
      // Simulate a feature action
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsFeatured(!isFeatured);
    } catch (error) {
      toast.error('Failed to perform feature action');
    } finally {
      setIsFeaturing(false);
    }
  };

  const handleShare = async () => {
    try {
      // Simulate a share action
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasSharedLink(true);
      setNewPostsCount(5); // Simulate 5 new images
      setHasImageActivity(true);
      window.open('https://example.com/shared-collection', '_blank');
    } catch (error) {
      toast.error('Failed to perform share action');
    }
  };

  const handleUpdateCollection = async () => {
    setIsUpdatingCollection(true);
    try {
      // Simulate an update action
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNewPostsCount(0);
      setHasImageActivity(false);
      window.open('https://example.com/shared-collection', '_blank');
    } catch (error) {
      toast.error('Failed to update collection');
    } finally {
      setIsUpdatingCollection(false);
    }
  };

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
