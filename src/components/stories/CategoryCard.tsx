import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FolderOpen, FileText, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLongPress } from "@/hooks/useLongPress";
import { useFailedThemeRecovery } from "@/hooks/useFailedThemeRecovery";
import { ContextualActionMenu } from "@/components/ui/contextual-action-menu";
import { CategoryCardProps } from '@/types/stories';

export const ThemeCard = ({ 
  theme, 
  themeId, 
  themeDescription, 
  category, 
  postCount, 
  imageUrl, 
  onClick, 
  isShimmer = false, 
  isError = false,
  firstPostData, 
  onDelete, 
  isSelected, 
  onSelect, 
  isSelectionMode, 
  isGeneratingTheme, 
  onCancelGeneration 
}: CategoryCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { retryFailedTheme, deleteFailedTheme, isRetrying } = useFailedThemeRecovery();
  
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuCoordinates, setMenuCoordinates] = useState({ x: 0, y: 0 });
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Sync image URL from props
  useEffect(() => {
    if (imageUrl) {
      setCurrentImageUrl(imageUrl);
    }
  }, [imageUrl]);

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
    
    
    if (isShimmer || isError) return; // Prevent clicks on shimmer and error cards
    if (isSelectionMode && onSelect) {
      onSelect();
      return;
    }
    
    // Validate themeId before navigation
    if (!themeId || themeId.startsWith('pending-') || themeId === 'shimmer-id') {
      
      return;
    }
    
    if (onClick) {
      onClick();
    } else {
      
      navigate(`/stories/id/${themeId}`);
    }
  };

  const handleRetryTheme = async () => {
    if (isRetrying === themeId) return;
    await retryFailedTheme(themeId, category, theme);
  };

  const handleDeleteFailedTheme = async () => {
    await deleteFailedTheme(themeId);
  };

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect();
    }
  };

  // Handle error state
  if (isError) {
    return (
      <Card className="group overflow-hidden border-destructive/50 bg-destructive/5 select-none transition-all duration-300">
        {/* Error Image Section */}
        <div className="relative aspect-square">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
            <div className="space-y-2 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <div className="text-xs text-destructive/80">Generation failed</div>
            </div>
          </div>
        </div>

        {/* Error Content Section */}
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-destructive mb-1">Generation Failed</h3>
              <p className="text-sm text-destructive/70">
                Theme generation encountered an error. You can retry or delete this theme.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetryTheme}
                disabled={isRetrying === themeId}
                className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
              >
                {isRetrying === themeId ? 'Retrying...' : 'Retry'}
              </Button>
              {onDelete && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => onDelete(themeId)}
                  className="flex-1"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isShimmer) {
    // Extract real theme ID from prefixed ID for data-theme-id attribute
    const realThemeId = themeId.startsWith('pending-') ? themeId.replace('pending-', '') : themeId;
    
    return (
      <>
        <Card 
          className="group overflow-hidden border-border/50 select-none transition-all duration-500" 
          {...longPressHandlers}
          style={{ touchAction: 'manipulation' }}
          data-theme-state="generating"
          data-theme-id={realThemeId}
          data-scroll-target="theme-card"
        >
          {/* Shimmer Image Section */}
          <div className="relative aspect-square">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
              <div className="space-y-2 text-center">
                <Loader2 className="h-8 w-8 text-primary/60 animate-spin mx-auto" />
                <div className="text-xs text-primary/60">
                  {isCancelling ? "Cancelling..." : "Generating theme..."}
                </div>
              </div>
            </div>
            {/* Add shimmer animation overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-border/50 hover:border-primary/20 overflow-hidden ${
        isSelected ? 'ring-2 ring-primary border-primary/50' : ''
      } ${isSelectionMode ? 'hover:ring-1 hover:ring-primary/50' : ''}`} 
      onClick={handleClick}
      data-theme-id={themeId}
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden">
        {/* Display current image */}
        {currentImageUrl ? (
          <img 
            src={currentImageUrl} 
            alt={`${theme} preview`}
            className="w-full h-full object-cover transition-all duration-200 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              // Prevent infinite loop if placeholder also fails
              if (target.src.includes('/placeholder.svg')) return;
              setCurrentImageUrl('/placeholder.svg');
            }}
          />
        ) : (
          // Fallback gradient background
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex flex-col items-center justify-center">
            <FolderOpen className="h-8 w-8 text-primary/60 mb-3" />
            <div className="text-xs text-muted-foreground text-center px-2">
              No image available
            </div>
          </div>
        )}
        
        {/* Overlay for better text readability when we have an image */}
        {currentImageUrl && (
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

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={(e) => { 
            e.stopPropagation(); 
            
            
            // Validate themeId before navigation
            if (!themeId || themeId.startsWith('pending-') || themeId === 'shimmer-id') {
              
              return;
            }
            
            if (onClick) {
              onClick();
            } else {
              
              navigate(`/stories/id/${themeId}`);
            }
          }}
        >
          View Details
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

// Export with alias for backward compatibility
export const CategoryCard = ThemeCard;