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
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        </motion.div>
        
        {userFeedback && (
          <Card className="p-8">
            <div className="max-w-3xl mx-auto text-center">
              <blockquote className="text-xl italic text-muted-foreground mb-4 leading-relaxed">
                "{userFeedback.quote}"
              </blockquote>
              <p className="text-sm text-muted-foreground">— {userFeedback.author}</p>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
};