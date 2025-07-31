import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Activity, Zap, CheckCircle } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "@/utils/costCalculator";
import { UsageSummary } from "@/types/apiUsage";

interface UsageSummaryCardsProps {
  summary: UsageSummary;
}

export const UsageSummaryCards = ({ summary }: UsageSummaryCardsProps) => {
  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "text-red-500";
    if (current < previous) return "text-green-500";
    return "text-muted-foreground";
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-3 w-3" />;
    if (current < previous) return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Cost Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost Today</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.total_cost_today)}</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <span className={getTrendColor(summary.total_cost_today, summary.total_cost_week / 7)}>
              vs. avg daily
            </span>
            {getTrendIcon(summary.total_cost_today, summary.total_cost_week / 7)}
          </div>
        </CardContent>
      </Card>

      {/* Total Requests Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Requests Today</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.total_requests_today)}</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <span className={getTrendColor(summary.total_requests_today, summary.total_requests_week / 7)}>
              vs. avg daily
            </span>
            {getTrendIcon(summary.total_requests_today, summary.total_requests_week / 7)}
          </div>
        </CardContent>
      </Card>

      {/* Total Tokens Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tokens Today</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.total_tokens_today)}</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <span className={getTrendColor(summary.total_tokens_today, summary.total_tokens_week / 7)}>
              vs. avg daily
            </span>
            {getTrendIcon(summary.total_tokens_today, summary.total_tokens_week / 7)}
          </div>
        </CardContent>
      </Card>

      {/* Success Rate Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(summary.success_rate_today)}</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <span className={getTrendColor(summary.success_rate_week, summary.success_rate_today)}>
              vs. weekly avg
            </span>
            {getTrendIcon(summary.success_rate_week, summary.success_rate_today)}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Overview */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Cost:</span>
            <span className="font-medium">{formatCurrency(summary.total_cost_month)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Requests:</span>
            <span className="font-medium">{formatNumber(summary.total_requests_month)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Tokens:</span>
            <span className="font-medium">{formatNumber(summary.total_tokens_month)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Success Rate:</span>
            <span className="font-medium">{formatPercentage(summary.success_rate_month)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Users This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.top_users.slice(0, 3).map((user, index) => (
              <div key={user.user_id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <div>
                    <div className="text-sm font-medium">{user.user_name || user.user_email}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(user.total_requests)} requests
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(user.total_cost)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};