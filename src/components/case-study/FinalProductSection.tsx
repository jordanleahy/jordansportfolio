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
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            {data.title}
          </h2>
          {data.description && (
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {data.description}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="bg-card border rounded-2xl overflow-hidden shadow-xl" style={{ aspectRatio: "16/10" }}>
            <iframe
              src={data.prototypeUrl}
              className="w-full h-full border-0"
              allowFullScreen
              title="Interactive Prototype"
              loading="lazy"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};