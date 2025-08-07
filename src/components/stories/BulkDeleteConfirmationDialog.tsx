import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { ThemeWithPosts } from "@/types/stories";

interface BulkDeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedThemes: ThemeWithPosts[];
  onConfirm: () => void;
  isDeleting?: boolean;
  progress?: {
    completed: number;
    total: number;
    current?: string;
    errors?: string[];
  };
}

export const BulkDeleteConfirmationDialog = ({
  open,
  onOpenChange,
  selectedThemes,
  onConfirm,
  isDeleting = false,
  progress
}: BulkDeleteConfirmationDialogProps) => {
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  
  const totalPosts = selectedThemes.reduce((sum, theme) => sum + theme.post_count, 0);
  const progressPercentage = progress ? (progress.completed / progress.total) * 100 : 0;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      setConfirmationChecked(false);
      onOpenChange(newOpen);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {isDeleting ? "Deleting Themes..." : "Confirm Bulk Deletion"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeleting ? (
              <div className="space-y-3">
                <div>Deleting themes and their associated content...</div>
                {progress && (
                  <div className="space-y-2">
                    <Progress value={progressPercentage} className="w-full" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{progress.completed} of {progress.total} completed</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    {progress.current && (
                      <div className="text-sm text-muted-foreground">
                        Currently deleting: {progress.current}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  You are about to permanently delete <strong>{selectedThemes.length}</strong> theme
                  {selectedThemes.length !== 1 ? 's' : ''} and <strong>{totalPosts}</strong> associated post
                  {totalPosts !== 1 ? 's' : ''}.
                </div>
                <div className="text-destructive font-medium">
                  This action cannot be undone.
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!isDeleting && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Themes to be deleted:</h4>
              <ScrollArea className="h-32 w-full border rounded-md p-3">
                <div className="space-y-2">
                  {selectedThemes.map((theme) => (
                    <div key={theme.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <div>
                        <div className="font-medium">{theme.theme_name}</div>
                        <div className="text-muted-foreground text-xs">{theme.category}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {theme.post_count} posts
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex items-center space-x-2 p-4 bg-muted/30 rounded-lg">
              <Checkbox
                id="confirm-deletion"
                checked={confirmationChecked}
                onCheckedChange={(checked) => setConfirmationChecked(checked === true)}
              />
              <label
                htmlFor="confirm-deletion"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand that this action cannot be undone
              </label>
            </div>
          </div>
        )}

        {/* Show errors if any */}
        {progress?.errors && progress.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Errors occurred:
            </h4>
            <ScrollArea className="h-20 w-full border rounded-md p-2">
              <div className="space-y-1">
                {progress.errors.map((error, index) => (
                  <div key={index} className="text-sm text-destructive">
                    • {error}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <AlertDialogFooter>
          {isDeleting ? (
            <div className="flex items-center justify-center w-full gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Deleting themes...</span>
            </div>
          ) : (
            <>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirm}
                disabled={!confirmationChecked}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete {selectedThemes.length} Theme{selectedThemes.length !== 1 ? 's' : ''}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};