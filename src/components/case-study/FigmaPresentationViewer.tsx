import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface FigmaPresentationViewerProps {
  title: string;
  presentationUrl: string;
}

export const FigmaPresentationViewer = ({
  title,
  presentationUrl,
}: FigmaPresentationViewerProps) => {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h2>
        </motion.div>

        <Card className="overflow-hidden border">
          <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
            <iframe
              src={presentationUrl}
              className="w-full h-full border-0"
              style={{ border: "1px solid rgba(0, 0, 0, 0.1)" }}
              allow="fullscreen; autoplay; clipboard-write"
              allowFullScreen
              title={`${title} - Figma presentation`}
              loading="lazy"
            />
          </div>
        </Card>
      </div>
    </section>
  );
};