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
        <h2 className="text-3xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground">
          Interactive Figma prototype showcasing the user experience design process
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="relative bg-muted/30 p-4">
          
          <div className="bg-background rounded border aspect-video">
            <iframe
              src={presentationUrl}
              className="w-full h-full rounded"
              allowFullScreen
              title="Use Case Presentation"
            />
          </div>
        </div>

        <div className="p-6 bg-background">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">User Flows</h4>
              <p className="text-muted-foreground">
                Complete clinical workflow documentation and user journey mapping
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Interactive Prototypes</h4>
              <p className="text-muted-foreground">
                High-fidelity mockups with realistic clinical data and interactions
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Design System</h4>
              <p className="text-muted-foreground">
                Component library and design tokens for consistent healthcare UX
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};