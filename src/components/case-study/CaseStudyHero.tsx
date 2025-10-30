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
      {/* Medical-Themed Background Pattern */}
      <div className="absolute inset-0 opacity-[0.08]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="medical-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              {/* Medical Cross */}
              <path d="M18,12 L18,18 L12,18 L12,22 L18,22 L18,28 L22,28 L22,22 L28,22 L28,18 L22,18 L22,12 Z" fill="#042F3A" />
              
              {/* Molecular Structure */}
              <circle cx="70" cy="20" r="2.5" fill="#042F3A" />
              <circle cx="78" cy="15" r="2" fill="#042F3A" />
              <circle cx="78" cy="25" r="2" fill="#042F3A" />
              <line x1="70" y1="20" x2="78" y2="15" stroke="#042F3A" strokeWidth="1" />
              <line x1="70" y1="20" x2="78" y2="25" stroke="#042F3A" strokeWidth="1" />
              
              {/* Pills/Capsules */}
              <ellipse cx="85" cy="70" rx="3" ry="8" fill="none" stroke="#042F3A" strokeWidth="1" />
              <line x1="85" y1="62" x2="85" y2="78" stroke="#042F3A" strokeWidth="1" />
              
              {/* Small Medical Cross */}
              <path d="M48,75 L48,78 L45,78 L45,81 L48,81 L48,84 L51,84 L51,81 L54,81 L54,78 L51,78 L51,75 Z" fill="#042F3A" />
              
              {/* Molecular Structure 2 */}
              <circle cx="25" cy="65" r="2" fill="#042F3A" />
              <circle cx="32" cy="68" r="1.5" fill="#042F3A" />
              <circle cx="32" cy="62" r="1.5" fill="#042F3A" />
              <line x1="25" y1="65" x2="32" y2="68" stroke="#042F3A" strokeWidth="0.8" />
              <line x1="25" y1="65" x2="32" y2="62" stroke="#042F3A" strokeWidth="0.8" />
              
              {/* Small Pill */}
              <ellipse cx="60" cy="45" rx="2" ry="6" fill="none" stroke="#042F3A" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#medical-pattern)" />
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