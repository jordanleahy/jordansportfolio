import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { VisualsArtifacts } from "@/types/caseStudy";

interface VisualsSectionProps {
  data: VisualsArtifacts;
}

export const VisualsSection = ({ data }: VisualsSectionProps) => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Visuals & Artifacts</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-8 h-full border-0 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
                <h3 className="text-2xl font-bold text-foreground">Design Artifacts</h3>
              </div>
              <ul className="space-y-4">
                {data.designArtifacts.map((item, index) => (
                  <li key={index} className="text-muted-foreground flex items-start gap-3 leading-relaxed">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="p-8 h-full border-0 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
                <h3 className="text-2xl font-bold text-foreground">Process Documentation</h3>
              </div>
              <ul className="space-y-4">
                {data.processDocumentation.map((item, index) => (
                  <li key={index} className="text-muted-foreground flex items-start gap-3 leading-relaxed">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};