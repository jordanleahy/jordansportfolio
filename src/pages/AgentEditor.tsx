import { useParams, useNavigate } from 'react-router-dom';
import { useAgent } from '@/hooks/useAgents';
import { AgentWizard } from '@/components/agents/AgentWizard';

export default function AgentEditor() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: agent, isLoading } = useAgent(slug === 'new' ? '' : slug!);

  const handleCancel = () => {
    if (slug === 'new') {
      navigate('/agents');
    } else {
      navigate(`/agents/${slug}`);
    }
  };

  if (isLoading && slug !== 'new') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agent...</p>
        </div>
      </div>
    );
  }

  if (slug !== 'new' && !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Agent not found</h2>
          <p className="text-muted-foreground mb-4">The agent you're trying to edit doesn't exist.</p>
          <button 
            onClick={() => navigate('/agents')}
            className="text-primary hover:underline"
          >
            Back to agents
          </button>
        </div>
      </div>
    );
  }

  return (
    <AgentWizard
      agent={slug === 'new' ? undefined : agent}
      onCancel={handleCancel}
    />
  );
}