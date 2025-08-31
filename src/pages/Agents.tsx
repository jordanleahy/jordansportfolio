import { EnhancedAgentsTable } from '@/components/agents/EnhancedAgentsTable';
import { PageLayout } from '@/components/layout/PageLayout';

const Agents = () => {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 pt-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Agents</h1>
            <p className="text-muted-foreground">Manage and create specialized AI agents.</p>
          </div>
        </div>
        <EnhancedAgentsTable />
      </div>
    </PageLayout>
  );
};

export default Agents;