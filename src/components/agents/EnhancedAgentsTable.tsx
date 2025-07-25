import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpenAIAgents, useUpdateAgent, useDeleteAgent, useCreateAgent } from '@/hooks/useOpenAIAgents';
import { AgentStatusBadge } from './AgentStatusBadge';
import { AgentDeleteModal } from './AgentDeleteModal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Play, 
  Pause, 
  Trash2, 
  Activity, 
  Zap, 
  MoreHorizontal, 
  Copy, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AgentStatus, OpenAIAgent, CreateAgentData } from '@/types/openaiAgent';
import { CreateAgentModal } from './CreateAgentModal';

type SortField = 'name' | 'status' | 'model_version' | 'owner' | 'updated_at';
type SortDirection = 'asc' | 'desc';

export const EnhancedAgentsTable = () => {
  const navigate = useNavigate();
  const { data: agents, isLoading } = useOpenAIAgents();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const createAgent = useCreateAgent();

  // State for search, filters, pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all');
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalAgent, setDeleteModalAgent] = useState<OpenAIAgent | null>(null);

  // Featured agents
  const featuredAgents = [
    {
      name: 'SIRS Diagnostic Agent',
      description: 'Rules-based clinical agent for Systemic Inflammatory Response Syndrome diagnosis',
      icon: Activity,
      path: '/agents/sirs-diagnostic',
      status: 'Clinical Ready',
      tags: ['Clinical', 'Diagnostic', 'SIRS']
    },
    {
      name: 'Sepsis Agent',
      description: 'AI-powered sepsis detection and management system',
      icon: Zap,
      path: '/agents/sepsis',
      status: 'Available',
      tags: ['Clinical', 'Sepsis', 'Management']
    }
  ];

  // Filter and sort agents
  const filteredAndSortedAgents = useMemo(() => {
    if (!agents) return [];

    let filtered = agents.filter((agent) => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.owner.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [agents, searchTerm, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAgents.length / pageSize);
  const paginatedAgents = filteredAndSortedAgents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleSelectAgent = (agentId: string, checked: boolean) => {
    const newSelected = new Set(selectedAgents);
    if (checked) {
      newSelected.add(agentId);
    } else {
      newSelected.delete(agentId);
    }
    setSelectedAgents(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAgents(new Set(paginatedAgents.map(agent => agent.id)));
    } else {
      setSelectedAgents(new Set());
    }
  };

  const handleBulkStatusUpdate = (status: AgentStatus) => {
    selectedAgents.forEach(agentId => {
      updateAgent.mutate({ id: agentId, status });
    });
    setSelectedAgents(new Set());
  };

  const handleToggleStatus = (agent: OpenAIAgent) => {
    const newStatus: AgentStatus = agent.status === 'active' ? 'paused' : 'active';
    updateAgent.mutate({ id: agent.id, status: newStatus });
  };

  const handleCloneAgent = (agent: OpenAIAgent) => {
    const cloneData: CreateAgentData = {
      name: `${agent.name} (Copy)`,
      purpose: agent.purpose,
      model_version: agent.model_version,
      trigger: agent.trigger,
      input_source: agent.input_source,
      output_target: agent.output_target,
      schedule: agent.schedule,
      owner: agent.owner,
      status: 'paused',
      tags: agent.tags || [],
      notes: agent.notes || ''
    };
    createAgent.mutate(cloneData);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading agents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Featured Agents Section */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Clinical Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredAgents.map((agent) => (
              <div 
                key={agent.name}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(agent.path)}
              >
                <div className="flex items-start gap-3">
                  <agent.icon className="h-8 w-8 text-primary mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{agent.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{agent.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {agent.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {agent.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>My OpenAI Agents</CardTitle>
            <CreateAgentModal />
          </div>
          
          {/* Filters and Search */}
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

          {/* Bulk Actions */}
          {selectedAgents.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedAgents.size} agent(s) selected
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkStatusUpdate('active')}
              >
                Activate All
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkStatusUpdate('paused')}
              >
                Pause All
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setSelectedAgents(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={paginatedAgents.length > 0 && selectedAgents.size === paginatedAgents.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('name')}
                      className="gap-1 p-0 h-auto font-medium"
                    >
                      Name {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('status')}
                      className="gap-1 p-0 h-auto font-medium"
                    >
                      Status {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('model_version')}
                      className="gap-1 p-0 h-auto font-medium"
                    >
                      Model {getSortIcon('model_version')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('owner')}
                      className="gap-1 p-0 h-auto font-medium"
                    >
                      Owner {getSortIcon('owner')}
                    </Button>
                  </TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('updated_at')}
                      className="gap-1 p-0 h-auto font-medium"
                    >
                      Last Modified {getSortIcon('updated_at')}
                    </Button>
                  </TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAgents?.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAgents.has(agent.id)}
                        onCheckedChange={(checked) => handleSelectAgent(agent.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div 
                        className="cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/agents/${agent.id}`)}
                      >
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
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(agent.updated_at), { addSuffix: true })}
                      </span>
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
                      <div className="flex justify-end gap-1">
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleCloneAgent(agent)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Clone Agent
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteModalAgent(agent)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredAndSortedAgents.length)} of {filteredAndSortedAgents.length} results
                </span>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {filteredAndSortedAgents?.length === 0 && (
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

      {/* Delete Confirmation Modal */}
      {deleteModalAgent && (
        <AgentDeleteModal
          agent={deleteModalAgent}
          open={!!deleteModalAgent}
          onOpenChange={(open) => !open && setDeleteModalAgent(null)}
          onConfirm={() => {
            deleteAgent.mutate(deleteModalAgent.id);
            setDeleteModalAgent(null);
          }}
        />
      )}
    </div>
  );
};