import { useState } from 'react';
import { useOpenAIAgents } from '@/hooks/useOpenAIAgents';
import { AgentStatusBadge } from './AgentStatusBadge';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Play, Pause, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AgentStatus, OpenAIAgent } from '@/types/openaiAgent';
import { useUpdateAgent, useDeleteAgent } from '@/hooks/useOpenAIAgents';

export const AgentsTable = () => {
  const { data: agents, isLoading } = useOpenAIAgents();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all');

  const filteredAgents = agents?.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (agent: OpenAIAgent) => {
    const newStatus: AgentStatus = agent.status === 'active' ? 'paused' : 'active';
    updateAgent.mutate({ id: agent.id, status: newStatus });
  };

  const handleDelete = (agentId: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      deleteAgent.mutate(agentId);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading agents...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>My OpenAI Agents</CardTitle>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AgentStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="deprecated">Deprecated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents?.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {agent.purpose}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AgentStatusBadge status={agent.status} />
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {agent.model_version}
                    </code>
                  </TableCell>
                  <TableCell>{agent.owner}</TableCell>
                  <TableCell>
                    {agent.last_run ? (
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(agent.last_run), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {agent.metrics && (
                      <div className="text-xs space-y-1">
                        <div>Latency: {agent.metrics.latencyMs}ms</div>
                        <div>Error Rate: {(agent.metrics.errorRate * 100).toFixed(1)}%</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {agent.tags?.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {agent.tags && agent.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(agent)}
                        disabled={agent.status === 'deprecated'}
                      >
                        {agent.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(agent.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredAgents?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'No agents match your filters.' 
                : 'No agents created yet. Create your first agent to get started.'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};