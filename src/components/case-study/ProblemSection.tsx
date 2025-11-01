import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Challenge } from "@/types/caseStudy";
import { useEffect, useState, useRef } from "react";

interface ProblemSectionProps {
  title: string;
  description: string;
  challenges: Challenge[];
  iframeUrl?: string;
  iframeTitle?: string;
}

export const ProblemSection = ({ title, description, challenges, iframeUrl, iframeTitle }: ProblemSectionProps) => {
  const [showCards, setShowCards] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (hasViewed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // Lock scroll
            document.body.style.overflow = 'hidden';
            setHasViewed(true);

            // Wait 2 seconds before showing cards and unlocking scroll
            setTimeout(() => {
              setShowCards(true);
              document.body.style.overflow = '';
            }, 2000);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      document.body.style.overflow = '';
      observer.disconnect();
    };
  }, [hasViewed]);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 px-4 bg-[#084542] relative overflow-hidden min-h-screen flex items-center">
      {/* Line Pattern Overlay */}
      <div className="absolute inset-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="line-pattern" x="0" y="0" width="100" height="4" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="100" y2="0" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#line-pattern)" />
        </svg>
      </div>
      
      {/* Decorative accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0"></div>
      
      <div className="max-w-4xl mx-auto relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2 
            className="font-bold text-4xl md:text-5xl lg:text-6xl mb-8 text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {title}
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl font-normal leading-relaxed mb-32 text-white/95 max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {description}
          </motion.p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {showCards && challenges.map((challenge, index) => (
              <motion.div 
                key={index} 
                className="space-y-6"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.4, duration: 0.9, ease: "easeOut" }}
              >
                <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
                  <h4 className="font-bold text-lg mb-4">{challenge.title}</h4>
                  <ul className="space-y-3">
                    {challenge.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-base flex items-start gap-3" style={{ color: '#000' }}>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {iframeUrl && (
            <div className="w-full">
              <iframe
                src={iframeUrl}
                title={iframeTitle || "Embedded content"}
                className="w-full h-[600px] border border-border rounded-lg shadow-sm"
                loading="lazy"
                allowFullScreen
              />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};