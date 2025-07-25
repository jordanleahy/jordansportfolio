import { EnhancedAgentsTable } from '@/components/agents/EnhancedAgentsTable';
import { PageLayout } from '@/components/layout/PageLayout';
const Agents = () => {
  return <PageLayout>
      <div className="container mx-auto px-4 pt-6 space-y-6">
        
        <EnhancedAgentsTable />
      </div>
    </PageLayout>;
};
export default Agents;