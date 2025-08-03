import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Pause, Trash2, Edit, Calendar, Clock, Target, Settings, Tag, FileText, Palette, Image, Layers, Zap, BarChart3, CheckCircle, Users } from 'lucide-react';
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

  // Check if this is a Visual Prompt Generator agent
  const isVisualPromptGenerator = agent?.name?.toLowerCase().includes('visual prompt generator') || 
                                   agent?.name?.toLowerCase().includes('visual prompt') ||
                                   agent?.purpose?.toLowerCase().includes('image generation prompt');

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

      <div className="container mx-auto px-4 py-4 md:py-8 max-w-full">
        {/* Header */}
        <div className="space-y-4 mb-6 md:mb-8">
          {/* Title and description */}
          <div className="space-y-2 overflow-hidden">
            <h1 className="text-xl md:text-3xl font-bold text-foreground break-words overflow-wrap-anywhere leading-tight">{agent.name}</h1>
            <p className="text-muted-foreground text-sm md:text-base break-words overflow-wrap-anywhere leading-relaxed">{agent.purpose}</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/agents')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Agents
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/agents/${agent.id}/edit`)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleStatus}
              disabled={agent.status === 'deprecated' || updateAgent.isPending}
              title={agent.status === 'active' ? 'Pause' : 'Activate'}
            >
              {agent.status === 'active' ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              disabled={deleteAgent.isPending}
              className="text-destructive hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Settings className="h-4 w-4 md:h-5 md:w-5" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <AgentStatusBadge status={agent.status} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Model</label>
                    <div className="mt-1">
                      <code className="text-xs md:text-sm bg-muted px-2 py-1 rounded break-all">{agent.model_version}</code>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Owner</label>
                    <p className="mt-1 text-sm break-words">{agent.owner}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Trigger</label>
                    <p className="mt-1 text-sm capitalize break-words">{agent.trigger}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Input Source</label>
                    <p className="mt-1 text-sm break-words">{agent.input_source}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Output Target</label>
                    <p className="mt-1 text-sm break-words">{agent.output_target}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visual Prompt Generator Specific Sections */}
            {isVisualPromptGenerator && (
              <>
                {/* Core Functionality */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Palette className="h-4 w-4 md:h-5 md:w-5" />
                      Core Functionality
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Image className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-sm">Professional Image Prompts</h4>
                          <p className="text-xs text-muted-foreground">Creates detailed prompts for AI image generators</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Layers className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-sm">Vector Illustration Style</h4>
                          <p className="text-xs text-muted-foreground">Consistent modern design approach</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-sm">Aspect Ratio Management</h4>
                          <p className="text-xs text-muted-foreground">Optimized for different platform requirements</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Palette className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-sm">Professional Color Palettes</h4>
                          <p className="text-xs text-muted-foreground">Industry-appropriate color schemes</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Specializations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Users className="h-4 w-4 md:h-5 md:w-5" />
                      Category Specializations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {agent.supported_categories?.map((category, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-lg">
                          <h4 className="font-medium text-sm capitalize mb-1">{category.replace(/_/g, ' ')}</h4>
                          <p className="text-xs text-muted-foreground">
                            {category === 'healthcare' && 'Medical and clinical visualization'}
                            {category === 'contracts' && 'Legal and compliance imagery'}
                            {category === 'design' && 'Creative and artistic content'}
                            {category === 'product_management' && 'Business and strategy visuals'}
                            {!['healthcare', 'contracts', 'design', 'product_management'].includes(category) && 'Professional industry content'}
                          </p>
                        </div>
                      )) || (
                        <div className="col-span-2 text-sm text-muted-foreground">
                          No specific categories configured
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Characteristics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                      Performance Characteristics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Zap className="h-5 w-5 text-primary mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Average Response</p>
                        <p className="font-semibold text-sm">1-3 seconds</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                        <p className="font-semibold text-sm">&gt;98%</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Target className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Quality Score</p>
                        <p className="font-semibold text-sm">High</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Key Features:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Prompt caching for faster generation</li>
                        <li>• Category-specific templates</li>
                        <li>• Style inheritance across projects</li>
                        <li>• Real-time performance monitoring</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* System Prompts */}
                {(agent as any).system_prompts && Array.isArray((agent as any).system_prompts) && (agent as any).system_prompts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <FileText className="h-4 w-4 md:h-5 md:w-5" />
                        System Prompts ({(agent as any).system_prompts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(agent as any).system_prompts.slice(0, 3).map((prompt: any, index: number) => (
                          <div key={index} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm capitalize">
                                {prompt.category?.replace(/_/g, ' ') || `Prompt ${index + 1}`}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {prompt.prompt?.length > 0 ? 'Active' : 'Draft'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {prompt.prompt?.substring(0, 150)}...
                            </p>
                          </div>
                        ))}
                        {(agent as any).system_prompts.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{(agent as any).system_prompts.length - 3} more prompts
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Schedule & Timing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                  Schedule & Timing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Schedule</label>
                  <p className="mt-1 text-sm break-words">{agent.schedule}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Run</label>
                  <p className="mt-1 text-sm">
                    {agent.last_run ? (
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="break-words">
                          {formatDistanceToNow(new Date(agent.last_run), { addSuffix: true })}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="mt-1 text-sm break-words">
                      {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="mt-1 text-sm break-words">
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
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <FileText className="h-4 w-4 md:h-5 md:w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed break-words">{agent.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Performance Metrics */}
            {agent.metrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Target className="h-4 w-4 md:h-5 md:w-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Latency</label>
                    <p className="mt-1 text-lg font-semibold break-words">{agent.metrics.latencyMs}ms</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Error Rate</label>
                    <p className="mt-1 text-lg font-semibold break-words">
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
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Tag className="h-4 w-4 md:h-5 md:w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs break-words">
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