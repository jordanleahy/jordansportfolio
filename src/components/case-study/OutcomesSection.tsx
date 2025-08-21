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
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h2>
        </motion.div>
        
        {userFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="p-12 border-0 shadow-xl bg-card/50 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto text-center">
                <div className="text-6xl text-accent/20 mb-6">"</div>
                <blockquote className="text-2xl font-medium text-foreground mb-8 leading-relaxed">
                  {userFeedback.quote}
                </blockquote>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-accent to-transparent mx-auto mb-6"></div>
                <p className="text-lg text-muted-foreground font-medium">{userFeedback.author}</p>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  );
};