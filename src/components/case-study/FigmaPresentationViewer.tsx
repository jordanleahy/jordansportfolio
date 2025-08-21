import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface FigmaPresentationViewerProps {
  title: string;
  presentationUrl: string;
}

export const FigmaPresentationViewer = ({ 
  title, 
  presentationUrl 
}: FigmaPresentationViewerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center">
        <p className="text-muted-foreground">
          Interactive Figma prototype showcasing the user experience design process
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-background rounded border aspect-video">
          <iframe
            src={presentationUrl}
            className="w-full h-full rounded"
            allowFullScreen
            title="Use Case Presentation"
          />
        </div>

      </Card>
    </motion.div>
  );
};