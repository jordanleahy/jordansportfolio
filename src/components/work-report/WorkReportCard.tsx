import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DailyWorkSummary } from '@/hooks/useDailyWorkSummaries';
import { format, parseISO } from 'date-fns';

interface WorkReportCardProps {
  summary: DailyWorkSummary;
}

const formatDisplayDate = (dateString: string) => {
  const date = parseISO(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
    return `Today, ${format(date, 'MMM d')}`;
  } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
    return `Yesterday, ${format(date, 'MMM d')}`;
  } else {
    return format(date, 'EEEE, MMM d');
  }
};

export const WorkReportCard: React.FC<WorkReportCardProps> = memo(({ summary }) => {
  const displayDate = formatDisplayDate(summary.summary_date);
  const categories = Object.keys(summary.categories_summary || {});
  const highlightCount = summary.highlights?.length || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {displayDate}
          </CardTitle>
          <Link to={`/work-report/${summary.summary_date}`}>
            <Button variant="ghost" size="sm">
              View Details
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Categories:</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category} className="px-3 py-1 bg-muted rounded-full text-sm capitalize">
                {category}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Key Highlights:</p>
          <ul className="space-y-1">
            {(summary.highlights || []).slice(0, 3).map((highlight, index) => (
              <li key={index} className="text-sm flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {highlight}
              </li>
            ))}
            {highlightCount > 3 && (
              <li className="text-sm text-muted-foreground">
                +{highlightCount - 3} more highlights
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
});

WorkReportCard.displayName = 'WorkReportCard';