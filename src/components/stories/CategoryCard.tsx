import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StreamingShimmer } from "@/components/ui/streaming-shimmer";
import { FolderOpen, FileText, ArrowRight, Image as ImageIcon, Loader2, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useThemeImageStreaming } from "@/hooks/useThemeImageStreaming";
import { useEffect, useState } from "react";

import { CategoryCardProps } from '@/types/stories';

export const ThemeCard = ({ theme, themeDescription, category, postCount, imageUrl, onClick, isShimmer = false, firstPostData, onDelete }: CategoryCardProps) => {
  const navigate = useNavigate();
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  
  // Use streaming hook for real-time image generation (enabled for both shimmer and regular cards)
  const { streamingProgress, isGenerating, error, hasTimedOut, startStreaming, retryGeneration } = useThemeImageStreaming({
    category,
    enabled: !!firstPostData // Enable for both shimmer and regular cards
  });

  // Auto-start streaming when firstPostData becomes available (for both shimmer and regular cards)
  useEffect(() => {
    if (firstPostData && !currentImageUrl && !imageUrl && !isGenerating && !streamingProgress) {
      startStreaming(firstPostData);
    }
  }, [firstPostData, currentImageUrl, imageUrl, isGenerating, streamingProgress, category, startStreaming]);

  // Update image URL when streaming completes or imageUrl prop changes
  useEffect(() => {
    if (streamingProgress?.imageUrl) {
      setCurrentImageUrl(streamingProgress.imageUrl);
    } else if (imageUrl) {
      setCurrentImageUrl(imageUrl);
    }
  }, [streamingProgress?.imageUrl, imageUrl]);
  
  const handleClick = () => {
    if (isShimmer) return; // Prevent clicks on shimmer cards
    if (onClick) {
      onClick();
    } else {
      navigate(`/stories/theme/${encodeURIComponent(theme)}`);
    }
  };

  if (isShimmer) {
    return (
      <Card className="group overflow-hidden border-border/50">
        {/* Streaming Shimmer Image Section */}
        <div className="relative h-48">
          <StreamingShimmer
            streamingProgress={streamingProgress}
            isGenerating={isGenerating}
            error={error}
            fallbackIcon={<FolderOpen className="h-12 w-12 text-primary/40" />}
          />
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
    );
  }

  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-border/50 hover:border-primary/20 overflow-hidden" onClick={handleClick}>
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {/* Display current or streaming image */}
        {currentImageUrl || streamingProgress?.partialImage ? (
          <img 
            src={streamingProgress?.partialImage || currentImageUrl} 
            alt={`${theme} preview`}
            className={`w-full h-full object-cover transition-all duration-200 group-hover:scale-105 ${
              streamingProgress?.partialImage ? 'opacity-80' : ''
            }`}
            onError={(e) => {
              // Fallback to gradient background if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        
        {/* Generation in progress overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        )}
        
        {/* Error state overlay */}
        {error && !isGenerating && (
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/20 via-destructive/10 to-muted/20 flex flex-col items-center justify-center">
            <ImageIcon className="h-8 w-8 text-destructive/60 mb-2" />
            <div className="text-xs text-destructive text-center px-2">
              Failed to generate
            </div>
          </div>
        )}
        
        {/* Fallback gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center ${
          currentImageUrl || streamingProgress?.partialImage || isGenerating || error ? 'hidden' : ''
        }`}>
          <FolderOpen className="h-12 w-12 text-primary/60" />
        </div>
        
        {/* Overlay for better text readability when we have an image */}
        {(currentImageUrl || streamingProgress?.partialImage) && !isGenerating && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}
        
        {/* Badge positioned over image */}
        <div className="absolute top-3 right-3">
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

        {/* Show retry button for failed/timed-out generations */}
        {(error || hasTimedOut) && !isGenerating && (
          <div className="flex gap-2 mb-3">
            <Button 
              onClick={(e) => { 
                e.stopPropagation(); 
                retryGeneration(); 
              }}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry Image
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