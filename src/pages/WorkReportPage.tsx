import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data for daily work summaries
const mockReports = [
  {
    date: '2024-01-08',
    displayDate: 'Today, Jan 8',
    totalTasks: 12,
    completedTasks: 8,
    timeSpent: '6.5 hours',
    categories: ['Technical', 'Creative', 'Productivity'],
    highlights: ['Completed React component refactoring', 'Designed new user interface', 'Optimized database queries']
  },
  {
    date: '2024-01-07',
    displayDate: 'Yesterday, Jan 7', 
    totalTasks: 15,
    completedTasks: 13,
    timeSpent: '7.2 hours',
    categories: ['Technical', 'Insights', 'Planning'],
    highlights: ['Fixed critical bug in payment system', 'Analyzed user behavior patterns', 'Planned next sprint goals']
  },
  {
    date: '2024-01-06',
    displayDate: 'Saturday, Jan 6',
    totalTasks: 8,
    completedTasks: 6,
    timeSpent: '4.0 hours',
    categories: ['Creative', 'Technical'],
    highlights: ['Created design mockups', 'Implemented API endpoints', 'Code review session']
  },
  {
    date: '2024-01-05',
    displayDate: 'Friday, Jan 5',
    totalTasks: 18,
    completedTasks: 16,
    timeSpent: '8.1 hours',
    categories: ['Technical', 'Productivity', 'Insights', 'Creative'],
    highlights: ['Deployed new features to production', 'Automated testing pipeline', 'User research insights']
  }
];

const WorkReportPage: React.FC = () => {
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
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            View Calendar
          </Button>
        </div>

        <div className="grid gap-6">
          {mockReports.map((report) => (
            <Card key={report.date} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{report.displayDate}</CardTitle>
                  <Link to={`/work-report/${report.date}`}>
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
                      <p className="font-semibold">{report.completedTasks}/{report.totalTasks}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time Spent</p>
                      <p className="font-semibold">{report.timeSpent}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="font-semibold">{Math.round((report.completedTasks / report.totalTasks) * 100)}%</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {report.categories.map((category) => (
                      <span key={category} className="px-3 py-1 bg-muted rounded-full text-sm">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Key Highlights:</p>
                  <ul className="space-y-1">
                    {report.highlights.map((highlight, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default WorkReportPage;