import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUsageSummary } from '@/hooks/useUsageSummary';
import { Zap, Image, Calendar } from 'lucide-react';
 
export const UsageDashboard: React.FC = () => {
  const { data, isLoading, error, totalCredits, usedCredits, percentUsed, subscriptionTier } = useUsageSummary();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load subscription data</p>
        </CardContent>
      </Card>
    );
  }

  const hasActiveSubscription = true; // unified usage always returns something; can be enhanced later
 
  return (
    <div className="space-y-6">
      {/* Monthly Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Monthly Usage
            </span>
            <Badge variant="outline" className="text-xs">
              {subscriptionTier}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {data?.period?.start ? new Date(data?.period?.start).toLocaleDateString() : '-'} - {data?.period?.end ? new Date(data?.period?.end).toLocaleDateString() : '-'}
            </span>
          </div>
        </CardContent>
      </Card>
 
      {/* Usage Metrics */}
      <div className="grid gap-4 md:grid-cols-1">
        {/* GPT Image Generations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Image className="h-4 w-4" />
              GPT Image Generations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{usedCredits} used</span>
                <span>{totalCredits} total</span>
              </div>
              <Progress value={percentUsed} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
 
      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1">
              Manage Billing
            </Button>
            <Button variant="outline" className="flex-1">
              View Invoice History
            </Button>
            <Button className="flex-1">
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};