import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, FileText, TrendingUp, Target, Lightbulb, Code, Palette, Loader2, Download, Share } from 'lucide-react';
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
    case 'technical': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'creative': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'productivity': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'insights': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
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
    <>
      <Helmet>
        <title>{`Work Report - ${displayDate} - Jordan Leahy`}</title>
        <meta 
          name="description" 
          content={`Detailed work summary and productivity insights for ${displayDate}. View tasks completed, time spent, and key achievements.`} 
        />
      </Helmet>
      
      <PageLayout>
        <div className="container mx-auto py-4 px-4 lg:py-8">
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-4">
                <Link to="/work-report">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Reports
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {displayDate}
                  </h1>
                  <p className="text-muted-foreground text-sm lg:text-base mt-2">
                    Detailed work summary and insights
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs lg:text-sm text-muted-foreground font-medium">Tasks</p>
                    <p className="text-xl lg:text-2xl font-bold truncate">
                      {summary.metrics.completedTasks || 0}/{summary.metrics.totalTasks || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Clock className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs lg:text-sm text-muted-foreground font-medium">Total Time</p>
                    <p className="text-xl lg:text-2xl font-bold truncate">{summary.metrics.timeSpent || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs lg:text-sm text-muted-foreground font-medium">Completion</p>
                    <p className="text-xl lg:text-2xl font-bold truncate">{completionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs lg:text-sm text-muted-foreground font-medium">Productivity</p>
                    <p className="text-xl lg:text-2xl font-bold truncate">{summary.productivity_score ? `${summary.productivity_score}/10` : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Category Details */}
          <div className="grid gap-6 mb-8">
            {Object.entries(summary.categories_summary || {}).map(([categoryName, categoryData]: [string, any]) => {
              const IconComponent = getCategoryIcon(categoryName);
              const colorClass = getCategoryColor(categoryName);
              
              return (
                <Card key={categoryName} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                  <CardHeader className="bg-gradient-to-r from-card to-muted/20">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge variant="secondary" className={`mr-3 ${colorClass} border`}>
                          <IconComponent className="h-4 w-4 mr-1" />
                          {categoryName}
                        </Badge>
                        <span className="text-base lg:text-lg">Work Summary</span>
                      </div>
                      <Badge variant="outline" className="text-xs lg:text-sm">
                        {categoryData?.timeSpent || 'N/A'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6">
                    <div className="space-y-6">
                      {categoryData?.tasks && categoryData.tasks.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 text-sm lg:text-base flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            Tasks Completed ({categoryData.tasks.length})
                          </h4>
                          <div className="space-y-2">
                            {categoryData.tasks.map((task: string, index: number) => (
                              <div key={index} className="flex items-start p-3 bg-muted/30 rounded-lg">
                                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                <span className="text-sm lg:text-base leading-relaxed">{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {categoryData?.insights && categoryData.insights.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 text-sm lg:text-base flex items-center">
                            <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                            Key Insights ({categoryData.insights.length})
                          </h4>
                          <div className="space-y-2">
                            {categoryData.insights.map((insight: string, index: number) => (
                              <div key={index} className="flex items-start p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                                <Lightbulb className="h-4 w-4 mt-0.5 mr-3 flex-shrink-0 text-amber-500" />
                                <span className="text-sm lg:text-base text-muted-foreground leading-relaxed">{insight}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Enhanced Highlights and Insights */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {summary.highlights && summary.highlights.length > 0 && (
              <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-50/50">
                  <CardTitle className="flex items-center text-emerald-700">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Daily Highlights
                    <Badge variant="secondary" className="ml-auto">
                      {summary.highlights.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <div className="space-y-3">
                    {summary.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm lg:text-base leading-relaxed">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {summary.insights && summary.insights.length > 0 && (
              <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-50/50">
                  <CardTitle className="flex items-center text-amber-700">
                    <Lightbulb className="mr-2 h-5 w-5" />
                    Key Insights
                    <Badge variant="secondary" className="ml-auto">
                      {summary.insights.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <div className="space-y-3">
                    {summary.insights.map((insight, index) => (
                      <div key={index} className="flex items-start p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                        <Lightbulb className="h-4 w-4 mt-1 mr-3 flex-shrink-0 text-amber-500" />
                        <span className="text-sm lg:text-base leading-relaxed">{insight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enhanced Generated Summary */}
          {summary.generated_summary && (
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50/50">
                <CardTitle className="flex items-center text-blue-700">
                  <FileText className="mr-2 h-5 w-5" />
                  AI-Generated Summary
                  <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
                    AI Generated
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="prose prose-sm lg:prose-base max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap bg-blue-50/30 p-4 rounded-lg border border-blue-100">
                    {summary.generated_summary}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageLayout>
    </>
  );
};

export default WorkReportDetailPage;