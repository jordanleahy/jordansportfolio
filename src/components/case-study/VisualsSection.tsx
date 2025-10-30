import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { VisualsArtifacts } from "@/types/caseStudy";

interface VisualsSectionProps {
  data: VisualsArtifacts;
}

export const VisualsSection = ({ data }: VisualsSectionProps) => {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Visuals & Artifacts</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Design Artifacts</h3>
            <ul className="space-y-2">
              {data.designArtifacts.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2" style={{ color: '#000' }}>
                  <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Process Documentation</h3>
            <ul className="space-y-2">
              {data.processDocumentation.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2" style={{ color: '#000' }}>
                  <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
};