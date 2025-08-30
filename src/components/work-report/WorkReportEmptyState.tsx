import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { WorkReportActions } from './WorkReportActions';

interface WorkReportEmptyStateProps {
  dateFilter: 'all' | '7days' | '30days';
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onGenerateSummary: () => void;
  isGenerating: boolean;
  selectedDateSummary: any;
}

export const WorkReportEmptyState: React.FC<WorkReportEmptyStateProps> = ({
  dateFilter,
  selectedDate,
  onDateSelect,
  onGenerateSummary,
  isGenerating,
  selectedDateSummary
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8 px-4">
          <FileText className="h-12 lg:h-16 w-12 lg:w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl lg:text-2xl font-bold mb-2">No Work Reports Found</h2>
          <p className="text-muted-foreground mb-6 text-sm lg:text-base">
            {dateFilter !== 'all' 
              ? 'No reports found for the selected time period. Try expanding your date range.'
              : 'Start tracking your daily work by generating your first summary.'
            }
          </p>
          <div className="flex justify-center">
            <WorkReportActions
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
              onGenerateSummary={onGenerateSummary}
              isGenerating={isGenerating}
              selectedDateSummary={selectedDateSummary}
              className="justify-center items-center"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};