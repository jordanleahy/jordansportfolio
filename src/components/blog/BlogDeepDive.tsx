import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface BlogDeepDiveProps {
  title?: string;
  content: string;
  className?: string;
}

export const BlogDeepDive = ({ 
  title = "Deep Dive", 
  content, 
  className = "" 
}: BlogDeepDiveProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className={`py-8 px-4 ${className}`}
    >
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden border-dashed border-2 border-muted hover:border-primary/30 transition-colors">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-6 text-left hover:bg-muted/30 transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  🔍 {title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isExpanded ? "Click to collapse" : "Click to expand this section if needed"}
                </p>
              </div>
              <div className="ml-4">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </motion.button>

          <motion.div
            initial={false}
            animate={{
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0 border-t border-muted">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={isExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: isExpanded ? 0.1 : 0 }}
                className="prose prose-lg max-w-none"
              >
                <p className="text-lg leading-relaxed text-foreground/90 mt-4">
                  {content}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </Card>
      </div>
    </motion.section>
  );
};