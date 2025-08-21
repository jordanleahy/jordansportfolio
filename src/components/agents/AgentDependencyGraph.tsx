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
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgentsWithRelationships } from '@/hooks/useAgentRelationships';
import { Zap, ZapOff, AlertTriangle, Play, RotateCcw, Grid, GitBranch } from 'lucide-react';
import dagre from 'dagre';

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
    <div className="relative">
      {/* Input handles on the left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ 
          background: 'hsl(var(--primary))', 
          width: 8, 
          height: 8,
          border: '2px solid hsl(var(--background))'
        }}
      />
      
      {/* Output handles on the right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ 
          background: 'hsl(var(--primary))', 
          width: 8, 
          height: 8,
          border: '2px solid hsl(var(--background))'
        }}
      />

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
    </div>
  );
};

const nodeTypes = {
  agentNode: AgentNode,
};

type LayoutType = 'hierarchical' | 'grid' | 'force';

const getLayoutedElements = (nodes: Node[], edges: Edge[], layoutType: LayoutType) => {
  switch (layoutType) {
    case 'hierarchical':
      return getHierarchicalLayout(nodes, edges);
    case 'force':
      return getForceLayout(nodes, edges);
    case 'grid':
    default:
      return getGridLayout(nodes);
  }
};

const getHierarchicalLayout = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: 'TB',
    nodesep: 100,
    ranksep: 150,
    marginx: 50,
    marginy: 50
  });

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: 280, height: 180 });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 140,
        y: nodeWithPosition.y - 90,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const getForceLayout = (nodes: Node[], edges: Edge[]) => {
  // Simple force-directed layout simulation
  const layoutedNodes = nodes.map((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    const radius = Math.max(200, nodes.length * 50);
    return {
      ...node,
      position: {
        x: Math.cos(angle) * radius + 400,
        y: Math.sin(angle) * radius + 300,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const getGridLayout = (nodes: Node[]) => {
  const layoutedNodes = nodes.map((node, index) => ({
    ...node,
    position: { 
      x: (index % 3) * 350, 
      y: Math.floor(index / 3) * 250 
    },
  }));

  return { nodes: layoutedNodes, edges: [] };
};

export const AgentDependencyGraph = () => {
  const { data: agentsWithRelationships, isLoading } = useAgentsWithRelationships();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('hierarchical');

  // Convert agents to nodes and dependencies to edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!agentsWithRelationships) return { nodes: [], edges: [] };

    const nodes: Node[] = agentsWithRelationships.map((agent) => ({
      id: agent.id,
      type: 'agentNode',
      position: { x: 0, y: 0 }, // Will be updated by layout algorithm
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
            strokeWidth: dep.is_required ? 3 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: dep.is_required ? '#ef4444' : '#64748b',
          },
          label: dep.is_required ? 'Required' : 'Optional',
          labelStyle: { 
            fontSize: 11, 
            fontWeight: 'bold',
            fill: dep.is_required ? '#ef4444' : '#64748b'
          },
        });
      });
    });

    console.log('Generated edges:', edges.length);
    console.log('Generated nodes:', nodes.length);

    return getLayoutedElements(nodes, edges, layoutType);
  }, [agentsWithRelationships, selectedAgent, layoutType]);

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
          <div className="flex items-center justify-between">
            <CardTitle>Dependency Graph</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLayoutType('hierarchical')}
                className={layoutType === 'hierarchical' ? 'bg-primary text-primary-foreground' : ''}
              >
                <GitBranch className="w-4 h-4 mr-1" />
                Hierarchical
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLayoutType('force')}
                className={layoutType === 'force' ? 'bg-primary text-primary-foreground' : ''}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Force
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLayoutType('grid')}
                className={layoutType === 'grid' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Grid className="w-4 h-4 mr-1" />
                Grid
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500"></div>
              <span>Required Dependencies</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-500"></div>
              <span>Optional Dependencies</span>
            </div>
            <div className="text-xs">
              Edges: {initialEdges.length} | Nodes: {initialNodes.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] border rounded-lg bg-background">
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
              fitViewOptions={{
                padding: 0.1,
                minZoom: 0.1,
                maxZoom: 1.5,
              }}
              attributionPosition="top-right"
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            >
              <Controls />
              <Background 
                gap={20}
                size={1}
                color="hsl(var(--muted))"
              />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};