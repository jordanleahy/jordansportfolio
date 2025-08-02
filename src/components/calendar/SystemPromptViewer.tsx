import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Eye, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
interface SystemPromptViewerProps {
  category: string;
  isVisible: boolean;
  onClose: () => void;
}
export const SystemPromptViewer = ({
  category,
  isVisible,
  onClose
}: SystemPromptViewerProps) => {
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [agentName, setAgentName] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [previousPrompt, setPreviousPrompt] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Real-time subscription to openai_agents table
  useEffect(() => {
    let subscription: any;
    if (isVisible && category) {
      // Initial load
      loadSystemPrompt();

      // Set up real-time subscription
      subscription = supabase.channel(`system_prompt_${category}`).on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'openai_agents'
      }, payload => {
        console.log('🔄 Real-time update detected:', payload);

        // Check if this update affects our category
        if (payload.new && 'system_prompts' in payload.new && payload.new.system_prompts) {
          const prompts = Array.isArray(payload.new.system_prompts) ? payload.new.system_prompts as Array<{
            category: string;
            prompt: string;
          }> : [];
          const relevantPrompt = prompts.find(p => p.category === category);
          if (relevantPrompt && relevantPrompt.prompt !== systemPrompt) {
            console.log('📝 System prompt updated for category:', category);
            setPreviousPrompt(systemPrompt); // Store previous for diff
            setSystemPrompt(relevantPrompt.prompt);
            setLastUpdated(new Date().toLocaleString());

            // Show visual notification
            toast.success(`System prompt updated for ${category}`);
          }
        }
      }).subscribe();
    }
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [isVisible, category, systemPrompt]);
  const loadSystemPrompt = async () => {
    if (!category) return;
    setIsLoading(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const {
        data,
        error
      } = await supabase.from('openai_agents').select('name, system_prompts, updated_at').eq('user_id', user.id).not('system_prompts', 'is', null);
      if (error) throw error;

      // Find agent with prompt for this category
      const agent = data?.find(agent => agent.system_prompts && Array.isArray(agent.system_prompts) && agent.system_prompts.some((p: any) => p.category === category));
      if (agent) {
        const prompts = Array.isArray(agent.system_prompts) ? agent.system_prompts : [];
        const categoryPrompt = prompts.find((p: any) => p.category === category);
        if (categoryPrompt) {
          const prompt = (categoryPrompt as {
            category: string;
            prompt: string;
          }).prompt;
          setSystemPrompt(prompt);
          setEditedPrompt(prompt);
          setAgentName(agent.name);
          setLastUpdated(new Date(agent.updated_at).toLocaleString());
        }
      }
    } catch (error) {
      console.error('Error loading system prompt:', error);
      toast.error('Failed to load system prompt');
    } finally {
      setIsLoading(false);
    }
  };
  const handleSave = async () => {
    if (!category || editedPrompt === systemPrompt) return;
    setIsSaving(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current agent
      const {
        data,
        error
      } = await supabase.from('openai_agents').select('id, system_prompts').eq('user_id', user.id).not('system_prompts', 'is', null);
      if (error) throw error;
      const agent = data?.find(agent => agent.system_prompts && Array.isArray(agent.system_prompts) && agent.system_prompts.some((p: any) => p.category === category));
      if (agent) {
        const prompts = Array.isArray(agent.system_prompts) ? agent.system_prompts : [];
        const updatedPrompts = prompts.map((p: any) => p.category === category ? {
          ...p,
          prompt: editedPrompt
        } : p);
        const {
          error: updateError
        } = await supabase.from('openai_agents').update({
          system_prompts: updatedPrompts,
          updated_at: new Date().toISOString()
        }).eq('id', agent.id);
        if (updateError) throw updateError;
        setPreviousPrompt(systemPrompt);
        setSystemPrompt(editedPrompt);
        setIsEditing(false);
        setLastUpdated(new Date().toLocaleString());
        toast.success('System prompt updated successfully');
      }
    } catch (error) {
      console.error('Error saving system prompt:', error);
      toast.error('Failed to save system prompt');
    } finally {
      setIsSaving(false);
    }
  };
  const handleCancel = () => {
    setEditedPrompt(systemPrompt);
    setIsEditing(false);
  };
  const handleRegeneratePrompt = async () => {
    if (!category) return;
    setIsRegenerating(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call the invoke-system-prompt-agent edge function to regenerate the prompt
      const {
        data,
        error
      } = await supabase.functions.invoke('invoke-system-prompt-agent', {
        body: {
          category: category.replace('-', '_'),
          // Convert chart-type to chart_type
          user_id: user.id,
          theme: `${category} content generation`,
          description: `Professional system prompt for generating ${category} themed visual content`,
          sample_posts: []
        }
      });
      if (error) throw error;
      if (data && data.generatedPrompt) {
        // Store previous prompt for diff
        setPreviousPrompt(systemPrompt);

        // The edge function will automatically update the database
        // Real-time subscription will pick up the change
        toast.success('System prompt regenerated successfully');
      } else {
        throw new Error('No generated prompt received');
      }
    } catch (error) {
      console.error('Error regenerating system prompt:', error);
      toast.error('Failed to regenerate system prompt');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Simple diff highlighting - highlight changed lines
  const renderPromptWithHighlight = (text: string, previousText: string) => {
    if (!previousText || text === previousText) {
      return <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{text}</div>;
    }
    const currentLines = text.split('\n');
    const previousLines = previousText.split('\n');
    return <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
        {currentLines.map((line, index) => {
        const wasChanged = !previousLines[index] || previousLines[index] !== line;
        return <div key={index} className={wasChanged ? 'bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded' : ''}>
              {line}
              {index < currentLines.length - 1 && '\n'}
            </div>;
      })}
      </div>;
  };
  if (!isVisible) return null;
  return <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div>
            
            <CardTitle className="text-lg">System Prompt</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRegeneratePrompt} disabled={isRegenerating} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {isRegenerating ? 'Generating...' : 'Generate Rich Prompt'}
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {!isEditing && systemPrompt && <div className="flex items-center gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          </div>}
        
        {isEditing && <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving || editedPrompt === systemPrompt} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>}
        {lastUpdated && <p className="text-xs text-muted-foreground mt-2">
            Last updated: {lastUpdated}
          </p>}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {isLoading ? <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading system prompt...</div>
          </div> : isEditing ? <Textarea value={editedPrompt} onChange={e => setEditedPrompt(e.target.value)} className="h-full resize-none font-mono text-sm" placeholder="Enter system prompt..." /> : <div className="h-full overflow-auto">
            {systemPrompt ? renderPromptWithHighlight(systemPrompt, previousPrompt) : <div className="flex items-center justify-center h-full text-muted-foreground">
                No system prompt found for this category
              </div>}
          </div>}
      </CardContent>
    </Card>;
};