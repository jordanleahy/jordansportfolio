import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Reflection } from "@/types/caseStudy";

interface ReflectionSectionProps {
  title: string;
  reflections: Reflection[];
}

export const ReflectionSection = ({ title, reflections }: ReflectionSectionProps) => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reflections.map((reflection, index) => {
            const isSuccess = reflection.type === 'success';
            const isChallenge = reflection.type === 'challenge';
            const isLearning = reflection.type === 'learning';
            
            const iconColor = isSuccess ? 'text-green-500' : isChallenge ? 'text-orange-500' : 'text-blue-500';
            const bgColor = isSuccess ? 'bg-green-500/10' : isChallenge ? 'bg-orange-500/10' : 'bg-blue-500/10';
            const IconComponent = isSuccess ? CheckCircle : isChallenge ? AlertTriangle : ArrowRight;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 ${bgColor} rounded-lg`}>
                      <IconComponent className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold">{reflection.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {reflection.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                        <IconComponent className={`h-4 w-4 ${iconColor} mt-0.5 flex-shrink-0`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};