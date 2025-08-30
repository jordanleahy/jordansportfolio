import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { WorkReportDatePicker } from './WorkReportDatePicker';

interface WorkReportActionsProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onGenerateSummary: () => void;
  isGenerating: boolean;
  selectedDateSummary: any;
  className?: string;
}

export const WorkReportActions: React.FC<WorkReportActionsProps> = ({
  selectedDate,
  onDateSelect,
  onGenerateSummary,
  isGenerating,
  selectedDateSummary,
  className = ""
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <WorkReportDatePicker
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        buttonClassName="w-full sm:w-auto"
      />
      
      <Button 
        size="sm" 
        onClick={onGenerateSummary}
        disabled={isGenerating}
        className="w-full sm:w-auto"
      >
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
        ) : (
          <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
        )}
        <span className="truncate">
          {isGenerating ? 'Generating...' : 
           selectedDateSummary ? 'Regenerate' : 'Generate'}
        </span>
      </Button>
    </div>
  );
};