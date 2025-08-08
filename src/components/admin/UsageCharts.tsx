import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useUsageChartData } from "@/hooks/useApiUsageQueries";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/utils/costCalculator";
import { Loader2 } from "lucide-react";

export const UsageCharts = () => {
  const { data: chartData, isLoading } = useUsageChartData();

  if (isLoading || !chartData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-60">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const config = {
    text_generation_cost: {
      label: "Chat Completions",
      color: "hsl(var(--primary))",
    },
    image_generation_cost: {
      label: "Images",
      color: "hsl(var(--accent))",
    },
    image_prompt_cost: {
      label: "Image Prompts",
      color: "hsl(var(--secondary))",
    },
  } as const;

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {/* Total Spend (last 30 days) */}
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Spend (Last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="h-72">
            <BarChart data={chartData.daily_costs}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tickFormatter={(v) => formatCurrency(Number(v))} width={60} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent labelKey="date" />} />
              <Bar dataKey="text_generation_cost" stackId="a" fill="var(--color-text_generation_cost)" radius={[4,4,0,0]} />
              <Bar dataKey="image_generation_cost" stackId="a" fill="var(--color-image_generation_cost)" radius={[4,4,0,0]} />
              <Bar dataKey="image_prompt_cost" stackId="a" fill="var(--color-image_prompt_cost)" radius={[4,4,0,0]} />
              <ChartLegend content={<ChartLegendContent nameKey="label" />} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Requests per day (last 30 days) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Requests (Last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ total_requests: { label: "Requests", color: "hsl(var(--primary))" }}} className="h-72">
            <BarChart data={chartData.daily_costs}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis width={40} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent labelKey="date" />} />
              <Bar dataKey="total_requests" fill="var(--color-total_requests)" radius={[4,4,0,0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Capability breakdown charts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Capability Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Chat Completions</div>
            <ChartContainer config={{ text_generation_cost: { label: "Chat", color: "hsl(var(--primary))" }}} className="h-28">
              <BarChart data={chartData.daily_costs}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Bar dataKey="text_generation_cost" fill="var(--color-text_generation_cost)" radius={[4,4,0,0]} />
              </BarChart>
            </ChartContainer>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Images</div>
            <ChartContainer config={{ image_generation_cost: { label: "Images", color: "hsl(var(--accent))" }}} className="h-28">
              <BarChart data={chartData.daily_costs}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Bar dataKey="image_generation_cost" fill="var(--color-image_generation_cost)" radius={[4,4,0,0]} />
              </BarChart>
            </ChartContainer>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Image Prompts</div>
            <ChartContainer config={{ image_prompt_cost: { label: "Prompts", color: "hsl(var(--secondary))" }}} className="h-28">
              <BarChart data={chartData.daily_costs}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Bar dataKey="image_prompt_cost" fill="var(--color-image_prompt_cost)" radius={[4,4,0,0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};