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
    <section className="py-12 px-4 bg-[#084542] relative overflow-hidden">
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
      
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-medium text-[24px] leading-[31.2px] mb-4 text-white">{title}</h2>
        </motion.div>
        
        {userFeedback && (
          <Card className="p-8">
            <div className="max-w-3xl mx-auto text-center">
              <blockquote className="text-xl italic text-muted-foreground mb-4 leading-relaxed">
                "{userFeedback.quote}"
              </blockquote>
              <p className="text-[18px] font-normal leading-[27px] tracking-[-0.18px]" style={{ color: '#000' }}>— {userFeedback.author}</p>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
};