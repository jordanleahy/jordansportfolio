import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Upload } from "lucide-react";

interface EmptyStateProps {
  category?: string;
  onImportClick?: () => void;
}

export const EmptyState = ({ category, onImportClick }: EmptyStateProps) => {
  return (
    <Card className="p-12">
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">No posts yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {category 
              ? `Get started by importing content for the "${category}" theme or create your first post.`
              : "Get started by importing themes and content or create your first post."
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onImportClick && (
            <Button onClick={onImportClick} className="gap-2">
              <Upload className="h-4 w-4" />
              Import Theme Data
            </Button>
          )}
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Manual Post
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Tip: Import JSON theme data to quickly populate your calendar with content
        </div>
      </div>
    </Card>
  );
};