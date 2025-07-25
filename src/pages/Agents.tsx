import { EnhancedAgentsTable } from '@/components/agents/EnhancedAgentsTable';
import { PageLayout } from '@/components/layout/PageLayout';

const Agents = () => {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">OpenAI Agents</h1>
          <p className="text-muted-foreground">Manage your AI agents and automation</p>
        </div>
        <EnhancedAgentsTable />
      </div>
    </PageLayout>
  );
};

export default Agents;