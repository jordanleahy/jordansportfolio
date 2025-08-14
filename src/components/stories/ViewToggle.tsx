import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Table2 } from 'lucide-react';

export type ViewMode = 'table' | 'card';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  className = ''
}) => {
  return (
    <div className={`hidden md:flex border rounded-lg p-1 bg-muted/50 ${className}`}>
      <Button
        variant={currentView === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className={`h-8 px-3 ${currentView === 'table' ? 'shadow-sm' : 'hover:bg-background/80'}`}
      >
        <Table2 className="h-4 w-4 mr-2" />
        Table
      </Button>
      <Button
        variant={currentView === 'card' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('card')}
        className={`h-8 px-3 ${currentView === 'card' ? 'shadow-sm' : 'hover:bg-background/80'}`}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Cards
      </Button>
    </div>
  );
};