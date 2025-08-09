import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DailyWorkSummary } from '@/hooks/useDailyWorkSummaries';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface WorkReportCardProps {
  summary: DailyWorkSummary;
  isLoading?: boolean;
}

// Helper to theme category badges consistently with detail page
const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'technical': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'creative': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'productivity': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'insights': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'bugs': return 'bg-red-50 text-red-700 border-red-200';
    case 'deployments': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'decisions': return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'next actions':
    case 'next_actions': return 'bg-teal-50 text-teal-700 border-teal-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};
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

export const WorkReportCard: React.FC<WorkReportCardProps> = memo(({ summary, isLoading = false }) => {
  const displayDate = formatDisplayDate(summary.summary_date);
  const categories = Object.keys(summary.categories_summary || {});
  const highlightCount = summary.highlights?.length || 0;
  const { tasksCount, insightsCount } = React.useMemo(() => {
    const values = Object.values(summary.categories_summary || {}) as any[];
    const t = values.reduce((acc, v) => acc + ((v?.tasks?.length) || 0), 0);
    const i = values.reduce((acc, v) => acc + ((v?.insights?.length) || 0), 0);
    return { tasksCount: t, insightsCount: i };
  }, [summary.categories_summary]);

  return (
    <Card className={`transition-shadow ${isLoading ? 'animate-pulse' : 'hover:shadow-lg'}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {displayDate}
          </CardTitle>
          <Link to={`/work-report/${summary.summary_date}`}>
            <Button variant="ghost" size="sm" disabled={isLoading}>
              View Details
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div>
              <div className="h-3 w-24 bg-muted rounded mb-2" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
            <div>
              <div className="h-3 w-28 bg-muted rounded mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Categories:</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge key={category} variant="secondary" className={`capitalize border ${getCategoryColor(category)}`}>
                    {category}
                  </Badge>
                ))}
              </div>
              {(tasksCount > 0 || insightsCount > 0) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Summary: {tasksCount} tasks · {insightsCount} insights
                </p>
              )}
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
          </>
        )}
      </CardContent>
    </Card>
  );
});

WorkReportCard.displayName = 'WorkReportCard';