
import { Button } from "@/components/ui/button";

interface BlogVisualSectionProps {
  headline: string;
  content: string;
  imageUrl: string;
  ctaText?: string;
  ctaUrl?: string;
  index?: number;
  className?: string;
}

export const BlogVisualSection = ({ 
  headline, 
  content, 
  imageUrl, 
  ctaText, 
  ctaUrl,
  index = 0,
  className = ""
}: BlogVisualSectionProps) => {
  const isEven = index % 2 === 0;

  return (
    <div className={`py-12 px-4 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {/* Apply Card styles directly to eliminate component overhead */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
          <div className={`md:flex ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
            {/* Image Side */}
            <div className="md:w-1/2">
              <div className="h-full bg-muted relative overflow-hidden">
                <img
                  src={imageUrl}
                  alt={headline}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
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
