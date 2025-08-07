import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { formatCurrency } from '@/utils/costCalculator';
import { Zap, Image, Type, Calendar } from 'lucide-react';

export const UsageDashboard: React.FC = () => {
  const { data, isLoading, error } = useSubscriptionStatus();

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

  const { subscription, usage, hasActiveSubscription } = data;

  if (!hasActiveSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Subscription Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Subscribe to our Basic Plan for unlimited access to AI features.
          </p>
          <Button className="w-full">
            Subscribe for {formatCurrency(2000 / 100)}/month
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tier = subscription?.tier as any;
  const currentUsage = usage || {
    gpt_images_used: 0,
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {tier?.name}
            </span>
            <Badge variant="secondary">
              {formatCurrency(tier?.price_cents / 100)}/month
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Billing cycle: {new Date(subscription?.current_period_start || '').toLocaleDateString()} - {new Date(subscription?.current_period_end || '').toLocaleDateString()}
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
                <span>{currentUsage.gpt_images_used || 0} used</span>
                <span>{tier?.max_gpt_images || 0} total</span>
              </div>
              <Progress 
                value={getUsagePercentage(currentUsage.gpt_images_used || 0, tier?.max_gpt_images || 0)} 
                className="h-2"
              />
              <Badge 
                variant={getUsagePercentage(currentUsage.gpt_images_used || 0, tier?.max_gpt_images || 0) >= 90 ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {Math.round(getUsagePercentage(currentUsage.gpt_images_used || 0, tier?.max_gpt_images || 0))}% used
              </Badge>
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