import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, Play, Pause, Trash2, Edit, Calendar, Clock, Target, Settings, Tag, FileText, Palette, Image, Layers, Zap, BarChart3, CheckCircle, Users, Save, Copy, Shield, Code } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useOpenAIAgent, useUpdateAgent, useDeleteAgent, useCreateAgent } from '@/hooks/useOpenAIAgents';
import { AgentStatusBadge } from '@/components/agents/AgentStatusBadge';
import { AgentDeleteModal } from '@/components/agents/AgentDeleteModal';
import { SystemPromptsTab } from '@/components/agents/SystemPromptsTab';
import { useModelOptionsForForm } from '@/hooks/useAgentModelOptions';
import { useCategoryOptions } from '@/hooks/useAgentCategories';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { AgentStatus, CreateAgentData } from '@/types/openaiAgent';

// Schema for form validation
const agentSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  model_version: z.string(),
  trigger: z.string().min(1, 'Trigger is required'),
  input_source: z.string().min(1, 'Input source is required'),
  output_target: z.string().min(1, 'Output target is required'),
  schedule: z.string(),
  owner: z.string().min(1, 'Owner is required'),
  status: z.enum(['active', 'paused', 'deprecated']),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  supported_categories: z.array(z.string()).optional(),
  // Advanced settings
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(4000).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
});

type AgentFormData = z.infer<typeof agentSchema>;

