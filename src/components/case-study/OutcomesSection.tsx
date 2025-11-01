import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface OutcomesSectionProps {
  title: string;
  userFeedback?: {
    quote: string;
    author: string;
  };
}

export const OutcomesSection = ({ title, userFeedback }: OutcomesSectionProps) => {
  return (
    <section className="py-24 md:py-32 px-4 bg-[#084542] relative overflow-hidden min-h-[80vh] flex items-center">
      {/* Line Pattern Overlay */}
      <div className="absolute inset-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="line-pattern-outcomes" x="0" y="0" width="100" height="4" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="100" y2="0" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#line-pattern-outcomes)" />
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
          className="text-center mb-16"
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
        </motion.div>
        
        {userFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="p-12 md:p-16 hover:shadow-xl transition-shadow duration-300">
              <div className="max-w-4xl mx-auto text-center">
                <blockquote className="text-2xl md:text-3xl lg:text-4xl italic text-muted-foreground mb-8 leading-relaxed font-light">
                  "{userFeedback.quote}"
                </blockquote>
                <p className="text-xl md:text-2xl font-medium" style={{ color: '#000' }}>— {userFeedback.author}</p>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  );
};