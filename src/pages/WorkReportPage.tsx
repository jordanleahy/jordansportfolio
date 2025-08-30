import React, { useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { PageLayout } from '@/components/layout/PageLayout';
import { useDailyWorkSummaries, useDailyWorkSummary } from '@/hooks/useDailyWorkSummaries';
import { WorkReportCard } from '@/components/work-report/WorkReportCard';
import { WorkReportSkeleton } from '@/components/performance/WorkReportSkeleton';
import { WorkReportHeader } from '@/components/work-report/WorkReportHeader';
import { WorkReportFilters } from '@/components/work-report/WorkReportFilters';
import { WorkReportEmptyState } from '@/components/work-report/WorkReportEmptyState';
import { subDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import ConfirmRegenerateDialog from '@/components/work-report/ConfirmRegenerateDialog';

const WorkReportPage: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('30days');
  const [showFilters, setShowFilters] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showConfirm, setShowConfirm] = useState(false);

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

  const performGenerate = useCallback(async (regenerate: boolean) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-work-summary', {
        body: { date: selectedDateString, regenerate }
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

      toast.success(`Daily work summary for ${format(selectedDate, 'MMM d, yyyy')} ${regenerate ? 'regenerated' : 'generated'} successfully!`);
      // Refetch the summaries to show the updated one
      refetch();
    } catch (error) {
      console.error('Error calling generate-daily-work-summary:', error);
      toast.error('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
      setShowConfirm(false);
    }
  }, [selectedDate, selectedDateString, refetch]);

  const handleGenerateSummary = () => {
    if (selectedDateSummary) {
      setShowConfirm(true);
      return;
    }
    void performGenerate(false);
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
        <div className="container mx-auto py-4 px-4 lg:py-8">
          <WorkReportHeader
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onGenerateSummary={handleGenerateSummary}
            isGenerating={isGenerating}
            selectedDateSummary={selectedDateSummary}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
          />

          {showFilters && (
            <WorkReportFilters
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
            />
          )}

          {!filteredSummaries || filteredSummaries.length === 0 ? (
            <WorkReportEmptyState
              dateFilter={dateFilter}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onGenerateSummary={handleGenerateSummary}
              isGenerating={isGenerating}
              selectedDateSummary={selectedDateSummary}
            />
          ) : (
            <div className="grid gap-4 lg:gap-6">
              {filteredSummaries.map((summary) => (
                <WorkReportCard key={summary.id} summary={summary} isLoading={isGenerating && summary.summary_date === selectedDateString} />
              ))}
            </div>
          )}
        </div>
      </PageLayout>
      
      <ConfirmRegenerateDialog
        open={showConfirm}
        onConfirm={() => performGenerate(true)}
        onCancel={() => setShowConfirm(false)}
        dateLabel={format(selectedDate, 'MMM d, yyyy')}
        isGenerating={isGenerating}
      />
    </>
  );
};

export default WorkReportPage;