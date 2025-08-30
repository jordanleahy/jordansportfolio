import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkReportActions } from './WorkReportActions';

interface WorkReportHeaderProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onGenerateSummary: () => void;
  isGenerating: boolean;
  selectedDateSummary: any;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export const WorkReportHeader: React.FC<WorkReportHeaderProps> = ({
  selectedDate,
  onDateSelect,
  onGenerateSummary,
  isGenerating,
  selectedDateSummary,
  showFilters,
  onToggleFilters
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Daily Work Summary</h1>
        <p className="text-muted-foreground text-sm lg:text-base">
          Track and review your daily work insights and productivity
        </p>
      </div>
      
      {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
      <div className="flex flex-col sm:flex-row gap-2 lg:gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onToggleFilters}
          className="w-full sm:w-auto"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Filter
          {showFilters ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
        </Button>
        
        <WorkReportActions
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          onGenerateSummary={onGenerateSummary}
          isGenerating={isGenerating}
          selectedDateSummary={selectedDateSummary}
        />
      </div>
    </div>
  );
};