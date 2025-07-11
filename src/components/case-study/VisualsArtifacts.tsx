import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Target } from "lucide-react";

interface VisualsArtifactsData {
  designArtifacts: string[];
  processDocumentation: string[];
}

interface VisualsArtifactsProps {
  data: VisualsArtifactsData;
}

export const VisualsArtifacts = ({ data }: VisualsArtifactsProps) => {
  return (
    <>
      <h2 className="text-3xl font-bold mb-12 text-center">Visuals & Artifacts</h2>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Design Artifacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-muted p-2 rounded-lg">
                <Eye className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">Design Artifacts</h3>
            </div>
            <ul className="space-y-3">
              {data.designArtifacts.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary mr-2 mt-1">•</span>
                  <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Process Documentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-muted p-2 rounded-lg">
                <Target className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">Process Documentation</h3>
            </div>
            <ul className="space-y-3">
              {data.processDocumentation.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary mr-2 mt-1">•</span>
                  <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl mx-auto">
          A balanced mix of process documentation (60%) and visual artifacts (40%) demonstrates both strategic thinking and execution excellence.
        </p>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <Button className="bg-foreground text-background hover:bg-foreground/90 px-8 py-3">
          Request Full Case Study Details
        </Button>
      </motion.div>
    </>
  );
};