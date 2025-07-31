import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgentsWithRelationships } from '@/hooks/useAgentRelationships';
import { Zap, ZapOff, AlertTriangle, Play } from 'lucide-react';

const AgentNode = ({ data }: { data: any }) => {
  const { agent } = data;
  
  const getStatusColor = () => {
    switch (agent.status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'deprecated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDependencyStatusIcon = () => {
    switch (agent.dependency_status) {
      case 'ready': return <Zap className="w-4 h-4 text-green-600" />;
      case 'blocked': return <ZapOff className="w-4 h-4 text-red-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <Card className="w-64 border-2 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          {getDependencyStatusIcon()}
        </div>
        <CardTitle className="text-sm font-medium truncate">{agent.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {agent.purpose}
        </p>
        <div className="flex flex-wrap gap-1 mb-2">
          {agent.tags?.slice(0, 2).map((tag: string, idx: number) => (
            <Badge key={idx} variant="secondary" className="text-xs px-1 py-0">
              {tag}
            </Badge>
          ))}
        </div>
        {agent.dependencies?.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Depends on: {agent.dependencies.length} agent{agent.dependencies.length !== 1 ? 's' : ''}
          </div>
        )}
        {agent.blocked_by?.length > 0 && (
          <div className="text-xs text-red-600 font-medium">
            Blocked by: {agent.blocked_by.join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const nodeTypes = {
  agentNode: AgentNode,
};

export const AgentDependencyGraph = () => {
  const { data: agentsWithRelationships, isLoading } = useAgentsWithRelationships();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Convert agents to nodes and dependencies to edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!agentsWithRelationships) return { nodes: [], edges: [] };

    const nodes: Node[] = agentsWithRelationships.map((agent, index) => ({
      id: agent.id,
      type: 'agentNode',
      position: { x: (index % 4) * 300, y: Math.floor(index / 4) * 200 },
      data: { agent },
      selected: selectedAgent === agent.id,
    }));

    const edges: Edge[] = [];
    agentsWithRelationships.forEach(agent => {
      agent.dependencies?.forEach(dep => {
        edges.push({
          id: `${agent.id}-${dep.agent_id}`,
          source: dep.agent_id,
          target: agent.id,
          type: 'smoothstep',
          animated: dep.is_required,
          style: { 
            stroke: dep.is_required ? '#ef4444' : '#64748b',
            strokeWidth: dep.is_required ? 2 : 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: dep.is_required ? '#ef4444' : '#64748b',
          },
          label: dep.relationship_type,
          labelStyle: { fontSize: 10, fontWeight: 'bold' },
        });
      });
    });

    return { nodes, edges };
  }, [agentsWithRelationships, selectedAgent]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedAgent(node.id);
  }, []);

  const getReadyAgents = () => {
    return agentsWithRelationships?.filter(agent => 
      agent.dependency_status === 'ready' && agent.status === 'active'
    ) || [];
  };

  const getBlockedAgents = () => {
    return agentsWithRelationships?.filter(agent => 
      agent.dependency_status === 'blocked'
    ) || [];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Dependency Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading dependency graph...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Play className="w-4 h-4 text-green-600" />
              Ready to Execute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getReadyAgents().length}
            </div>
            <p className="text-xs text-muted-foreground">
              Agents with all dependencies met
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ZapOff className="w-4 h-4 text-red-600" />
              Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {getBlockedAgents().length}
            </div>
            <p className="text-xs text-muted-foreground">
              Agents waiting for dependencies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {agentsWithRelationships?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All agents in the system
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dependency Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Dependency Graph</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500"></div>
              <span>Required Dependencies</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-500"></div>
              <span>Optional Dependencies</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96 border rounded-lg bg-background">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Loose}
              fitView
              attributionPosition="top-right"
            >
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};