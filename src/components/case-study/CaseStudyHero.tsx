import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-foreground">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto mb-12">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-12 justify-center items-center text-base mb-12">
            <div className="text-center">
              <div className="text-sm uppercase tracking-wider text-muted-foreground mb-1">Role</div>
              <div className="font-semibold text-foreground text-lg">{role}</div>
              {roleDetails && <div className="text-sm text-muted-foreground mt-1">{roleDetails}</div>}
            </div>
            <div className="text-center">
              <div className="text-sm uppercase tracking-wider text-muted-foreground mb-1">Timeline</div>
              <div className="font-semibold text-foreground text-lg">{timeline}</div>
              {timelineDetails && <div className="text-sm text-muted-foreground mt-1">{timelineDetails}</div>}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-sm py-2 px-4">
                {tag}
              </Badge>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative"
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={heroImage}
              alt={heroImageAlt}
              className="w-full h-auto"
              loading="eager"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};