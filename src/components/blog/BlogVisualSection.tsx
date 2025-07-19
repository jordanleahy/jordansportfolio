
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`py-16 px-4 ${className}`}
    >
      <div className="max-w-6xl mx-auto">
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className={`md:flex ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
            {/* Image Side */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="md:w-1/2"
            >
              <div className="h-full min-h-[400px] bg-muted relative overflow-hidden">
                <img
                  src={imageUrl}
                  alt={headline}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* Content Side */}
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <motion.h2
                initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
              >
                {headline}
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="prose prose-lg max-w-none mb-8"
              >
                <p className="text-lg leading-relaxed text-foreground/90">
                  {content}
                </p>
              </motion.div>

              {/* Optional CTA */}
              {ctaText && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="hover:bg-primary/5"
                    onClick={() => ctaUrl && window.open(ctaUrl, '_blank')}
                  >
                    {ctaText}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </motion.section>
  );
};
