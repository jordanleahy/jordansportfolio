import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface CaseStudyHeroProps {
  title: string;
  description?: string;
  heroImage: string;
  heroImageAlt: string;
  role: string;
  roleDetails?: string;
  timeline: string;
  timelineDetails?: string;
  tags: string[];
  icon?: ReactNode;
  iconColor?: string;
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
  tags,
  icon,
  iconColor
}: CaseStudyHeroProps) => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-6 mb-8">
            {icon && (
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-xl ${iconColor || 'bg-primary/10'}`}>
                  {icon}
                </div>
              </div>
            )}
            
            <div>
              <h1 className="text-4xl font-bold mb-4">{title}</h1>
              
              {/* Hero Image */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative mt-6 rounded-2xl overflow-hidden shadow-lg border border-border/50"
              >
                <img 
                  src={heroImage}
                  alt={heroImageAlt}
                  className="w-full h-auto object-cover aspect-video"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
              </motion.div>
            </div>
            
            {description && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
                <p className="text-lg text-muted-foreground">
                  <strong>Project Summary:</strong> {description}
                </p>
              </div>
            )}
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div>
              <h3 className="font-semibold text-muted-foreground mb-2">My Role</h3>
              <div className="space-y-1">
                <p className="font-semibold">{role}</p>
                {roleDetails && (
                  <p className="text-sm text-muted-foreground">{roleDetails}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground mb-2">Timeline</h3>
              <div className="space-y-1">
                <p className="font-semibold">{timeline}</p>
                {timelineDetails && (
                  <p className="text-sm text-muted-foreground">{timelineDetails}</p>
                )}
              </div>
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