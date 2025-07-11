import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ProcessStepProps {
  icon: LucideIcon;
  title: string;
  description: string;
  items?: string[];
  quote?: {
    text: string;
    author: string;
  };
  delay?: number;
  direction?: 'left' | 'right';
}

export const ProcessStep = ({
  icon: Icon,
  title,
  description,
  items,
  quote,
  delay = 0,
  direction = 'left'
}: ProcessStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction === 'left' ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Icon className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground mb-4">{description}</p>
            
            {items && (
              <ul className="text-muted-foreground space-y-2 mb-4">
                {items.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            )}
            
            {quote && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm italic">"{quote.text}"</p>
                <p className="text-xs text-muted-foreground mt-2">— {quote.author}</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};