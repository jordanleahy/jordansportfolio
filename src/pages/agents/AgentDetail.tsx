import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Pause, Trash2, Edit, Calendar, Clock, Target, Settings, Tag, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useOpenAIAgent, useUpdateAgent, useDeleteAgent } from '@/hooks/useOpenAIAgents';
import { AgentStatusBadge } from '@/components/agents/AgentStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { AgentStatus } from '@/types/openaiAgent';

export const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: agent, isLoading } = useOpenAIAgent(id!);
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const handleToggleStatus = () => {
    if (!agent) return;
    const newStatus: AgentStatus = agent.status === 'active' ? 'paused' : 'active';
    updateAgent.mutate({ id: agent.id, status: newStatus });
  };

  const handleDelete = () => {
    if (!agent) return;
    if (confirm(`Are you sure you want to delete "${agent.name}"?`)) {
      deleteAgent.mutate(agent.id, {
        onSuccess: () => {
          toast.success('Agent deleted successfully');
          navigate('/agents');
        }
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">Loading agent details...</div>
      </AppLayout>
    );
  }

  if (!agent) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">Agent not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Helmet>
        <title>{agent.name} - Agent Details</title>
        <meta name="description" content={`Details for ${agent.name} AI agent`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/agents')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Agents
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{agent.name}</h1>
            <p className="text-muted-foreground mt-1">{agent.purpose}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/agents/${agent.id}/edit`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              disabled={agent.status === 'deprecated' || updateAgent.isPending}
              className="gap-2"
            >
              {agent.status === 'active' ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleteAgent.isPending}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <AgentStatusBadge status={agent.status} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Model</label>
                    <div className="mt-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded">{agent.model_version}</code>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Owner</label>
                    <p className="mt-1">{agent.owner}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Trigger</label>
                    <p className="mt-1 capitalize">{agent.trigger}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Input Source</label>
                    <p className="mt-1">{agent.input_source}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Output Target</label>
                    <p className="mt-1">{agent.output_target}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Timing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule & Timing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Schedule</label>
                  <p className="mt-1">{agent.schedule}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Run</label>
                  <p className="mt-1">
                    {agent.last_run ? (
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(agent.last_run), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="mt-1 text-sm">
                      {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="mt-1 text-sm">
                      {formatDistanceToNow(new Date(agent.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {agent.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{agent.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            {agent.metrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Latency</label>
                    <p className="mt-1 text-lg font-semibold">{agent.metrics.latencyMs}ms</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Error Rate</label>
                    <p className="mt-1 text-lg font-semibold">
                      {(agent.metrics.errorRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {agent.tags && agent.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};