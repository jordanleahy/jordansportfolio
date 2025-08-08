import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  RefreshCw, 
  Filter,
  Search,
  Calendar,
  BarChart3,
  DollarSign,
  Activity,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { PageLayout } from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";

import { UsageSummaryCards } from "@/components/admin/UsageSummaryCards";
import { ApiUsageTable } from "@/components/admin/ApiUsageTable";
import { UsageDetailModal } from "@/components/admin/UsageDetailModal";
import { OpenAIUsageSync } from "@/components/admin/OpenAIUsageSync";
import { UsageCharts } from "@/components/admin/UsageCharts";
import { 
  useApiUsageData, 
  useUsageSummary, 
  useUsageFilters 
} from "@/hooks/useApiUsageQueries";
import { ApiUsageRecord } from "@/types/apiUsage";

export default function ApiUsage() {
  const [selectedRecord, setSelectedRecord] = useState<ApiUsageRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [aggregating, setAggregating] = useState(false);
  
  const { filters, updateFilter, clearFilters } = useUsageFilters();
  
  // Data queries
  const { data: usageData, isLoading: usageLoading, refetch: refetchUsage } = useApiUsageData(
    filters, 
    currentPage
  );
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useUsageSummary();

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchUsage(), refetchSummary()]);
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    }
  };

  const handleExport = async () => {
    try {
      toast.info("Preparing export...");
      const maxRows = 5000;
      const pageSize = 1000;
      let all: any[] = [];
      let from = 0;

      const startDate = filters.startDate ? `${filters.startDate}T00:00:00.000Z` : undefined;
      const endDate = filters.endDate ? `${filters.endDate}T23:59:59.999Z` : undefined;

      // Export from api_usage_tracking table
      while (all.length < maxRows) {
        let q: any = (supabase as any)
          .from('api_usage_tracking')
          .select('*')
          .order('created_at', { ascending: true })
          .range(from, from + pageSize - 1);
        if (startDate) q = q.gte('created_at', startDate);
        if (endDate) q = q.lte('created_at', endDate);
        if (filters.userId) q = q.eq('user_id', filters.userId);
        if (filters.functionName) q = q.eq('function_name', filters.functionName);
        if (filters.requestType) q = q.eq('request_type', filters.requestType);
        if (filters.success !== undefined) q = q.eq('success', filters.success);

        const { data, error } = await q;
        if (error) throw error;
        const batch = data || [];
        all = all.concat(batch);
        if (batch.length < pageSize) break;
        from += pageSize;
      }

      const cols = [
        'created_at','user_id','user_email','function_name','model_used','request_type','prompt_tokens','completion_tokens','total_tokens','image_size','image_quality','estimated_cost','actual_cost','success','response_time_ms','openai_request_id','correlation_id'
      ];
      const header = cols.join(',');
      const lines = all.map((r: any) => {
        const vals = [
          r.created_at,
          r.user_id,
          r.user_email || '',
          r.function_name,
          r.model_used || '',
          r.request_type || '',
          r.prompt_tokens ?? '',
          r.completion_tokens ?? '',
          r.total_tokens ?? '',
          r.image_size || '',
          r.image_quality || '',
          r.estimated_cost ?? '',
          r.actual_cost ?? '',
          r.success ?? '',
          r.response_time_ms ?? '',
          r.openai_request_id || '',
          r.correlation_id || (r.request_metadata?.correlation_id ?? ''),
        ];
        return vals.map(v => typeof v === 'string' ? '"' + v.replace(/"/g, '""') + '"' : String(v)).join(',');
      });

      const csv = [header, ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-usage-export-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} rows`);
    } catch (e: any) {
      console.error('Export failed:', e);
      toast.error('Export failed');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleDateRangeSelect = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'today':
        updateFilter('startDate', format(startOfDay(now), 'yyyy-MM-dd'));
        updateFilter('endDate', format(endOfDay(now), 'yyyy-MM-dd'));
        break;
      case 'week':
        updateFilter('startDate', format(startOfDay(subDays(now, 7)), 'yyyy-MM-dd'));
        updateFilter('endDate', format(endOfDay(now), 'yyyy-MM-dd'));
        break;
      case 'month':
        updateFilter('startDate', format(startOfDay(subDays(now, 30)), 'yyyy-MM-dd'));
        updateFilter('endDate', format(endOfDay(now), 'yyyy-MM-dd'));
        break;
      case 'all':
        updateFilter('startDate', undefined);
        updateFilter('endDate', undefined);
        break;
    }
  };

  const handleRebuildAggregates = async () => {
    try {
      setAggregating(true);
      const dateStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.functions.invoke('aggregate-api-usage', {
        body: { date: dateStr },
      });
      if (error) throw error as any;
      toast.success('Aggregates rebuilt for ' + dateStr);
      await refetchSummary();
    } catch (err: any) {
      toast.error('Failed to rebuild aggregates');
    } finally {
      setAggregating(false);
    }
  };
  return (
    <PageLayout>
      <Helmet>
        <title>API Usage Tracking - Admin</title>
        <meta name="description" content="Monitor and analyze AI API usage across your application" />
      </Helmet>
      
      <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <BarChart3 className="h-8 w-8" />
            <span>API Usage Tracking</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and analyze AI API usage across your application
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={usageLoading || summaryLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${(usageLoading || summaryLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleRebuildAggregates} disabled={aggregating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${aggregating ? 'animate-spin' : ''}`} />
            Rebuild Aggregates
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && !summaryLoading && (
        <>
          <UsageSummaryCards summary={summary} />
          <UsageCharts />
        </>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Usage Analytics
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            OpenAI Sync
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Usage History</span>
                  </CardTitle>
                  <CardDescription>
                    Detailed view of all API requests and their costs
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardHeader>
            
            {showFilters && (
              <CardContent className="border-t pt-6">
                <div className="grid gap-4 md:grid-cols-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users, functions..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <Select onValueChange={handleDateRangeSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 days</SelectItem>
                        <SelectItem value="month">Last 30 days</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Function Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Function</label>
                    <Select value={filters.functionName || ''} onValueChange={(value) => updateFilter('functionName', value || undefined)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All functions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All functions</SelectItem>
                        <SelectItem value="generate-image-prompt-dynamic">Image Prompt</SelectItem>
                        <SelectItem value="generate-image-gpt">Image Generation</SelectItem>
                        <SelectItem value="generate-blog-content">Blog Content</SelectItem>
                        <SelectItem value="sync-openai-usage">OpenAI Sync</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={filters.success?.toString() || ''} onValueChange={(value) => updateFilter('success', value === '' ? undefined : value === 'true')}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="true">Success only</SelectItem>
                        <SelectItem value="false">Failed only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active Filters */}
                <div className="flex items-center space-x-2 mt-4">
                  {Object.entries(filters).some(([_, value]) => value !== undefined) && (
                    <>
                      <span className="text-sm text-muted-foreground">Active filters:</span>
                      {filters.functionName && (
                        <Badge variant="secondary">Function: {filters.functionName}</Badge>
                      )}
                      {filters.success !== undefined && (
                        <Badge variant="secondary">Status: {filters.success ? 'Success' : 'Failed'}</Badge>
                      )}
                      {(filters.startDate || filters.endDate) && (
                        <Badge variant="secondary">Date Range</Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear all
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Usage Table */}
          <Card>
            <CardContent className="p-6">
              {usageData && (
                <>
                  <ApiUsageTable
                    data={usageData.data}
                    onViewDetails={setSelectedRecord}
                    isLoading={usageLoading}
                  />
                  
                  {/* Pagination */}
                  {usageData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * usageData.pageSize) + 1} to{' '}
                        {Math.min(currentPage * usageData.pageSize, usageData.total)} of{' '}
                        {usageData.total} results
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {usageData.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === usageData.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <OpenAIUsageSync />
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <UsageDetailModal
        record={selectedRecord}
        open={!!selectedRecord}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
      />
      </div>
    </PageLayout>
  );
}