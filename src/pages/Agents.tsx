import { EnhancedAgentsTable } from '@/components/agents/EnhancedAgentsTable';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Agents = () => {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  const handleCreateEngineeringAgent = async () => {
    try {
      setCreating(true);
      const { data, error } = await supabase.rpc('insert_engineering_work_report_agent');
      if (error) throw error;
      const message = typeof data === 'string' ? data : 'Engineering Work Report Agent created';
      toast.success(message);
      await queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
    } catch (err: any) {
      toast.error(`Failed to create agent: ${err?.message || err}`);
    } finally {
      setCreating(false);
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
          <Button onClick={handleCreateEngineeringAgent} disabled={creating}>
            {creating ? 'Creating…' : 'Create Engineering Work Report Agent'}
          </Button>
        </div>
        <EnhancedAgentsTable />
      </div>
    </PageLayout>
  );
};

export default Agents;