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
    <Section className="py-16" maxWidth="6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">
            {data.title}
          </h2>
          {data.description && (
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {data.description}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div className="relative bg-card border rounded-lg overflow-hidden shadow-sm">
            <iframe
              src={data.prototypeUrl}
              className="w-full h-[600px] border-0"
              allowFullScreen
              title="Interactive Prototype"
              loading="lazy"
            />
          </div>
          
          <div className="flex justify-center">
            <Button asChild variant="outline" size="lg">
              <a 
                href={data.prototypeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                View Full Prototype
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </motion.div>
    </Section>
  );
};