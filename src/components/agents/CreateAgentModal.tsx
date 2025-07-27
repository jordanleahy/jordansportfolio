
import { useState } from 'react';
import { useCreateAgent } from '@/hooks/useOpenAIAgents';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from 'lucide-react';
import { CreateAgentData, AgentStatus } from '@/types/openaiAgent';
import { AgentTemplateSelector } from './AgentTemplateSelector';

export const CreateAgentModal = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateAgentData>({
    name: '',
    purpose: '',
    model_version: 'gpt-4o-mini',
    trigger: '',
    input_source: '',
    output_target: '',
    schedule: 'manual',
    owner: '',
    status: 'active' as AgentStatus,
    tags: [],
    notes: '',
    system_prompts: [],
    supported_categories: []
  });

  const createAgent = useCreateAgent();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAgent.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          name: '',
          purpose: '',
          model_version: 'gpt-4o-mini',
          trigger: '',
          input_source: '',
          output_target: '',
          schedule: 'manual',
          owner: '',
          status: 'active' as AgentStatus,
          tags: [],
          notes: '',
          system_prompts: [],
          supported_categories: []
        });
      }
    });
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData({ ...formData, tags });
  };

  const handleTemplateSelect = (template: CreateAgentData) => {
    setFormData(template);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New OpenAI Agent</DialogTitle>
          <DialogDescription>
            Add a new AI agent to track and manage automation workflows.
          </DialogDescription>
        </DialogHeader>

        <AgentTemplateSelector onSelectTemplate={handleTemplateSelect} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="owner">Owner *</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="purpose">Purpose *</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="model_version">Model Version</Label>
              <Select
                value={formData.model_version}
                onValueChange={(value) => setFormData({ ...formData, model_version: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                  <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as AgentStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trigger">Trigger *</Label>
              <Input
                id="trigger"
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                placeholder="e.g., API call, webhook, schedule"
                required
              />
            </div>
            <div>
              <Label htmlFor="schedule">Schedule</Label>
              <Input
                id="schedule"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="e.g., manual, daily, on-demand"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="input_source">Input Source *</Label>
              <Input
                id="input_source"
                value={formData.input_source}
                onChange={(e) => setFormData({ ...formData, input_source: e.target.value })}
                placeholder="e.g., API, file upload, form"
                required
              />
            </div>
            <div>
              <Label htmlFor="output_target">Output Target *</Label>
              <Input
                id="output_target"
                value={formData.output_target}
                onChange={(e) => setFormData({ ...formData, output_target: e.target.value })}
                placeholder="e.g., database, API, file"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="Comma-separated tags"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes about this agent"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAgent.isPending}>
              {createAgent.isPending ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
