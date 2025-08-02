import React from 'react';
import { Button } from '@/components/ui/button';
import { updateChartTypeColors } from '@/utils/updateChartTypeColors';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export function ColorThemeFixer() {
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleUpdateColors = async () => {
    setIsUpdating(true);
    try {
      await updateChartTypeColors();
      toast.success('Chart-type colors updated successfully!');
      // Refresh the page to see changes
      window.location.reload();
    } catch (error) {
      console.error('Failed to update colors:', error);
      toast.error('Failed to update colors. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold mb-2">Fix Chart-Type Color Theme</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Update the chart-type system prompt to use the default vibrant color theme instead of the gray/black palette.
      </p>
      <Button 
        onClick={handleUpdateColors} 
        disabled={isUpdating}
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
        {isUpdating ? 'Updating...' : 'Update Colors'}
      </Button>
    </div>
  );
}