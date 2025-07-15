import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, ArrowRight, Bot, Plus, X } from 'lucide-react';
import { Agent, CreateAgentData } from '@/types/agent';
import { useCreateAgent, useUpdateAgent } from '@/hooks/useAgents';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AgentWizardProps {
  agent?: Agent;
  onCancel: () => void;
}

const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Efficient)' },
  { value: 'gpt-4o', label: 'GPT-4o (Advanced)' },
];

const CATEGORIES = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'general', label: 'General' },
];

export const AgentWizard = ({ agent, onCancel }: AgentWizardProps) => {
  const navigate = useNavigate();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const isEditing = !!agent;

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateAgentData>({
    name: agent?.name || '',
    slug: agent?.slug || '',
    description: agent?.description || '',
    system_prompt: agent?.system_prompt || '',
    model: agent?.model || 'gpt-4o-mini',
    temperature: agent?.temperature || 0.7,
    max_tokens: agent?.max_tokens || 1000,
    category: agent?.category || 'general',
    example_prompts: agent?.example_prompts || [],
    tags: agent?.tags || [],
  });

  const [newExamplePrompt, setNewExamplePrompt] = useState('');
  const [newTag, setNewTag] = useState('');

  const steps = [
    'Basic Info',
    'System Prompt',
    'Model Settings',
    'Examples & Tags',
    'Review'
  ];

  const updateFormData = (field: keyof CreateAgentData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === 'name' && !isEditing) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const addExamplePrompt = () => {
    if (newExamplePrompt.trim()) {
      updateFormData('example_prompts', [...(formData.example_prompts || []), newExamplePrompt.trim()]);
      setNewExamplePrompt('');
    }
  };

  const removeExamplePrompt = (index: number) => {
    const prompts = [...(formData.example_prompts || [])];
    prompts.splice(index, 1);
    updateFormData('example_prompts', prompts);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      updateFormData('tags', [...(formData.tags || []), newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    updateFormData('tags', formData.tags?.filter(t => t !== tag) || []);
  };

  const handleSave = async () => {
    try {
      if (isEditing && agent) {
        await updateAgent.mutateAsync({ id: agent.id, data: formData });
        navigate(`/agents/${formData.slug}`);
      } else {
        const newAgent = await createAgent.mutateAsync(formData);
        navigate(`/agents/${newAgent.slug}`);
      }
    } catch (error) {
      console.error('Error saving agent:', error);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.name && formData.slug;
      case 1:
        return formData.system_prompt && formData.system_prompt.length > 50;
      case 2:
        return formData.model && formData.temperature !== undefined && formData.max_tokens;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Avatar className="h-16 w-16 mx-auto mb-4">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">Basic Information</h2>
              <p className="text-sm text-muted-foreground">Set up your agent's identity</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="e.g., RCM-Denials-Coach"
                />
              </div>
              
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => updateFormData('slug', e.target.value)}
                  placeholder="rcm-denials-coach"
                  disabled={isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Brief description of what your agent does..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => updateFormData('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">System Prompt</h2>
              <p className="text-sm text-muted-foreground">Define your agent's behavior and expertise</p>
            </div>
            
            <div>
              <Label htmlFor="system_prompt">System Prompt</Label>
              <Textarea
                id="system_prompt"
                value={formData.system_prompt}
                onChange={(e) => updateFormData('system_prompt', e.target.value)}
                placeholder="You are a helpful AI assistant that..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {formData.system_prompt.length} characters (minimum 50 required)
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">Model Settings</h2>
              <p className="text-sm text-muted-foreground">Configure how your agent responds</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="model">AI Model</Label>
                <Select value={formData.model} onValueChange={(value) => updateFormData('model', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="temperature">
                  Temperature: {formData.temperature}
                </Label>
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => updateFormData('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>More Focused</span>
                  <span>More Creative</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="max_tokens">Max Response Length</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value={formData.max_tokens}
                  onChange={(e) => updateFormData('max_tokens', parseInt(e.target.value))}
                  min="100"
                  max="4000"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">Examples & Tags</h2>
              <p className="text-sm text-muted-foreground">Help users discover your agent</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label>Example Prompts</Label>
                <div className="space-y-2">
                  {formData.example_prompts?.map((prompt, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <p className="flex-1 text-sm">{prompt}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeExamplePrompt(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <Textarea
                      value={newExamplePrompt}
                      onChange={(e) => setNewExamplePrompt(e.target.value)}
                      placeholder="Add an example prompt..."
                      rows={2}
                    />
                    <Button onClick={addExamplePrompt} disabled={!newExamplePrompt.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} disabled={!newTag.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">Review & Create</h2>
              <p className="text-sm text-muted-foreground">Review your agent configuration</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  {formData.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Description</Label>
                  <p className="text-sm">{formData.description || 'No description provided'}</p>
                </div>
                
                <div className="flex gap-2">
                  <Badge>{formData.category}</Badge>
                  <Badge variant="outline">{formData.model}</Badge>
                </div>
                
                <div>
                  <Label className="text-xs">System Prompt Preview</Label>
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    {formData.system_prompt.slice(0, 200)}...
                  </p>
                </div>
                
                {formData.example_prompts && formData.example_prompts.length > 0 && (
                  <div>
                    <Label className="text-xs">Example Prompts ({formData.example_prompts.length})</Label>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="font-semibold">
                  {isEditing ? 'Edit Agent' : 'Create Agent'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
                </p>
              </div>
            </div>
            
            {currentStep === steps.length - 1 && (
              <Button 
                onClick={handleSave}
                disabled={createAgent.isPending || updateAgent.isPending}
              >
                {isEditing ? 'Update' : 'Create'} Agent
              </Button>
            )}
          </div>
          
          {/* Progress */}
          <div className="flex gap-2 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 h-2 rounded-full",
                  index <= currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {renderStep()}
          
          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < steps.length - 1 && (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!isStepValid(currentStep)}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};