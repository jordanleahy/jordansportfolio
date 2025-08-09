import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, FileText, Plus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useDailyWorkSummaries, useDailyWorkSummary } from '@/hooks/useDailyWorkSummaries';
import { WorkReportCard } from '@/components/work-report/WorkReportCard';
import { WorkReportSkeleton } from '@/components/performance/WorkReportSkeleton';
import { subDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const WorkReportPage: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('30days');
  const [showFilters, setShowFilters] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calculate date range for filtering
  const dateFrom = useMemo(() => {
    if (dateFilter === '7days') return format(subDays(new Date(), 7), 'yyyy-MM-dd');
    if (dateFilter === '30days') return format(subDays(new Date(), 30), 'yyyy-MM-dd');
    return undefined;
  }, [dateFilter]);

  // Check if selected date's summary exists
  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  const { data: selectedDateSummary } = useDailyWorkSummary(selectedDateString);
  
  // Use paginated hook with date filtering
  const { data: summaries, isLoading, error, refetch } = useDailyWorkSummaries({
    limit: 50,
    dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined
  });

  const handleGenerateSummary = async () => {
    if (selectedDateSummary) {
      const confirmRegenerate = confirm(`A summary for ${format(selectedDate, 'MMM d, yyyy')} already exists. Do you want to regenerate it?`);
      if (!confirmRegenerate) return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-work-summary', {
        body: { date: selectedDateString }
      });
      
      if (error) {
        console.error('Error generating summary:', error);
        if (error.message?.includes('No posts found')) {
          toast.error(`No activity found for ${format(selectedDate, 'MMM d, yyyy')}. Create some content first!`);
        } else if (error.message?.includes('No Daily Work Summary Agent')) {
          toast.error('Daily Work Summary Agent not found. Please contact support.');
        } else {
          toast.error(`Failed to generate summary: ${error.message}`);
        }
        return;
      }
      
      if (data?.success === false) {
        toast.error(data.error || 'Failed to generate summary');
        return;
      }
      
      toast.success(`Daily work summary for ${format(selectedDate, 'MMM d, yyyy')} generated successfully!`);
      // Refetch the summaries to show the new one
      refetch();
    } catch (error) {
      console.error('Error calling generate-daily-work-summary:', error);
      toast.error('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Summaries are already filtered by the hook, no need for client-side filtering
  const filteredSummaries = summaries || [];

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Daily Work Summary</h1>
              <p className="text-muted-foreground">
                Track and review your daily work insights and productivity
              </p>
            </div>
          </div>
          <WorkReportSkeleton />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Error Loading Reports</h2>
                <p className="text-muted-foreground">
                  Failed to load work reports. Please try again later.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Daily Work Reports - Jordan Leahy</title>
        <meta 
          name="description" 
          content="Track your daily productivity, achievements, and insights with AI-powered work summaries. Monitor your progress and optimize your workflow." 
        />
        <link rel="canonical" href="https://jordanleahy.com/work-report" />
      </Helmet>
      
      <PageLayout>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Daily Work Summary</h1>
              <p className="text-muted-foreground">
                Track and review your daily work insights and productivity
              </p>
            </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Filter
              {showFilters ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
            </Button>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMM d, yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button 
                size="sm" 
                onClick={handleGenerateSummary}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {isGenerating ? 'Generating...' : 
                 selectedDateSummary ? `Regenerate Summary` : 'Generate Summary'}
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Button
                  variant={dateFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('all')}
                >
                  All Time
                </Button>
                <Button
                  variant={dateFilter === '7days' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('7days')}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant={dateFilter === '30days' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('30days')}
                >
                  Last 30 Days
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!filteredSummaries || filteredSummaries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">No Work Reports Found</h2>
                <p className="text-muted-foreground mb-6">
                  {dateFilter !== 'all' 
                    ? `No reports found for the selected time period. Try expanding your date range.`
                    : 'Start tracking your daily work by generating your first summary.'
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "MMM d, yyyy") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button 
                    onClick={handleGenerateSummary}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    {isGenerating ? 'Generating...' : 
                     selectedDateSummary ? 'Regenerate Summary' : 'Generate Summary'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredSummaries.map((summary) => (
              <WorkReportCard key={summary.id} summary={summary} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
    </>
  );
};

export default WorkReportPage;