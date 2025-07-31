import { useState, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpenAIAgents, useUpdateAgent, useDeleteAgent, useCreateAgent } from '@/hooks/useOpenAIAgents';
import { useFilteredAndSortedAgents, useAgentPagination, SortField, SortDirection } from '@/hooks/useAgentTableLogic';
import { useAgentsWithRelationships } from '@/hooks/useAgentRelationships';
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
  MoreHorizontal, 
  Copy, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Plus,
  GitBranch,
  Zap,
  ZapOff,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AgentStatus, OpenAIAgent, CreateAgentData } from '@/types/openaiAgent';
import { CreateAgentModal } from './CreateAgentModal';
import { AgentRelationshipModal } from './AgentRelationshipModal';
import { AgentDependencyGraph } from './AgentDependencyGraph';



interface TableState {
  searchTerm: string;
  statusFilter: AgentStatus | 'all';
  selectedAgents: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  pageSize: number;
  currentPage: number;
  deleteModalAgent: OpenAIAgent | null;
  showDependencyGraph: boolean;
}

type TableAction = 
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: AgentStatus | 'all' }
  | { type: 'SET_SELECTED_AGENTS'; payload: Set<string> }
  | { type: 'TOGGLE_AGENT_SELECTION'; payload: { agentId: string; checked: boolean } }
  | { type: 'SELECT_ALL'; payload: { agentIds: string[]; checked: boolean } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_SORT'; payload: { field: SortField; direction?: SortDirection } }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_DELETE_MODAL_AGENT'; payload: OpenAIAgent | null }
  | { type: 'TOGGLE_DEPENDENCY_GRAPH' }
  | { type: 'RESET_PAGE' };

const initialState: TableState = {
  searchTerm: '',
  statusFilter: 'all',
  selectedAgents: new Set(),
  sortField: 'updated_at',
  sortDirection: 'desc',
  pageSize: 10,
  currentPage: 1,
  deleteModalAgent: null,
  showDependencyGraph: false,
};

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload, currentPage: 1 };
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload, currentPage: 1 };
    case 'SET_SELECTED_AGENTS':
      return { ...state, selectedAgents: action.payload };
    case 'TOGGLE_AGENT_SELECTION': {
      const newSelected = new Set(state.selectedAgents);
      if (action.payload.checked) {
        newSelected.add(action.payload.agentId);
      } else {
        newSelected.delete(action.payload.agentId);
      }
      return { ...state, selectedAgents: newSelected };
    }
    case 'SELECT_ALL':
      return { 
        ...state, 
        selectedAgents: action.payload.checked ? new Set(action.payload.agentIds) : new Set() 
      };
    case 'CLEAR_SELECTION':
      return { ...state, selectedAgents: new Set() };
    case 'SET_SORT': {
      const newDirection = action.payload.direction || 
        (state.sortField === action.payload.field ? 
          (state.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc');
      return {
        ...state,
        sortField: action.payload.field,
        sortDirection: newDirection,
        currentPage: 1
      };
    }
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload, currentPage: 1 };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_DELETE_MODAL_AGENT':
      return { ...state, deleteModalAgent: action.payload };
    case 'TOGGLE_DEPENDENCY_GRAPH':
      return { ...state, showDependencyGraph: !state.showDependencyGraph };
    case 'RESET_PAGE':
      return { ...state, currentPage: 1 };
    default:
      return state;
  }
}

