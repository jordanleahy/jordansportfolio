import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface CaseStudyHeroProps {
  title: string;
  description: string;
  heroImage: string;
  heroImageAlt: string;
  role: string;
  roleDetails?: string;
  timeline: string;
  timelineDetails?: string;
  tags: string[];
}

export const CaseStudyHero = ({ 
  title, 
  description, 
  heroImage, 
  heroImageAlt, 
  role, 
  roleDetails, 
  timeline, 
  timelineDetails, 
  tags 
}: CaseStudyHeroProps) => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">{title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{description}</p>
            
            {/* Hero Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mb-6 rounded-2xl overflow-hidden shadow-lg border border-border/50"
            >
              <OptimizedImage 
                src={heroImage}
                alt={heroImageAlt}
                priority={true}
                aspectRatio="16/9"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-semibold text-muted-foreground mb-2">My Role</h3>
              <p>{role}</p>
              {roleDetails && <p className="text-sm text-muted-foreground">{roleDetails}</p>}
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground mb-2">Timeline</h3>
              <p>{timeline}</p>
              {timelineDetails && <p className="text-sm text-muted-foreground">{timelineDetails}</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};