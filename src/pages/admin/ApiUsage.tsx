import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  RefreshCw, 
  Filter,
  Search,
  Calendar,
  BarChart3,
  DollarSign,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

import { UsageSummaryCards } from "@/components/admin/UsageSummaryCards";
import { ApiUsageTable } from "@/components/admin/ApiUsageTable";
import { UsageDetailModal } from "@/components/admin/UsageDetailModal";
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

  const handleExport = () => {
    // TODO: Implement CSV export functionality
    toast.info("Export functionality will be implemented soon");
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // TODO: Implement search functionality
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

  return (
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
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && !summaryLoading && (
        <UsageSummaryCards summary={summary} />
      )}

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

      {/* Detail Modal */}
      <UsageDetailModal
        record={selectedRecord}
        open={!!selectedRecord}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
      />
    </div>
  );
}