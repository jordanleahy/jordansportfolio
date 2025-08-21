import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Challenge } from "@/types/caseStudy";

interface ProblemSectionProps {
  title: string;
  description: string;
  challenges: Challenge[];
  iframeUrl?: string;
  iframeTitle?: string;
}

export const ProblemSection = ({ title, description, challenges, iframeUrl, iframeTitle }: ProblemSectionProps) => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">{title}</h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">{description}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {challenges.map((challenge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <Card className="p-8 h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <h3 className="text-2xl font-bold text-foreground">{challenge.title}</h3>
                </div>
                <ul className="space-y-4">
                  {challenge.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-muted-foreground flex items-start gap-3 leading-relaxed">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {iframeUrl && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full"
          >
            <div className="bg-card border rounded-2xl overflow-hidden shadow-xl">
              <iframe
                src={iframeUrl}
                title={iframeTitle || "Embedded content"}
                className="w-full h-[600px] border-0"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};