export const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: agent, isLoading } = useOpenAIAgent(id!);
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const createAgent = useCreateAgent();
  
  // Fetch dynamic data for forms
  const { data: modelOptions, isLoading: modelsLoading } = useModelOptionsForForm();
  const { data: categoryOptions, isLoading: categoriesLoading } = useCategoryOptions();
  
  // State for tabs and modals
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form setup
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      purpose: '',
      model_version: 'gpt-5-mini-2025-08-07',
      trigger: '',
      input_source: '',
      output_target: '',
      schedule: 'manual',
      owner: '',
      status: 'active',
      tags: [],
      notes: '',
      supported_categories: [],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
  });

  // Populate form with agent data
  useEffect(() => {
    if (agent) {
      form.reset({
        name: agent.name,
        purpose: agent.purpose,
        model_version: agent.model_version,
        trigger: agent.trigger,
        input_source: agent.input_source,
        output_target: agent.output_target,
        schedule: agent.schedule,
        owner: agent.owner,
        status: agent.status,
        tags: agent.tags || [],
        notes: agent.notes || '',
        supported_categories: agent.supported_categories || [],
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || 1000,
        top_p: agent.top_p || 1,
        frequency_penalty: agent.frequency_penalty || 0,
        presence_penalty: agent.presence_penalty || 0,
      });
    }
  }, [agent, form]);

  // Form submission handler
  const onSubmit = (data: AgentFormData) => {
    const agentData = {
      name: data.name,
      purpose: data.purpose,
      model_version: data.model_version,
      trigger: data.trigger,
      input_source: data.input_source,
      output_target: data.output_target,
      schedule: data.schedule,
      owner: data.owner,
      status: data.status,
      tags: data.tags,
      notes: data.notes,
      supported_categories: data.supported_categories,
      temperature: data.temperature,
      max_tokens: data.max_tokens,
      top_p: data.top_p,
      frequency_penalty: data.frequency_penalty,
      presence_penalty: data.presence_penalty,
    };
    
    updateAgent.mutate({ id: id!, ...agentData }, {
      onSuccess: () => {
        toast.success('Agent updated successfully');
        setActiveTab('overview');
      }
    });
  };

  const handleSystemPromptsChange = (prompts: any[], categories: string[]) => {
    form.setValue('supported_categories', categories);
  };

  const handleToggleStatus = () => {
    if (!agent) return;
    const newStatus: AgentStatus = agent.status === 'active' ? 'paused' : 'active';
    updateAgent.mutate({ id: agent.id, status: newStatus });
  };

  const handleClone = () => {
    if (!agent) return;
    
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
      notes: agent.notes || '',
      supported_categories: agent.supported_categories || [],
      temperature: agent.temperature || 0.7,
      max_tokens: agent.max_tokens || 1000,
      top_p: agent.top_p || 1,
      frequency_penalty: agent.frequency_penalty || 0,
      presence_penalty: agent.presence_penalty || 0,
    };
    
    createAgent.mutate(cloneData, {
      onSuccess: (newAgent) => {
        toast.success('Agent cloned successfully');
        navigate(`/agents/${newAgent.id}`);
      }
    });
  };

  const handleDelete = () => {
    if (!agent) return;
    deleteAgent.mutate(agent.id, {
      onSuccess: () => {
        toast.success('Agent deleted successfully');
        navigate('/agents');
      }
    });
    setShowDeleteModal(false);
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
        <title>{agent.name} - Agent Management</title>
        <meta name="description" content={`Manage ${agent.name} AI agent settings and configuration`} />
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
              onClick={handleClone}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Clone
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/seed-analytics')}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Seed Dashboard
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
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteAgent.isPending}
              className="text-destructive hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="edit-basic">Edit Basic</TabsTrigger>
            <TabsTrigger value="model-settings">Model</TabsTrigger>
            <TabsTrigger value="system-prompts">Prompts</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="guardrails">Guardrails</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Original Detail View */}
          <TabsContent value="overview" className="space-y-4">{/* ... keep existing code (overview content) */}

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

                {/* Supported Categories */}
                {agent.supported_categories && agent.supported_categories.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <Users className="h-4 w-4 md:h-5 md:w-5" />
                        Supported Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {agent.supported_categories.map((category, index) => (
                          <Badge key={index} variant="outline" className="text-xs capitalize">
                            {category.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
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
          </TabsContent>

          {/* Edit Basic Info Tab */}
          <TabsContent value="edit-basic">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agent Name *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="owner"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purpose *</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormDescription>
                            Describe what this agent does and its main objectives
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="deprecated">Deprecated</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="schedule"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Schedule</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., manual, daily, on-demand" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="trigger"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trigger *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., API call, webhook, schedule" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="input_source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Input Source *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., API, file upload, form" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="output_target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Output Target *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., database, API, file" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Additional notes about this agent" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('overview')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateAgent.isPending} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Model Settings Tab */}
          <TabsContent value="model-settings">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Model & Advanced Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="model_version"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model Version</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {modelsLoading ? (
                                <SelectItem value="" disabled>Loading models...</SelectItem>
                              ) : (
                                modelOptions?.map((model) => (
                                  <SelectItem key={model.value} value={model.value}>
                                    <div className="flex items-center gap-2">
                                      <span>{model.label}</span>
                                      {model.recommended && (
                                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="temperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temperature (0-2)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                max="2" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Controls randomness. Lower values = more focused.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="max_tokens"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Tokens</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="4000" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum length of the response.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="top_p"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Top P (0-1)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                max="1" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Nucleus sampling parameter.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="frequency_penalty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency Penalty (-2 to 2)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="-2" 
                                max="2" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Penalizes repeated tokens.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="presence_penalty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Presence Penalty (-2 to 2)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="-2" 
                                max="2" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Penalizes presence of tokens.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('overview')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateAgent.isPending} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* System Prompts Tab */}
          <TabsContent value="system-prompts">
            <SystemPromptsTab
              agentId={agent?.id}
              agentName={agent?.name}
              systemPrompts={[]}
              supportedCategories={agent?.supported_categories || []}
              onChange={handleSystemPromptsChange}
            />
          </TabsContent>

          {/* Tools & Permissions Tab */}
          <TabsContent value="tools">
            <Card>
              <CardHeader>
                <CardTitle>Tools & Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tools and permissions configuration will be available in a future update.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guardrails Tab */}
          <TabsContent value="guardrails">
            <Card>
              <CardHeader>
                <CardTitle>Guardrails & Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Guardrails configuration will be available in a future update.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Modal */}
        {agent && (
          <AgentDeleteModal
            agent={agent}
            open={showDeleteModal}
            onOpenChange={setShowDeleteModal}
            onConfirm={handleDelete}
          />
        )}
      </div>
    </AppLayout>
  );
};