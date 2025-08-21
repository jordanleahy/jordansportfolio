import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Feature } from "@/types/caseStudy";
import { iconMap } from "@/utils/iconMap";

interface SolutionSectionProps {
  title: string;
  features: Feature[];
}

export const SolutionSection = ({ title, features }: SolutionSectionProps) => {
  return (
    <section className="py-20 px-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="p-8 h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex flex-col h-full">
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-4 text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
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