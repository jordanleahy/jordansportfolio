import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface BlogTLDRProps {
  title?: string;
  bullets: string[];
  className?: string;
}

export const BlogTLDR = ({ 
  title = "TL;DR", 
  bullets, 
  className = "" 
}: BlogTLDRProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className={`py-16 px-4 ${className}`}
    >
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">📌</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
            </div>
            <p className="text-muted-foreground text-lg">Quick Summary</p>
          </motion.div>

          <div className="space-y-4">
            {bullets.map((bullet, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-4 p-4 bg-background/50 rounded-lg hover:bg-background/80 transition-colors"
              >
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
                <p className="text-lg leading-relaxed flex-1">
                  {bullet}
                </p>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </motion.section>
  );
};