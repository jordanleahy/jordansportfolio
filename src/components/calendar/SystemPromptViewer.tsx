import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Eye, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import * as Diff from 'diff';

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

  // Enhanced unified diff view with proper git-style highlighting
  const renderPromptWithHighlight = (text: string, previousText: string) => {
    if (!previousText || text === previousText) {
      return <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed border rounded-md p-3 bg-muted/30 h-full">{text}</div>;
    }

    // Generate unified diff
    const diff = Diff.diffLines(previousText, text);
    let addedLines = 0;
    let removedLines = 0;
    
    // Count changes for header
    diff.forEach(part => {
      if (part.added) addedLines += part.count || 0;
      if (part.removed) removedLines += part.count || 0;
    });

    return (
      <div className="border rounded-md overflow-hidden">
        {/* Diff header with statistics */}
        <div className="bg-muted px-3 py-2 border-b text-sm font-medium flex items-center justify-between">
          <span>System Prompt Changes</span>
          <div className="flex items-center gap-4 text-xs">
            {addedLines > 0 && (
              <span className="text-green-600 dark:text-green-400">
                +{addedLines} lines
              </span>
            )}
            {removedLines > 0 && (
              <span className="text-red-600 dark:text-red-400">
                -{removedLines} lines
              </span>
            )}
          </div>
        </div>
        
        {/* Diff content */}
        <div className="font-mono text-sm max-h-96 overflow-auto">
          {diff.map((part, index) => {
            if (part.added) {
              return part.value.split('\n').map((line, lineIndex) => {
                if (lineIndex === part.value.split('\n').length - 1 && line === '') return null;
                return (
                  <div 
                    key={`${index}-${lineIndex}`}
                    className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 px-3 py-1 flex"
                  >
                    <span className="text-green-600 dark:text-green-400 w-8 select-none">+</span>
                    <span className="flex-1">{line}</span>
                  </div>
                );
              });
            } else if (part.removed) {
              return part.value.split('\n').map((line, lineIndex) => {
                if (lineIndex === part.value.split('\n').length - 1 && line === '') return null;
                return (
                  <div 
                    key={`${index}-${lineIndex}`}
                    className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 px-3 py-1 flex"
                  >
                    <span className="text-red-600 dark:text-red-400 w-8 select-none">-</span>
                    <span className="flex-1">{line}</span>
                  </div>
                );
              });
            } else {
              // Context lines (unchanged)
              return part.value.split('\n').map((line, lineIndex) => {
                if (lineIndex === part.value.split('\n').length - 1 && line === '') return null;
                return (
                  <div 
                    key={`${index}-${lineIndex}`}
                    className="px-3 py-1 flex border-l-4 border-transparent"
                  >
                    <span className="text-muted-foreground w-8 select-none"> </span>
                    <span className="flex-1">{line}</span>
                  </div>
                );
              });
            }
          }).flat().filter(Boolean)}
        </div>
      </div>
    );
  };
  if (!isVisible) return null;
  return <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle></CardTitle>
            {agentName && (
              <p className="text-sm text-muted-foreground mt-1">
                Agent: {agentName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving || editedPrompt === systemPrompt}>
                  <Save className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                {systemPrompt && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleRegeneratePrompt} disabled={isRegenerating}>
                  <Sparkles className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        
        {lastUpdated && <p className="text-xs text-muted-foreground mt-2">
            Last updated: {lastUpdated}
          </p>}
      </CardHeader>

      <CardContent className="flex-1">
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
