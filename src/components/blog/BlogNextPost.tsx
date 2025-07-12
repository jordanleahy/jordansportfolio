import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { BlogPost } from "@/types/blog";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface BlogNextPostProps {
  nextPost: BlogPost | null;
  className?: string;
}

export const BlogNextPost = ({ nextPost, className = "" }: BlogNextPostProps) => {
  if (!nextPost) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className={`py-16 px-4 ${className}`}
      >
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center bg-gradient-to-br from-muted/50 to-background border-muted">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-2xl font-bold mb-4 text-muted-foreground"
            >
              📝 More content coming soon...
            </motion.h2>
            <p className="text-muted-foreground">
              Stay tuned for more insights and deep dives!
            </p>
          </Card>
        </div>
      </motion.section>
    );
  }

  // Create a brief description from intro_content (first 120 characters)
  const description = nextPost.intro_content.length > 120 
    ? nextPost.intro_content.substring(0, 120) + "..."
    : nextPost.intro_content;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className={`py-16 px-4 bg-gradient-to-br from-background to-muted/20 ${className}`}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Up Next
          </h2>
          <div className="w-12 h-0.5 bg-primary mx-auto"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
            <div className="md:flex">
              {/* Image */}
              {nextPost.hero_image_url && (
                <div className="md:w-1/3 overflow-hidden">
                  <OptimizedImage
                    src={nextPost.hero_image_url}
                    alt={nextPost.hero_headline}
                    className="w-full h-48 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              {/* Content */}
              <div className={`${nextPost.hero_image_url ? 'md:w-2/3' : 'w-full'} p-6 md:p-8`}>
                {/* Badge */}
                {nextPost.hero_badge && (
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-3">
                    {nextPost.hero_badge}
                  </div>
                )}

                {/* Category */}
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {nextPost.category}
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-200">
                  {nextPost.hero_headline}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {description}
                </p>

                {/* Meta info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  {nextPost.read_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{nextPost.read_time} min read</span>
                    </div>
                  )}
                  {nextPost.published_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(nextPost.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Link to={`/blog/${nextPost.slug}`}>
                  <Button className="group/btn">
                    Read Next Article
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.section>
  );
};