export const EnhancedAgentsTable = () => {
  const navigate = useNavigate();
  const { data: agents, isLoading } = useOpenAIAgents();
  const { data: agentsWithRelationships } = useAgentsWithRelationships();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const createAgent = useCreateAgent();

  const [state, dispatch] = useReducer(tableReducer, initialState);

  // Get dependency status summary
  const dependencySummary = useMemo(() => {
    if (!agentsWithRelationships) return { ready: 0, blocked: 0, total: 0 };
    
    const ready = agentsWithRelationships.filter(a => a.dependency_status === 'ready').length;
    const blocked = agentsWithRelationships.filter(a => a.dependency_status === 'blocked').length;
    
    return { ready, blocked, total: agentsWithRelationships.length };
  }, [agentsWithRelationships]);

  // Use custom hooks for filtering, sorting, and pagination
  const filteredAndSortedAgents = useFilteredAndSortedAgents({
    agents,
    searchTerm: state.searchTerm,
    statusFilter: state.statusFilter,
    sortField: state.sortField,
    sortDirection: state.sortDirection,
  });

  const { 
    paginatedAgents, 
    totalPages, 
    totalCount,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage 
  } = useAgentPagination(filteredAndSortedAgents, state.pageSize, state.currentPage);

  const handleSort = (field: SortField) => {
    dispatch({ type: 'SET_SORT', payload: { field } });
  };

  const getSortIcon = (field: SortField) => {
    if (state.sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return state.sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleSelectAgent = (agentId: string, checked: boolean) => {
    dispatch({ type: 'TOGGLE_AGENT_SELECTION', payload: { agentId, checked } });
  };

  const handleSelectAll = (checked: boolean) => {
    dispatch({ type: 'SELECT_ALL', payload: { agentIds: paginatedAgents.map(agent => agent.id), checked } });
  };

  const handleBulkStatusUpdate = (status: AgentStatus) => {
    state.selectedAgents.forEach(agentId => {
      updateAgent.mutate({ id: agentId, status });
    });
    dispatch({ type: 'CLEAR_SELECTION' });
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

  const getDependencyStatusIcon = (agent: OpenAIAgent) => {
    const agentWithRel = agentsWithRelationships?.find(a => a.id === agent.id);
    if (!agentWithRel) return null;

    switch (agentWithRel.dependency_status) {
      case 'ready': return <div title="Ready to execute"><Zap className="w-4 h-4 text-green-600" /></div>;
      case 'blocked': return <div title="Blocked by dependencies"><ZapOff className="w-4 h-4 text-red-600" /></div>;
      default: return <div title="Unknown dependency status"><AlertTriangle className="w-4 h-4 text-yellow-600" /></div>;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading agents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Dependency Summary */}
      {agentsWithRelationships && agentsWithRelationships.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ready to Execute</p>
                  <p className="text-2xl font-bold text-green-600">{dependencySummary.ready}</p>
                </div>
                <Zap className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Blocked</p>
                  <p className="text-2xl font-bold text-red-600">{dependencySummary.blocked}</p>
                </div>
                <ZapOff className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
                  <p className="text-2xl font-bold">{dependencySummary.total}</p>
                </div>
                <GitBranch className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Button 
                variant="outline" 
                className="w-full h-full flex flex-col gap-2"
                onClick={() => dispatch({ type: 'TOGGLE_DEPENDENCY_GRAPH' })}
              >
                <GitBranch className="h-6 w-6" />
                {state.showDependencyGraph ? 'Hide' : 'Show'} Dependency Graph
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dependency Graph */}
      {state.showDependencyGraph && <AgentDependencyGraph />}
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
                value={state.searchTerm}
                onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select 
              value={state.statusFilter} 
              onValueChange={(value) => dispatch({ type: 'SET_STATUS_FILTER', payload: value as AgentStatus | 'all' })}
            >
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
          {state.selectedAgents.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {state.selectedAgents.size} agent(s) selected
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
                onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
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
                      checked={paginatedAgents.length > 0 && state.selectedAgents.size === paginatedAgents.length}
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
                    <TableHead>Dependencies</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAgents?.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <Checkbox
                        checked={state.selectedAgents.has(agent.id)}
                        onCheckedChange={(checked) => handleSelectAgent(agent.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div 
                        className="cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/agents/${agent.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{agent.name}</div>
                          {getDependencyStatusIcon(agent)}
                        </div>
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
                      {(() => {
                        const agentWithRel = agentsWithRelationships?.find(a => a.id === agent.id);
                        if (!agentWithRel || (!agentWithRel.dependencies?.length && !agentWithRel.dependents?.length)) {
                          return <span className="text-xs text-muted-foreground">None</span>;
                        }
                        
                        return (
                          <div className="text-xs space-y-1">
                            {agentWithRel.dependencies?.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-red-600">↑{agentWithRel.dependencies.length}</span>
                                <span className="text-muted-foreground">deps</span>
                              </div>
                            )}
                            {agentWithRel.dependents?.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-blue-600">↓{agentWithRel.dependents.length}</span>
                                <span className="text-muted-foreground">uses</span>
                              </div>
                            )}
                            {agentWithRel.blocked_by?.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                Blocked
                              </Badge>
                            )}
                          </div>
                        );
                      })()}
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
                            <AgentRelationshipModal agent={agent}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <GitBranch className="h-4 w-4 mr-2" />
                                Manage Dependencies
                              </DropdownMenuItem>
                            </AgentRelationshipModal>
                            <DropdownMenuItem 
                              onClick={() => dispatch({ type: 'SET_DELETE_MODAL_AGENT', payload: agent })}
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
                  Showing {startIndex} to {endIndex} of {totalCount} results
                </span>
                <Select 
                  value={state.pageSize.toString()} 
                  onValueChange={(value) => dispatch({ type: 'SET_PAGE_SIZE', payload: Number(value) })}
                >
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
                  disabled={!hasPreviousPage}
                  onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: state.currentPage - 1 })}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {state.currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={!hasNextPage}
                  onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: state.currentPage + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {totalCount === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {state.searchTerm || state.statusFilter !== 'all' 
                  ? 'No agents match your filters.' 
                  : 'No agents created yet. Create your first agent to get started.'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {state.deleteModalAgent && (
        <AgentDeleteModal
          agent={state.deleteModalAgent}
          open={!!state.deleteModalAgent}
          onOpenChange={(open) => !open && dispatch({ type: 'SET_DELETE_MODAL_AGENT', payload: null })}
          onConfirm={() => {
            deleteAgent.mutate(state.deleteModalAgent!.id);
            dispatch({ type: 'SET_DELETE_MODAL_AGENT', payload: null });
          }}
        />
      )}
    </div>
  );
};