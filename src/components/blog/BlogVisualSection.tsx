
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, GripVertical } from "lucide-react";

interface BlogVisualSectionProps {
  headline: string;
  content: string;
  imageUrl: string;
  ctaText?: string;
  ctaUrl?: string;
  index?: number;
  className?: string;
  // Preview mode props
  isPreview?: boolean;
  isEnabled?: boolean;
  onToggle?: (index: number) => void;
  onRegenerateImage?: (sectionIndex: number) => void;
  dayNumber?: number;
}

export const BlogVisualSection = ({ 
  headline, 
  content, 
  imageUrl, 
  ctaText, 
  ctaUrl,
  index = 0,
  className = "",
  isPreview = false,
  isEnabled = true,
  onToggle,
  onRegenerateImage,
  dayNumber
}: BlogVisualSectionProps) => {
  const isEven = index % 2 === 0;

  // Check if imageUrl is actually a prompt vs a real image URL
  const isActualImage = imageUrl && (
    imageUrl.startsWith('http') || 
    imageUrl.startsWith('/') || 
    imageUrl.startsWith('data:image')
  );

  return (
    <div className={`py-12 px-4 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {/* Apply Card styles directly to eliminate component overhead */}
        <div className={`rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden relative transition-all duration-200 ${!isEnabled && isPreview ? 'opacity-50 grayscale' : ''}`}>
          {/* Preview Controls */}
          {isPreview && (
            <>
              {/* Section Number Badge */}
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                  {dayNumber ? `Day ${dayNumber}` : `Section ${index + 1}`}
                </Badge>
              </div>
              
              {/* Toggle Control */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                {isEnabled ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => onToggle?.(index)}
                />
              </div>
            </>
          )}
          
          <div className={`md:flex ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
            {/* Image Side */}
            <div className="md:w-1/2">
              <div className="aspect-square bg-muted relative overflow-hidden flex items-center justify-center">
                {isActualImage ? (
                  <img
                    src={imageUrl}
                    alt={headline}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      // Hide broken images
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div 
                    className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => isPreview && onRegenerateImage?.(index)}
                  >
                    <div className="w-16 h-16 bg-muted-foreground/10 rounded-lg flex items-center justify-center mb-4">
                      <svg 
                        className="w-8 h-8" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">
                      {isPreview ? "Click to generate image" : "Image generating..."}
                    </p>
                    <p className="text-xs">Visual will appear shortly</p>
                  </div>
                )}
              </div>
            </div>

            {/* Content Side - Simplified consistent padding */}
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                {headline}
              </h2>

              <div className="prose prose-lg max-w-none mb-8">
                <p className="text-lg leading-relaxed text-foreground/90">
                  {content}
                </p>
              </div>

              {/* Optional CTA */}
              {ctaText && (
                <div>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="hover:bg-primary/5"
                    onClick={() => ctaUrl && window.open(ctaUrl, '_blank')}
                  >
                    {ctaText}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
