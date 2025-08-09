import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { FolderOpen, FileText, ArrowRight, Image as ImageIcon, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { EDGE_FUNCTION_NAMES } from "@/constants/edgeFunctionConstants";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLongPress } from "@/hooks/useLongPress";
import { ContextualActionMenu } from "@/components/ui/contextual-action-menu";

import { CategoryCardProps } from '@/types/stories';

export const ThemeCard = ({ theme, themeDescription, category, postCount, imageUrl, onClick, isShimmer = false, firstPostData, onDelete, isSelected, onSelect, isSelectionMode, isGeneratingTheme, onCancelGeneration }: CategoryCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isGeneratingDay1, setIsGeneratingDay1] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const imageGenerationAttempted = useRef(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuCoordinates, setMenuCoordinates] = useState({ x: 0, y: 0 });
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Listen for real-time database updates on the Day 1 post's image_4_3_url
  useEffect(() => {
    if (!user?.id || !category) return;

    const channel = supabase
      .channel(`day-1-image-updates-${category}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'social_media_posts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedPost = payload.new as any;
          // Check if this is a Day 1 post for our category and has a new image
          if (updatedPost.day === 1 && updatedPost.category === category && updatedPost.image_4_3_url) {
            console.log('🎨 Day 1 image updated:', updatedPost.image_4_3_url);
            setCurrentImageUrl(updatedPost.image_4_3_url);
            setIsGeneratingDay1(false);
            setGenerationError(null);
          }
          // Handle failed generation
          if (updatedPost.day === 1 && updatedPost.category === category && updatedPost.image_4_3_status === 'failed') {
            console.log('❌ Day 1 image generation failed');
            setIsGeneratingDay1(false);
            setGenerationError('Failed to generate Day 1 image');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, category]);

  // Reset generation attempt tracking when theme changes
  useEffect(() => {
    imageGenerationAttempted.current = false;
    setGenerationError(null);
  }, [theme, category]);

  // Sync image URL from props or firstPostData
  useEffect(() => {
    if (imageUrl) {
      setCurrentImageUrl(imageUrl);
      return;
    }
    const firstUrl = (firstPostData as any)?.image_4_3_url;
    if (firstUrl) {
      setCurrentImageUrl(firstUrl);
    }
  }, [imageUrl, firstPostData]);

  // Generate Day 1 image function
  const generateDay1Image = async () => {
    if (!user?.id || !firstPostData) {
      toast({
        title: "Error",
        description: "Unable to generate image. Missing user or theme data.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGeneratingDay1(true);
      setGenerationError(null);

      console.log('🎨 Calling generate-day-1-4-3 function for theme:', theme);
      
      // Find the theme ID by looking for a theme with this name and category
      const { data: themeData, error: themeError } = await supabase
        .from('themes')
        .select('id')
        .eq('theme_name', theme)
        .eq('category', category)
        .eq('user_id', user.id)
        .single();

      if (themeError || !themeData) {
        throw new Error('Theme not found');
      }

      const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAMES.GENERATE_DAY_1_4_3, {
        body: {
          themeId: themeData.id,
          userId: user.id
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success!",
        description: "Day 1 image generation started. It will appear when ready."
      });

    } catch (error) {
      console.error('❌ Day 1 image generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate Day 1 image';
      setGenerationError(errorMessage);
      setIsGeneratingDay1(false);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  
  // Auto-generate Day 1 image on mount if missing and not already in progress
  useEffect(() => {
    if (isShimmer) return;
    if (imageGenerationAttempted.current) return;

    const status = (firstPostData as any)?.image_4_3_status as string | undefined;
    const inProgress = status === 'processing' || status === 'uploading';
    const hasImage = !!(currentImageUrl || (firstPostData as any)?.image_4_3_url);

    // Reflect in-progress state visually
    if (inProgress && !hasImage) {
      setIsGeneratingDay1(true);
    }

    // Trigger generation once per card
    if (!hasImage && !inProgress && firstPostData) {
      imageGenerationAttempted.current = true;
      generateDay1Image();
    }
  }, [isShimmer, firstPostData, currentImageUrl]);
  
  const handleCancelThemeGeneration = async () => {
    if (!user?.id || !onCancelGeneration) return;
    
    setIsCancelling(true);
    try {
      await onCancelGeneration();
      toast({
        title: "Generation Cancelled",
        description: "Theme generation has been cancelled successfully.",
      });
    } catch (error) {
      console.error('Error cancelling theme generation:', error);
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel theme generation",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
      setShowContextMenu(false);
    }
  };

  const longPressHandlers = useLongPress({
    threshold: 600,
    onLongPress: (coordinates) => {
      if (isShimmer && isGeneratingTheme && !isCancelling) {
        setMenuCoordinates(coordinates);
        setShowContextMenu(true);
      }
    }
  });

  const handleClick = () => {
    if (isShimmer) return; // Prevent clicks on shimmer cards
    if (isSelectionMode && onSelect) {
      onSelect();
      return;
    }
    if (onClick) {
      onClick();
    } else {
      navigate(`/stories/theme/${encodeURIComponent(theme)}`);
    }
  };

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect();
    }
  };

  if (isShimmer) {
    return (
      <>
        <Card 
          className="group overflow-hidden border-border/50 select-none" 
          {...longPressHandlers}
          style={{ touchAction: 'manipulation' }}
        >
          {/* Shimmer Image Section */}
          <div className="relative h-48">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
              <div className="space-y-2 text-center">
                <Loader2 className="h-8 w-8 text-primary/60 animate-spin mx-auto" />
                <div className="text-xs text-primary/60">
                  {isCancelling ? "Cancelling..." : "Generating theme..."}
                </div>
              </div>
            </div>
          </div>

          {/* Shimmer Content Section */}
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <div className="h-6 bg-muted/50 rounded animate-pulse mb-2" />
                <div className="h-4 w-2/3 bg-muted/30 rounded animate-pulse" />
              </div>
              <div className="h-9 bg-muted/30 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
        
        <ContextualActionMenu
          isOpen={showContextMenu}
          coordinates={menuCoordinates}
          onClose={() => setShowContextMenu(false)}
          actions={[
            {
              title: "Cancel Theme Generation",
              style: "destructive",
              onPress: handleCancelThemeGeneration
            },
            {
              title: "Keep Generating",
              style: "cancel",
              onPress: () => setShowContextMenu(false)
            }
          ]}
        />
      </>
    );
  }

  return (
    <Card className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-border/50 hover:border-primary/20 overflow-hidden ${
      isSelected ? 'ring-2 ring-primary border-primary/50' : ''
    } ${isSelectionMode ? 'hover:ring-1 hover:ring-primary/50' : ''}`} onClick={handleClick}>
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {/* Display current image */}
        {currentImageUrl ? (
          <img 
            src={currentImageUrl} 
            alt={`${theme} Day 1 preview`}
            className="w-full h-full object-cover transition-all duration-200 group-hover:scale-105"
            onError={(e) => {
              // Fallback to gradient background if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        
        {/* Generation in progress overlay */}
        {isGeneratingDay1 && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
            <div className="space-y-2 text-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <div className="text-xs text-primary">Generating Day 1 image...</div>
            </div>
          </div>
        )}
        
        {/* Error state overlay */}
        {generationError && !isGeneratingDay1 && (
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/20 via-destructive/10 to-muted/20 flex flex-col items-center justify-center">
            <ImageIcon className="h-8 w-8 text-destructive/60 mb-2" />
            <div className="text-xs text-destructive text-center px-2">
              Failed to generate
            </div>
          </div>
        )}
        
        {/* Fallback gradient background with generate button */}
        <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex flex-col items-center justify-center ${
          currentImageUrl || isGeneratingDay1 || generationError ? 'hidden' : ''
        }`}>
          <FolderOpen className="h-8 w-8 text-primary/60 mb-3" />
          {firstPostData && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                generateDay1Image();
              }}
              variant="outline"
              size="sm"
              className="bg-white/90 hover:bg-white text-primary border-primary/20"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Generate Day 1 Image
            </Button>
          )}
        </div>
        
        {/* Overlay for better text readability when we have an image */}
        {currentImageUrl && !isGeneratingDay1 && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}
        
        {/* Selection checkbox and badge */}
        <div className="absolute top-3 right-3 flex gap-2">
          {isSelectionMode && (
            <div 
              className="bg-white/90 rounded-md p-1 shadow-sm"
              onClick={handleCheckboxChange}
            >
              <Checkbox 
                checked={isSelected || false}
                className="h-4 w-4"
              />
            </div>
          )}
          <Badge variant="secondary" className="bg-white/90 text-primary hover:bg-white">
            {postCount}
          </Badge>
        </div>
        
      </div>

      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {theme}
            </h3>
            {themeDescription && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {themeDescription}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {postCount} {postCount === 1 ? 'post' : 'posts'}
              </span>
            </div>
          </div>
        </div>

        {/* Show retry button for failed generations or generate button when no image */}
        {generationError && !isGeneratingDay1 && (
          <div className="flex gap-2 mb-3">
            <Button 
              onClick={(e) => { 
                e.stopPropagation(); 
                generateDay1Image(); 
              }}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry Day 1 Image
            </Button>
          </div>
        )}

        {/* Show generate button when no image and no error */}
        {!currentImageUrl && !generationError && !isGeneratingDay1 && firstPostData && (
          <div className="flex gap-2 mb-3">
            <Button 
              onClick={(e) => { 
                e.stopPropagation(); 
                generateDay1Image(); 
              }}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Generate Day 1 Image
            </Button>
          </div>
        )}

        <Button 
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
          variant="ghost"
          className="w-full justify-between text-muted-foreground hover:text-primary group-hover:bg-primary/5"
        >
          <span>View Details</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

// Backward compatibility alias
export const CategoryCard = ThemeCard;