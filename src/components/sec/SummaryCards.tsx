import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Building2, DollarSign, Calendar } from "lucide-react";

interface SummaryCardsProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  filters: any;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ dateRange, filters }) => {
  // Mock data for now
  const summaryData = {
    totalOfferings: 1247,
    totalCapitalRaised: 890000000,
    uniqueCompanies: 892,
    avgRaise: 714000
  };

  const isLoading = false; // Will be connected to real data later

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
      title: "Total Offerings",
      value: summaryData.totalOfferings.toLocaleString(),
      icon: Building2,
      description: "SEC filings tracked",
      trend: "+12% from last period"
    },
    {
      title: "Capital Raised",
      value: formatCurrency(summaryData.totalCapitalRaised),
      icon: DollarSign,
      description: "Total amount raised",
      trend: "+18% from last period"
    },
    {
      title: "Unique Companies",
      value: summaryData.uniqueCompanies.toLocaleString(),
      icon: TrendingUp,
      description: "Companies with filings",
      trend: "+8% from last period"
    },
    {
      title: "Average Raise",
      value: formatCurrency(summaryData.avgRaise),
      icon: Calendar,
      description: "Per company average",
      trend: "+5% from last period"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <p className="text-xs text-green-600 mt-1 font-medium">
                {card.trend}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};