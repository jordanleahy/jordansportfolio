
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
    <div className={`py-16 px-4 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden border-dashed border-2 border-muted hover:border-primary/30 transition-colors">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-6 text-left hover:bg-muted/30 transition-colors"
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
          </button>

          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-6 pb-6 pt-0 border-t border-muted">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg leading-relaxed text-foreground/90 mt-4">
                  {content}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
