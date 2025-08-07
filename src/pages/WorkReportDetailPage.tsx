import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, FileText, TrendingUp, Target, Lightbulb, Code, Palette } from 'lucide-react';

// Mock detailed data for a specific day
const mockDetailedReport = {
  '2024-01-08': {
    date: '2024-01-08',
    displayDate: 'Today, January 8, 2024',
    summary: {
      totalTasks: 12,
      completedTasks: 8,
      timeSpent: '6.5 hours',
      completionRate: 67,
      focusTime: '4.2 hours',
      breakTime: '2.3 hours'
    },
    categories: {
      technical: {
        icon: Code,
        color: 'bg-blue-100 text-blue-600',
        tasks: [
          'Refactored React components for better performance',
          'Fixed memory leaks in data visualization',
          'Implemented new API endpoints for user management',
          'Optimized database queries for faster load times'
        ],
        timeSpent: '3.5 hours',
        insights: ['Performance improvements increased page load speed by 40%', 'Memory optimization reduced crashes by 60%']
      },
      creative: {
        icon: Palette,
        color: 'bg-purple-100 text-purple-600',
        tasks: [
          'Designed new user onboarding flow',
          'Created wireframes for mobile app',
          'Updated brand guidelines documentation'
        ],
        timeSpent: '2.0 hours',
        insights: ['New onboarding flow shows 25% better user retention', 'Mobile wireframes approved by stakeholders']
      },
      productivity: {
        icon: TrendingUp,
        color: 'bg-green-100 text-green-600',
        tasks: [
          'Automated daily reporting process',
          'Set up CI/CD pipeline improvements',
          'Organized project documentation'
        ],
        timeSpent: '1.0 hours',
        insights: ['Automation saves 2 hours per day', 'Documentation organization improves team efficiency']
      },
      insights: {
        icon: Lightbulb,
        color: 'bg-orange-100 text-orange-600',
        tasks: [
          'Analyzed user behavior patterns',
          'Identified performance bottlenecks',
          'Researched new technology trends'
        ],
        timeSpent: '1.0 hours',
        insights: ['User analysis reveals 3 key improvement areas', 'New tech trends suggest architecture updates']
      }
    },
    keyMetrics: [
      { label: 'Code Commits', value: '15', change: '+3 from yesterday' },
      { label: 'Issues Resolved', value: '8', change: '+2 from yesterday' },
      { label: 'Features Completed', value: '3', change: '+1 from yesterday' },
      { label: 'Team Collaborations', value: '6', change: 'Same as yesterday' }
    ],
    reflection: 'Today was highly productive with significant progress on both technical and creative fronts. The React refactoring will have long-term benefits for maintainability. The new onboarding design received positive feedback and is ready for development. Focus time was good, though could benefit from longer uninterrupted blocks tomorrow.'
  }
};

const WorkReportDetailPage: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const report = date ? mockDetailedReport[date as keyof typeof mockDetailedReport] : null;

  if (!report) {
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
              <h1 className="text-3xl font-bold">{report.displayDate}</h1>
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
                  <p className="text-xl font-bold">{report.summary.completedTasks}/{report.summary.totalTasks}</p>
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
                  <p className="text-xl font-bold">{report.summary.timeSpent}</p>
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
                  <p className="text-xl font-bold">{report.summary.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Focus Time</p>
                  <p className="text-xl font-bold">{report.summary.focusTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {report.keyMetrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <p className="text-2xl font-bold text-primary">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-xs text-green-600">{metric.change}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Details */}
        <div className="grid gap-6 mb-8">
          {Object.entries(report.categories).map(([categoryName, category]) => {
            const IconComponent = category.icon;
            return (
              <Card key={categoryName}>
                <CardHeader>
                  <CardTitle className="flex items-center capitalize">
                    <div className={`p-2 rounded-lg mr-3 ${category.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    {categoryName} Work
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      {category.timeSpent}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Tasks Completed:</h4>
                      <ul className="space-y-1">
                        {category.tasks.map((task, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Key Insights:</h4>
                      <ul className="space-y-1">
                        {category.insights.map((insight, index) => (
                          <li key={index} className="flex items-start text-sm text-muted-foreground">
                            <Lightbulb className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-orange-500" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Daily Reflection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              Daily Reflection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {report.reflection}
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default WorkReportDetailPage;