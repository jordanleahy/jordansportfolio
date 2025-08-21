import { motion } from "framer-motion";
import { Section } from "@/components/layout/Section";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinalProduct } from "@/types/caseStudy";

interface FinalProductSectionProps {
  data: FinalProduct;
}

export const FinalProductSection = ({ data }: FinalProductSectionProps) => {
  return (
    <div className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground">
            {data.title}
          </h2>
          {data.description && (
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {data.description}
            </p>
          )}
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto mt-8 px-4">
        <div className="relative bg-card border rounded-lg overflow-hidden shadow-sm w-full" style={{ aspectRatio: "1440/1024" }}>
          <iframe
            src={data.prototypeUrl}
            className="w-full h-full border-0"
            style={{ 
              border: "1px solid rgba(0, 0, 0, 0.1)"
            }}
            allowFullScreen
            title="Interactive Prototype"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};