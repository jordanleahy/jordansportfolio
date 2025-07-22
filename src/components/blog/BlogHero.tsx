import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface BlogHeroProps {
  headline: string;
  subhead: string;
  imageUrl?: string;
  image16_9_url?: string;
  videoUrl?: string;
  badge?: string;
  readTime?: number;
  onCTAClick?: () => void;
}

export const BlogHero = ({ 
  headline, 
  subhead, 
  imageUrl, 
  image16_9_url,
  videoUrl, 
  badge, 
  readTime,
  onCTAClick 
}: BlogHeroProps) => {
  // Prioritize 16:9 image for hero section
  const heroImageUrl = image16_9_url || imageUrl;
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* Badge */}
          {badge && (
            <div className="mb-6">
              <Badge variant="secondary" className="text-sm font-medium">
                {badge}
              </Badge>
            </div>
          )}

          {/* Headline - Max 8 words enforced */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {headline}
          </h1>

          {/* Subhead - 15-25 words with emotional pull */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            {subhead}
          </p>

          {/* Read Time & CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            {readTime && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Read in {readTime} min</span>
              </div>
            )}
            <Button 
              onClick={onCTAClick}
              size="lg"
              className="text-lg px-8 py-3"
            >
              Start Reading
            </Button>
          </div>

          {/* Featured Image or Video - 16:9 ratio enforced */}
          <div className="relative max-w-4xl mx-auto">
            {videoUrl ? (
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
              </div>
            ) : heroImageUrl ? (
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
                <img
                  src={heroImageUrl}
                  alt={headline}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            ) : (
              <div className="aspect-[16/9] rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <span className="text-muted-foreground text-lg">Featured Image</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};