import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Image, DollarSign, Users } from "lucide-react";

interface UsageOverviewResponse {
  totals: {
    images: number;
    cost: number;
    users: number;
  };
  periods: {
    week: { images: number; cost: number };
    month: { images: number; cost: number };
    allTime: { images: number; cost: number };
  };
  daily: { date: string; images: number; cost: number }[];
}

export function UsageOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-usage-overview'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('aggregate-api-usage');
      if (error) throw error;
      return data as UsageOverviewResponse;
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-12 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data || !data.totals || !data.periods) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Failed to load usage overview</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totals?.images?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              All-time generations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(data.totals?.cost || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All-time spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totals?.users || 0}</div>
            <p className="text-xs text-muted-foreground">
              Users with generations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.periods?.month?.images || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${(data.periods?.month?.cost || 0).toFixed(2)} spent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>This Week</span>
              <div className="text-right">
                <Badge variant="secondary">{data.periods?.week?.images || 0}</Badge>
                <p className="text-sm text-muted-foreground">${(data.periods?.week?.cost || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>This Month</span>
              <div className="text-right">
                <Badge variant="secondary">{data.periods?.month?.images || 0}</Badge>
                <p className="text-sm text-muted-foreground">${(data.periods?.month?.cost || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>All Time</span>
              <div className="text-right">
                <Badge>{data.periods?.allTime?.images || 0}</Badge>
                <p className="text-sm text-muted-foreground">${(data.periods?.allTime?.cost || 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Images (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.daily || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date" 
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any, name: string) => [
                    name === 'images' ? `${value} images` : `$${Number(value).toFixed(2)}`,
                    name === 'images' ? 'Images' : 'Cost'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="images" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}