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
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h2>
        </motion.div>

        <div className="space-y-12">
          {steps.map((step, index) => {
            const IconComponent = iconMap[step.icon as keyof typeof iconMap];
            const stepNumber = step.title.match(/^\d+/)?.[0] || (index + 1).toString();
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="overflow-hidden border-0 shadow-lg">
                  <div className="grid lg:grid-cols-2 gap-0">
                    <div className="p-8 lg:p-12">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary-foreground">{stepNumber}</span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-lg flex items-center justify-center">
                            <IconComponent className="h-3 w-3 text-accent-foreground" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">{step.title.replace(/^\d+\.\s*/, '')}</h3>
                        </div>
                      </div>
                      
                      <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{step.description}</p>
                      
                      {step.items && (
                        <ul className="space-y-3 mb-6">
                          {step.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-muted-foreground flex items-start gap-3">
                              <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {step.quote && (
                        <div className="bg-muted/50 rounded-xl p-6 border-l-4 border-accent">
                          <blockquote className="text-foreground italic leading-relaxed mb-2">
                            "{step.quote.text}"
                          </blockquote>
                          <footer className="text-sm text-muted-foreground font-medium">— {step.quote.author}</footer>
                        </div>
                      )}
                    </div>
                    
                    {step.image && (
                      <div className="relative bg-muted/20">
                        <img 
                          src={step.image}
                          alt={`${step.title} illustration`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
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