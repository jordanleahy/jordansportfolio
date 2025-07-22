
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "card" | "table";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  // Initialize from localStorage if available
  useEffect(() => {
    const savedViewMode = localStorage.getItem("vendor-view-mode") as ViewMode | null;
    if (savedViewMode && (savedViewMode === "card" || savedViewMode === "table")) {
      onViewModeChange(savedViewMode);
    }
  }, [onViewModeChange]);

  const handleViewModeChange = (mode: ViewMode) => {
    // Save to localStorage for persistence
    localStorage.setItem("vendor-view-mode", mode);
    onViewModeChange(mode);
  };

  return (
    <div className="flex items-center space-x-1 border rounded-md">
      <Button
        variant={viewMode === "card" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleViewModeChange("card")}
        className="rounded-r-none"
        title="Card View"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleViewModeChange("table")}
        className="rounded-l-none"
        title="Table View"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
