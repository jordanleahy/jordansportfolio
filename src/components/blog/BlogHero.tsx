
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface BlogHeroProps {
  headline: string;
  subhead: string;
  imageUrl?: string;
  videoUrl?: string;
  badge?: string;
  readTime?: number;
  onCTAClick?: () => void;
}

export const BlogHero = ({ 
  headline, 
  subhead, 
  imageUrl, 
  videoUrl, 
  badge, 
  readTime,
  onCTAClick 
}: BlogHeroProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* Badge */}
          {badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <Badge variant="secondary" className="text-sm font-medium">
                {badge}
              </Badge>
            </motion.div>
          )}

          {/* Headline - Max 8 words enforced */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          >
            {headline}
          </motion.h1>

          {/* Subhead - 15-25 words with emotional pull */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto"
          >
            {subhead}
          </motion.p>

          {/* Read Time & CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
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
          </motion.div>

          {/* Featured Image or Video - 16:9 ratio enforced */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="relative max-w-2xl mx-auto"
          >
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
            ) : imageUrl ? (
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
                <img
                  src={imageUrl}
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
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};
