import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WorkReportFiltersProps {
  dateFilter: 'all' | '7days' | '30days';
  onDateFilterChange: (filter: 'all' | '7days' | '30days') => void;
}

export const WorkReportFilters: React.FC<WorkReportFiltersProps> = ({
  dateFilter,
  onDateFilterChange
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={dateFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDateFilterChange('all')}
            className="flex-1 sm:flex-none"
          >
            All Time
          </Button>
          <Button
            variant={dateFilter === '7days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDateFilterChange('7days')}
            className="flex-1 sm:flex-none"
          >
            Last 7 Days
          </Button>
          <Button
            variant={dateFilter === '30days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDateFilterChange('30days')}
            className="flex-1 sm:flex-none"
          >
            Last 30 Days
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};