import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Reflection } from "@/types/caseStudy";
import { iconMap } from "@/utils/iconMap";

interface ReflectionSectionProps {
  title: string;
  reflections: Reflection[];
}

export const ReflectionSection = ({ title, reflections }: ReflectionSectionProps) => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reflections.map((reflection, index) => {
            const iconKey = reflection.type === 'success' ? 'CheckCircle' : 
                           reflection.type === 'challenge' ? 'AlertTriangle' : 'Lightbulb';
            const IconComponent = iconMap[iconKey as keyof typeof iconMap];
            
            const gradientClass = reflection.type === 'success' ? 'from-green-500/10 to-emerald-500/10' :
                                 reflection.type === 'challenge' ? 'from-amber-500/10 to-orange-500/10' : 
                                 'from-blue-500/10 to-cyan-500/10';
            const iconColor = reflection.type === 'success' ? 'text-green-600 dark:text-green-400' :
                             reflection.type === 'challenge' ? 'text-amber-600 dark:text-amber-400' : 
                             'text-blue-600 dark:text-blue-400';
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="p-8 h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col h-full">
                    <div className={`bg-gradient-to-br ${gradientClass} p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6`}>
                      <IconComponent className={`h-8 w-8 ${iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-6 text-foreground">{reflection.title}</h3>
                      <ul className="space-y-4">
                        {reflection.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-muted-foreground flex items-start gap-3 leading-relaxed">
                            <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
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