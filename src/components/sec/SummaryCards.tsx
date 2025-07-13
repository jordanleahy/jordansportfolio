import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Building2, DollarSign, Calendar } from "lucide-react";
import { useSummaryStats } from "@/hooks/useSecQueries";

interface SummaryCardsProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  filters: any;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ dateRange, filters }) => {
  const { data: summaryData, isLoading, error } = useSummaryStats();

  // Default to zeros if no data
  const stats = {
    totalOfferings: summaryData?.totalOfferings || 0,
    totalAmount: summaryData?.totalAmount || 0,
    averageAmount: summaryData?.averageAmount || 0,
    thisMonthOfferings: summaryData?.thisMonthOfferings || 0
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const cards = [
    {
      title: "SEC Filings",
      value: stats.totalOfferings.toLocaleString(),
      icon: Building2,
      description: "Valid numeric filings",
      trend: stats.totalOfferings > 0 ? "Real SEC data" : "No data available"
    },
    {
      title: "Capital Raised",
      value: formatCurrency(stats.totalAmount),
      icon: DollarSign,
      description: "Total amount raised",
      trend: stats.totalAmount > 0 ? "Real SEC data" : "No data available"
    },
    {
      title: "Average Raise",
      value: formatCurrency(stats.averageAmount),
      icon: Calendar,
      description: "Per company average",
      trend: stats.averageAmount > 0 ? "Real SEC data" : "No data available"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              <p className={`text-xs mt-1 font-medium ${card.trend.includes('No data') ? 'text-muted-foreground' : 'text-blue-600'}`}>
                {card.trend}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};