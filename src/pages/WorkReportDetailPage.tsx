import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, FileText, TrendingUp, Target, Lightbulb, Code, Palette, Loader2 } from 'lucide-react';
import { useDailyWorkSummary } from '@/hooks/useDailyWorkSummaries';
import { format, parseISO } from 'date-fns';

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'technical': return Code;
    case 'creative': return Palette;
    case 'productivity': return TrendingUp;
    case 'insights': return Lightbulb;
    default: return FileText;
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'technical': return 'bg-blue-100 text-blue-600';
    case 'creative': return 'bg-purple-100 text-purple-600';
    case 'productivity': return 'bg-green-100 text-green-600';
    case 'insights': return 'bg-orange-100 text-orange-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const WorkReportDetailPage: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const { data: summary, isLoading, error } = useDailyWorkSummary(date || '');

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading work report...</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !summary) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
            <p className="text-muted-foreground mb-6">
              No work report found for the specified date.
            </p>
            <Link to="/work-report">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reports
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const displayDate = format(parseISO(summary.summary_date), 'EEEE, MMMM d, yyyy');
  const completionRate = summary.metrics.totalTasks && summary.metrics.completedTasks 
    ? Math.round((summary.metrics.completedTasks / summary.metrics.totalTasks) * 100)
    : 0;

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/work-report">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reports
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{displayDate}</h1>
              <p className="text-muted-foreground">Detailed work summary and insights</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Tasks</p>
                  <p className="text-xl font-bold">
                    {summary.metrics.completedTasks || 0}/{summary.metrics.totalTasks || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Time</p>
                  <p className="text-xl font-bold">{summary.metrics.timeSpent || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="text-xl font-bold">{completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Productivity</p>
                  <p className="text-xl font-bold">{summary.productivity_score ? `${summary.productivity_score}/10` : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Details */}
        <div className="grid gap-6 mb-8">
          {Object.entries(summary.categories_summary || {}).map(([categoryName, categoryData]: [string, any]) => {
            const IconComponent = getCategoryIcon(categoryName);
            const colorClass = getCategoryColor(categoryName);
            
            return (
              <Card key={categoryName}>
                <CardHeader>
                  <CardTitle className="flex items-center capitalize">
                    <div className={`p-2 rounded-lg mr-3 ${colorClass}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    {categoryName} Work
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      {categoryData?.timeSpent || 'N/A'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryData?.tasks && categoryData.tasks.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Tasks Completed:</h4>
                        <ul className="space-y-1">
                          {categoryData.tasks.map((task: string, index: number) => (
                            <li key={index} className="flex items-start text-sm">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {categoryData?.insights && categoryData.insights.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Key Insights:</h4>
                        <ul className="space-y-1">
                          {categoryData.insights.map((insight: string, index: number) => (
                            <li key={index} className="flex items-start text-sm text-muted-foreground">
                              <Lightbulb className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-orange-500" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Highlights and Insights */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {summary.highlights && summary.highlights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Daily Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {summary.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {summary.insights && summary.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {summary.insights.map((insight, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Lightbulb className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-orange-500" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Generated Summary */}
        {summary.generated_summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                AI-Generated Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {summary.generated_summary}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default WorkReportDetailPage;