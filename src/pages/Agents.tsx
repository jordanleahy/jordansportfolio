import { EnhancedAgentsTable } from '@/components/agents/EnhancedAgentsTable';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Agents = () => {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const handleCreateDailySummaryAgent = async () => {
    try {
      setCreating(true);
      const { data, error } = await supabase.rpc('insert_daily_work_summary_agent');
      if (error) throw error;
      const message = typeof data === 'string' ? data : 'Daily Work Summary Agent created';
      toast.success(message);
      await queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
    } catch (err: any) {
      toast.error(`Failed to create agent: ${err?.message || err}`);
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateTodayReport = async () => {
    try {
      setGenerating(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase.functions.invoke('generate-daily-work-summary', {
        body: { date: today },
      });
      if (error || data?.success === false) {
        const msg = error?.message || data?.error || 'Failed to generate today’s report';
        throw new Error(msg);
      }
      toast.success(`Generated today’s work report`);
    } catch (err: any) {
      toast.error(`Failed to generate: ${err?.message || err}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 pt-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Agents</h1>
            <p className="text-muted-foreground">Manage and create specialized AI agents.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateDailySummaryAgent} disabled={creating}>
              {creating ? 'Creating…' : 'Create Daily Work Summary Agent'}
            </Button>
            <Button variant="outline" onClick={handleGenerateTodayReport} disabled={generating}>
              {generating ? 'Generating…' : 'Generate Today’s Work Report'}
            </Button>
          </div>
        </div>
        <EnhancedAgentsTable />
      </div>
    </PageLayout>
  );
};

export default Agents;