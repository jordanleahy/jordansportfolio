import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ProcessStep } from "@/types/caseStudy";
import { iconMap } from "@/utils/iconMap";

interface ProcessSectionProps {
  title: string;
  steps: ProcessStep[];
}

export const ProcessSection = ({ title, steps }: ProcessSectionProps) => {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        </motion.div>

        <div className="space-y-8">
          {steps.map((step, index) => {
            const IconComponent = iconMap[step.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row md:items-start md:gap-6">
                    <div className="p-3 bg-primary/10 rounded-lg mb-4 md:mb-0 md:flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <div className="w-full md:flex-1">
                      <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                      {step.image && (
                        <div className="mb-4">
                          <img 
                            src={step.image} 
                            alt={`${step.title} illustration`}
                            className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                          />
                        </div>
                      )}
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      {step.items && (
                        <ul className="space-y-2 mb-4">
                          {step.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                      {step.quote && (
                        <blockquote className="border-l-4 border-primary/20 pl-4 italic text-muted-foreground">
                          "{step.quote.text}"
                          <footer className="text-sm mt-1">— {step.quote.author}</footer>
                        </blockquote>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};