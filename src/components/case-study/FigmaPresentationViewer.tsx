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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <a 
              href={presentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Open in Figma <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <div className="bg-background rounded border aspect-video flex items-center justify-center">
            <a 
              href={presentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-col items-center gap-4 p-8 hover:bg-muted/50 rounded-lg transition-colors group"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ExternalLink className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">View Interactive Presentation</h3>
                <p className="text-muted-foreground text-sm">
                  Click to open the full interactive Figma presentation
                </p>
              </div>
            </a>
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