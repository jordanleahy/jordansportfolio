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
    <section className="py-16 px-4 bg-white relative overflow-hidden">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="geometric-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              {/* Circles */}
              <circle cx="20" cy="20" r="2" fill="#042F3A" />
              <circle cx="80" cy="80" r="2" fill="#042F3A" />
              {/* Hexagons */}
              <path d="M60,10 L70,20 L70,30 L60,40 L50,30 L50,20 Z" fill="none" stroke="#042F3A" strokeWidth="0.5" />
              <path d="M100,50 L110,60 L110,70 L100,80 L90,70 L90,60 Z" fill="none" stroke="#042F3A" strokeWidth="0.5" />
              {/* Small circles */}
              <circle cx="40" cy="60" r="1.5" fill="#042F3A" />
              <circle cx="100" cy="20" r="1.5" fill="#042F3A" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geometric-pattern)" />
        </svg>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6">
            <h1 className="text-left font-medium text-[56px] leading-[61.6px] tracking-[0.84px] mb-2" style={{ color: '#042F3A' }}>{title}</h1>
            <p className="text-[18px] font-normal leading-[27px] tracking-[-0.18px] mb-6" style={{ color: '#000' }}>{description}</p>
            
            {/* Hero Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mb-6 rounded-2xl overflow-hidden shadow-lg border border-border/50"
            >
              <img 
                src={heroImage}
                alt={heroImageAlt}
                className="w-full h-auto"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-semibold text-muted-foreground mb-2">My Role</h3>
              <p className="text-[18px] font-normal leading-[27px] tracking-[-0.18px]" style={{ color: '#000' }}>{role}</p>
              {roleDetails && <p className="text-sm text-muted-foreground">{roleDetails}</p>}
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground mb-2">Timeline</h3>
              <p className="text-[18px] font-normal leading-[27px] tracking-[-0.18px]" style={{ color: '#000' }}>{timeline}</p>
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