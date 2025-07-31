import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, GitBranch, AlertTriangle } from 'lucide-react';
import { useOpenAIAgents } from '@/hooks/useOpenAIAgents';
import { useAgentRelationships, useCreateAgentRelationship, useDeleteAgentRelationship } from '@/hooks/useAgentRelationships';
import { OpenAIAgent } from '@/types/openaiAgent';
import { CreateAgentRelationshipData } from '@/types/agentRelationship';

interface AgentRelationshipModalProps {
  agent: OpenAIAgent;
  children: React.ReactNode;
}

export const AgentRelationshipModal = ({ agent, children }: AgentRelationshipModalProps) => {
  const [open, setOpen] = useState(false);
  const [newRelationship, setNewRelationship] = useState<Partial<CreateAgentRelationshipData>>({
    relationship_type: 'dependency',
    is_required: true,
  });

  const { data: allAgents } = useOpenAIAgents();
  const { data: relationships } = useAgentRelationships();
  const createRelationship = useCreateAgentRelationship();
  const deleteRelationship = useDeleteAgentRelationship();

  // Filter out current agent and already connected agents
  const availableAgents = allAgents?.filter(a => {
    if (a.id === agent.id) return false;
    
    const existingRelationship = relationships?.find(rel => 
      (rel.source_agent_id === agent.id && rel.target_agent_id === a.id) ||
      (rel.source_agent_id === a.id && rel.target_agent_id === agent.id)
    );
    
    return !existingRelationship;
  }) || [];

  // Get current agent's relationships
  const agentRelationships = relationships?.filter(rel => 
    rel.source_agent_id === agent.id || rel.target_agent_id === agent.id
  ) || [];

  const handleCreateRelationship = async () => {
    if (!newRelationship.target_agent_id) return;

    try {
      await createRelationship.mutateAsync({
        source_agent_id: agent.id,
        target_agent_id: newRelationship.target_agent_id,
        relationship_type: newRelationship.relationship_type || 'dependency',
        description: newRelationship.description,
        is_required: newRelationship.is_required ?? true,
      });

      setNewRelationship({
        relationship_type: 'dependency',
        is_required: true,
      });
    } catch (error) {
      console.error('Failed to create relationship:', error);
    }
  };

  const handleDeleteRelationship = async (relationshipId: string) => {
    try {
      await deleteRelationship.mutateAsync(relationshipId);
    } catch (error) {
      console.error('Failed to delete relationship:', error);
    }
  };

  const getRelationshipDirection = (rel: any) => {
    if (rel.source_agent_id === agent.id) {
      return { type: 'depends_on', agent: rel.target_agent };
    } else {
      return { type: 'depended_by', agent: rel.source_agent };
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Manage Dependencies for {agent.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Relationships */}
          <div>
            <h3 className="text-sm font-medium mb-3">Current Relationships</h3>
            {agentRelationships.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    No relationships configured
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {agentRelationships.map(rel => {
                  const relationship = rel as any;
                  const direction = getRelationshipDirection(relationship);
                  
                  return (
                    <Card key={relationship.id} className="relative">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {direction.type === 'depends_on' ? 'Depends on' : 'Dependency of'}
                              </span>
                              <Badge variant={direction.type === 'depends_on' ? 'destructive' : 'secondary'}>
                                {relationship.relationship_type}
                              </Badge>
                              {relationship.is_required && (
                                <Badge variant="outline" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {direction.agent.name}
                            </div>
                            {relationship.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {relationship.description}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRelationship(relationship.id)}
                            disabled={deleteRelationship.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Relationship */}
          <div>
            <h3 className="text-sm font-medium mb-3">Add New Dependency</h3>
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target-agent">Depends On Agent</Label>
                    <Select
                      value={newRelationship.target_agent_id}
                      onValueChange={(value) => 
                        setNewRelationship(prev => ({ ...prev, target_agent_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAgents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="relationship-type">Relationship Type</Label>
                    <Select
                      value={newRelationship.relationship_type}
                      onValueChange={(value) => 
                        setNewRelationship(prev => ({ ...prev, relationship_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dependency">Dependency</SelectItem>
                        <SelectItem value="prerequisite">Prerequisite</SelectItem>
                        <SelectItem value="sequence">Sequence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe why this dependency is needed..."
                    value={newRelationship.description || ''}
                    onChange={(e) => 
                      setNewRelationship(prev => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={newRelationship.is_required}
                      onCheckedChange={(checked) => 
                        setNewRelationship(prev => ({ ...prev, is_required: checked }))
                      }
                    />
                    <Label htmlFor="required">Required Dependency</Label>
                  </div>

                  <Button
                    onClick={handleCreateRelationship}
                    disabled={!newRelationship.target_agent_id || createRelationship.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Dependency
                  </Button>
                </div>

                {!newRelationship.is_required && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      Optional dependencies won't block agent execution but may affect output quality.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {availableAgents.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No more agents available to create relationships with.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};