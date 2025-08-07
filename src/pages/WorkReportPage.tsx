import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, TrendingUp, Clock, ChevronRight, Loader2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDailyWorkSummaries } from '@/hooks/useDailyWorkSummaries';
import { format, parseISO } from 'date-fns';

const WorkReportPage: React.FC = () => {
  const { data: summaries, isLoading, error } = useDailyWorkSummaries();

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

  const getCategoryCount = (categoriesSummary: any) => {
    if (!categoriesSummary) return 0;
    return Object.keys(categoriesSummary).length;
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading work reports...</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Error Loading Reports</h2>
                <p className="text-muted-foreground">
                  Failed to load work reports. Please try again later.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Daily Work Summary</h1>
            <p className="text-muted-foreground">
              Track and review your daily work insights and productivity
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Generate Today's Summary
            </Button>
          </div>
        </div>

        {!summaries || summaries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">No Work Reports Yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start tracking your daily work by generating your first summary.
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Today's Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {summaries.map((summary) => (
              <Card key={summary.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {formatDisplayDate(summary.summary_date)}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tasks</p>
                        <p className="font-semibold">
                          {summary.metrics.completedTasks || 0}/{summary.metrics.totalTasks || 0}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Clock className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time Spent</p>
                        <p className="font-semibold">{summary.metrics.timeSpent || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Productivity</p>
                        <p className="font-semibold">{summary.productivity_score ? `${summary.productivity_score}/10` : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(summary.categories_summary || {}).map((category) => (
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
                      {(summary.highlights || []).length > 3 && (
                        <li className="text-sm text-muted-foreground">
                          +{(summary.highlights || []).length - 3} more highlights
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default WorkReportPage;