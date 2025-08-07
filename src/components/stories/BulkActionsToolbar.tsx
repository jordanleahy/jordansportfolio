import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, X, CheckSquare, Square } from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  allSelected: boolean;
  isDeleting?: boolean;
}

export const BulkActionsToolbar = ({
  selectedCount,
  totalCount,
  onDeleteSelected,
  onClearSelection,
  onSelectAll,
  onDeselectAll,
  allSelected,
  isDeleting = false
}: BulkActionsToolbarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-4 z-50 mb-6">
      <div className="mx-auto max-w-2xl">
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                {selectedCount} selected
              </Badge>
              
              <Button
                onClick={allSelected ? onDeselectAll : onSelectAll}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                {allSelected ? (
                  <>
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-3 w-3 mr-1" />
                    Select All ({totalCount})
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={onDeleteSelected}
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                className="px-4"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Selected
              </Button>
              
              <Button
                onClick={onClearSelection}
                variant="ghost"
                size="sm"
                disabled={isDeleting}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};