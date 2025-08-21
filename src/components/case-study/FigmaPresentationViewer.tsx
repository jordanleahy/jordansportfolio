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
            style={{border: "1px solid rgba(0, 0, 0, 0.1)"}} 
            width="100%" 
            height="100%" 
            src="https://embed.figma.com/proto/XYAGRKZoa2LHlurcKHQxjC/PrescriberPoint?page-id=2107%3A83847&node-id=2107-89623&viewport=7768%2C-4633%2C0.63&scaling=scale-down&content-scaling=fixed&starting-point-node-id=2107%3A89623&embed-host=share" 
            allowFullScreen
            title="Use Case Presentation"
            className="rounded"
          />
        </div>
      </Card>
    </motion.div>
  );
};