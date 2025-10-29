import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Feature } from "@/types/caseStudy";
import { iconMap } from "@/utils/iconMap";
import { ImageThumbnails } from "@/components/ui/lightbox";

interface SolutionSectionProps {
  title: string;
  features: Feature[];
}

export const SolutionSection = ({ title, features }: SolutionSectionProps) => {
  return (
    <section className="py-16 px-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <div className="flex flex-col">
                    <div className="bg-primary/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                      <p className="text-[18px] font-normal leading-[27px] tracking-[-0.18px]" style={{ color: '#000' }}>{feature.description}</p>
                      {feature.images && feature.images.length > 0 && (
                        <div className="mt-4">
                          <ImageThumbnails images={feature.images} />
                        </div>
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