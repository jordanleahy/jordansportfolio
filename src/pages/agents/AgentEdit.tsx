import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, Save, Trash2, Settings, Zap, Shield, Code, Copy, BarChart3 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useOpenAIAgent, useUpdateAgent, useDeleteAgent, useCreateAgent } from '@/hooks/useOpenAIAgents';
import { AgentStatus, CreateAgentData, SystemPrompt } from '@/types/openaiAgent';
import { AgentDeleteModal } from '@/components/agents/AgentDeleteModal';
import { SystemPromptsTab } from '@/components/agents/SystemPromptsTab';
import { toast } from 'sonner';

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
  system_prompts: z.array(z.object({
    category: z.string(),
    prompt: z.string()
  })).optional(),
  supported_categories: z.array(z.string()).optional(),
  // Advanced settings
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(4000).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
});

type AgentFormData = z.infer<typeof agentSchema>;

export const AgentEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const { data: agent, isLoading } = useOpenAIAgent(isNew ? '' : id!);
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const createAgent = useCreateAgent();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'prompts' | 'tools' | 'guardrails'>('basic');

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      purpose: '',
      model_version: 'gpt-4o-mini',
      trigger: '',
      input_source: '',
      output_target: '',
      schedule: 'manual',
      owner: '',
      status: 'active',
      tags: [],
      notes: '',
      system_prompts: [],
      supported_categories: [],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
  });

  useEffect(() => {
    if (agent && !isNew) {
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
        system_prompts: agent.system_prompts || [],
        supported_categories: agent.supported_categories || [],
        // Default advanced settings if not present
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
    }
  }, [agent, form, isNew]);

  const onSubmit = (data: AgentFormData) => {
    const { temperature, max_tokens, top_p, frequency_penalty, presence_penalty, ...basicData } = data;
    
    if (isNew) {
      createAgent.mutate(basicData as CreateAgentData, {
        onSuccess: (newAgent) => {
          toast.success('Agent created successfully');
          navigate(`/agents/${newAgent.id}`);
        }
      });
    } else {
      updateAgent.mutate({ id: id!, ...basicData }, {
        onSuccess: () => {
          toast.success('Agent updated successfully');
          navigate(`/agents/${id}`);
        }
      });
    }
  };

  const handleSystemPromptsChange = (prompts: SystemPrompt[], categories: string[]) => {
    form.setValue('system_prompts', prompts);
    form.setValue('supported_categories', categories);
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
      system_prompts: agent.system_prompts || [],
      supported_categories: agent.supported_categories || []
    };
    
    createAgent.mutate(cloneData, {
      onSuccess: (newAgent) => {
        toast.success('Agent cloned successfully');
        navigate(`/agents/${newAgent.id}/edit`);
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

  if (isLoading && !isNew) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">Loading agent...</div>
      </AppLayout>
    );
  }

  if (!agent && !isNew) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">Agent not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Helmet>
        <title>{isNew ? 'Create Agent' : `Edit ${agent?.name}`} - Agent Management</title>
      </Helmet>

      <div className="container mx-auto px-4 py-4 md:py-8 max-w-full">
        {/* Header */}
        <div className="space-y-4 mb-6 md:mb-8">
          {/* Back button */}
          <Button
            variant="outline"
            onClick={() => navigate('/agents')}
            className="gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Agents
          </Button>
          
          {/* Title and description */}
          <div className="space-y-2 overflow-hidden">
            <h1 className="text-xl md:text-3xl font-bold break-words overflow-wrap-anywhere leading-tight">
              {isNew ? 'Create New Agent' : `Edit ${agent?.name}`}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base break-words overflow-wrap-anywhere leading-relaxed">
              {isNew ? 'Configure a new AI agent' : 'Modify agent settings and configuration'}
            </p>
          </div>
          
          {/* Action buttons */}
          {!isNew && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleClone} className="gap-2 flex-1 sm:flex-none">
                <Copy className="h-4 w-4" />
                <span className="sm:inline">Clone</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/seed-analytics')}
                className="gap-2 flex-1 sm:flex-none"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="sm:inline">Seed Dashboard</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(true)}
                className="gap-2 text-destructive hover:text-destructive flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sm:inline">Delete</span>
              </Button>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
            {[
              { id: 'basic', label: 'Basic Info', icon: Settings },
              { id: 'advanced', label: 'Model Settings', icon: Zap },
              { id: 'prompts', label: 'System Prompts', icon: Code },
              { id: 'tools', label: 'Tools & Permissions', icon: Code },
              { id: 'guardrails', label: 'Guardrails', icon: Shield },
            ].map((tab) => (
                <Button
                  key={tab.id}
                  type="button"
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as any)}
                  className="gap-2 text-xs md:text-sm whitespace-nowrap"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Button>
              ))}
            </div>

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
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
            )}

            {/* Advanced Settings Tab */}
            {activeTab === 'advanced' && (
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
                            <SelectItem value="gpt-4.1-2025-04-14">gpt-4.1-2025-04-14 (Flagship)</SelectItem>
                            <SelectItem value="o3-2025-04-16">o3-2025-04-16 (Reasoning)</SelectItem>
                            <SelectItem value="o4-mini-2025-04-16">o4-mini-2025-04-16 (Fast Reasoning)</SelectItem>
                            <SelectItem value="gpt-4.1-mini-2025-04-14">gpt-4.1-mini-2025-04-14 (Vision)</SelectItem>
                            <SelectItem value="gpt-4o">gpt-4o (Legacy)</SelectItem>
                            <SelectItem value="gpt-4o-mini">gpt-4o-mini (Legacy)</SelectItem>
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
                </CardContent>
              </Card>
            )}

            {/* System Prompts Tab */}
            {activeTab === 'prompts' && (
              <SystemPromptsTab
                agentId={id}
                systemPrompts={form.watch('system_prompts') || []}
                supportedCategories={form.watch('supported_categories') || []}
                onChange={handleSystemPromptsChange}
              />
            )}

            {/* Tools & Permissions Tab */}
            {activeTab === 'tools' && (
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
            )}

            {/* Guardrails Tab */}
            {activeTab === 'guardrails' && (
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
            )}

            {/* Submit Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(isNew ? '/agents' : `/agents/${id}`)}
                className="order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateAgent.isPending || createAgent.isPending}
                className="gap-2 order-1 sm:order-2"
              >
                <Save className="h-4 w-4" />
                {isNew ? 'Create Agent' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>

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