import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from "lucide-react";

interface ExportColumnsSelectorProps {
  allColumns: string[];
  defaultColumns: string[];
  onExport: (selectedColumns: string[]) => void;
  isExporting?: boolean;
}

export const ExportColumnsSelector = ({ 
  allColumns, 
  defaultColumns, 
  onExport, 
  isExporting = false 
}: ExportColumnsSelectorProps) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(defaultColumns);

  const handleColumnToggle = (column: string, checked: boolean) => {
    if (checked) {
      setSelectedColumns(prev => [...prev, column]);
    } else {
      setSelectedColumns(prev => prev.filter(col => col !== column));
    }
  };

  const handleSelectAll = () => {
    setSelectedColumns(allColumns);
  };

  const handleSelectDefault = () => {
    setSelectedColumns(defaultColumns);
  };

  const handleClearAll = () => {
    setSelectedColumns([]);
  };

  const formatColumnName = (column: string) => {
    return column
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Export Columns</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={handleSelectDefault}>
            Default
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {allColumns.map(column => (
              <div key={column} className="flex items-center space-x-2">
                <Checkbox
                  id={column}
                  checked={selectedColumns.includes(column)}
                  onCheckedChange={(checked) => handleColumnToggle(column, !!checked)}
                />
                <Label htmlFor={column} className="text-sm font-medium">
                  {formatColumnName(column)}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            {selectedColumns.length} of {allColumns.length} columns selected
          </div>
          <Button 
            onClick={() => onExport(selectedColumns)}
            disabled={selectedColumns.length === 0 || isExporting}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};