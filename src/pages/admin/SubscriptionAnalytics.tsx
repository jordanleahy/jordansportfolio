import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatNumber } from '@/utils/costCalculator';
import { Helmet } from 'react-helmet-async';
import { PageLayout } from '@/components/layout/PageLayout';
import { DollarSign, Users, TrendingUp, AlertTriangle } from 'lucide-react';

interface SubscriptionAnalytics {
  total_subscribers: number;
  total_monthly_revenue: number;
  total_usage_cost: number;
  profit_margin: number;
  top_users: Array<{
    user_id: string;
    total_cost: number;
    subscription_revenue: number;
    profit_margin: number;
  }>;
  usage_by_type: Array<{
    usage_type: string;
    total_usage: number;
    total_cost: number;
  }>;
}

const useSubscriptionAnalytics = () => {
  return useQuery({
    queryKey: ['subscription-analytics'],
    queryFn: async () => {
      // Get all active subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          tier:subscription_tiers(*)
        `)
        .eq('status', 'active');

      if (subError) throw subError;

      // Get current month's API usage costs
      const { data: apiUsage, error: apiError } = await supabase
        .from('api_usage_tracking')
        .select('*')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      if (apiError) throw apiError;

      // Calculate analytics
      const totalSubscribers = subscriptions.length;
      const totalMonthlyRevenue = subscriptions.reduce((sum, sub) => 
        sum + ((sub.tier as any)?.price_cents || 0), 0) / 100;

      const totalUsageCost = apiUsage.reduce((sum, usage) => 
        sum + (usage.estimated_cost || 0), 0);

      const profitMargin = totalMonthlyRevenue > 0 
        ? ((totalMonthlyRevenue - totalUsageCost) / totalMonthlyRevenue) * 100 
        : 0;

      // Group usage by user for top users analysis
      const userUsage = apiUsage.reduce((acc, usage) => {
        const userId = usage.user_id;
        if (!acc[userId]) {
          acc[userId] = { total_cost: 0, count: 0 };
        }
        acc[userId].total_cost += usage.estimated_cost || 0;
        acc[userId].count += 1;
        return acc;
      }, {} as Record<string, { total_cost: number; count: number }>);

      const topUsers = Object.entries(userUsage)
        .map(([userId, data]) => {
          const subscription = subscriptions.find(s => s.user_id === userId);
          const subscriptionRevenue = subscription ? ((subscription.tier as any)?.price_cents || 0) / 100 : 0;
          return {
            user_id: userId,
            total_cost: data.total_cost,
            subscription_revenue: subscriptionRevenue,
            profit_margin: subscriptionRevenue > 0 
              ? ((subscriptionRevenue - data.total_cost) / subscriptionRevenue) * 100 
              : 0,
          };
        })
        .sort((a, b) => b.total_cost - a.total_cost)
        .slice(0, 10);

      // Group usage by type
      const usageByType = apiUsage.reduce((acc, usage) => {
        const type = usage.request_type;
        if (!acc[type]) {
          acc[type] = { total_usage: 0, total_cost: 0 };
        }
        acc[type].total_usage += 1;
        acc[type].total_cost += usage.estimated_cost || 0;
        return acc;
      }, {} as Record<string, { total_usage: number; total_cost: number }>);

      return {
        total_subscribers: totalSubscribers,
        total_monthly_revenue: totalMonthlyRevenue,
        total_usage_cost: totalUsageCost,
        profit_margin: profitMargin,
        top_users: topUsers,
        usage_by_type: Object.entries(usageByType).map(([type, data]) => ({
          usage_type: type,
          total_usage: data.total_usage,
          total_cost: data.total_cost,
        })),
      } as SubscriptionAnalytics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

const SubscriptionAnalytics: React.FC = () => {
  const { data: analytics, isLoading, error } = useSubscriptionAnalytics();

  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-16 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !analytics) {
    return (
      <PageLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load analytics data</p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Helmet>
        <title>Subscription Analytics - Admin Dashboard</title>
        <meta name="description" content="Monitor subscription metrics and profitability" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Subscription Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your subscription business metrics and profitability
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.total_subscribers)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.total_monthly_revenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usage Costs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.total_usage_cost)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.profit_margin.toFixed(1)}%
              </div>
              <Badge 
                variant={analytics.profit_margin >= 300 ? 'default' : analytics.profit_margin >= 200 ? 'secondary' : 'destructive'}
                className="mt-2"
              >
                {analytics.profit_margin >= 400 ? 'Excellent' : 
                 analytics.profit_margin >= 300 ? 'Good' : 
                 analytics.profit_margin >= 200 ? 'Fair' : 'Poor'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Usage by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.usage_by_type.map((usage) => (
                <div key={usage.usage_type} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{usage.usage_type.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(usage.total_usage)} requests
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(usage.total_cost)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(usage.total_cost / usage.total_usage)}/request
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle>Top Users by Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.top_users.map((user, index) => (
                <div key={user.user_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium text-sm">User {user.user_id.slice(0, 8)}...</p>
                      <p className="text-sm text-muted-foreground">
                        Revenue: {formatCurrency(user.subscription_revenue)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(user.total_cost)}</p>
                    <Badge 
                      variant={user.profit_margin >= 300 ? 'default' : user.profit_margin >= 200 ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {user.profit_margin.toFixed(0)}% margin
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default SubscriptionAnalytics;