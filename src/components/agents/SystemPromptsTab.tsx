import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CategoryPromptEditor } from './CategoryPromptEditor';
import { useSystemPromptCache } from '@/hooks/useSystemPromptCache';
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_CATEGORIES, VISUAL_PROMPT_CATEGORIES, getCategoryLabel } from '@/constants/categoryConstants';
interface SystemPromptsTabProps {
  agentId?: string;
  agentName?: string;
  systemPrompts: any[];
  supportedCategories: string[];
  onChange: (prompts: any[], categories: string[]) => void;
}
export const SystemPromptsTab = ({
  agentId,
  systemPrompts,
  supportedCategories,
  onChange
}: SystemPromptsTabProps) => {
  const [databasePrompts, setDatabasePrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();

  // Set up realtime updates for system prompts
  useUnifiedRealtime({
    enabled: !!agentId,
    userId: user?.id,
    onSystemPromptUpdate: () => {
      if (agentId) {
        fetchDatabasePrompts();
      }
    }
  });

  // Fetch system prompts from database
  const fetchDatabasePrompts = async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const {
        supabase
      } = await import('@/integrations/supabase/client');
      const {
        data,
        error
      } = await supabase.from('system_prompts').select('*').eq('agent_id', agentId).order('created_at', {
        ascending: true
      });
      if (error) throw error;
      setDatabasePrompts(data || []);
    } catch (error) {
      console.error('Error fetching system prompts:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDatabasePrompts();
  }, [agentId]);

  // Calculate active categories dynamically based on existing prompts
  const activeCategories = useMemo(() => {
    const legacyCategories = systemPrompts.map(p => p.category);
    return [...new Set(legacyCategories)].filter(Boolean); // Remove any undefined/null categories
  }, [systemPrompts]);


  // Update agent's supported categories when active categories change
  useEffect(() => {
    if (JSON.stringify(activeCategories.sort()) !== JSON.stringify(supportedCategories.sort())) {
      onChange(systemPrompts, activeCategories);
    }
  }, [activeCategories, supportedCategories, systemPrompts, onChange]);
  const updatePrompt = (index: number, prompt: string) => {
    const newPrompts = [...systemPrompts];
    newPrompts[index] = {
      ...newPrompts[index],
      prompt
    };
    onChange(newPrompts, supportedCategories);
  };
  const updatePromptCategory = (index: number, category: string) => {
    const newPrompts = [...systemPrompts];
    const oldCategory = newPrompts[index].category;
    newPrompts[index] = {
      ...newPrompts[index],
      category
    };

    // Update supported categories
    let newCategories = [...supportedCategories];

    // Add new category if not present
    if (!newCategories.includes(category)) {
      newCategories.push(category);
    }

    // Remove old category if no other prompts use it
    const oldCategoryStillUsed = newPrompts.some(p => p.category === oldCategory);
    if (!oldCategoryStillUsed) {
      newCategories = newCategories.filter(c => c !== oldCategory);
    }
    onChange(newPrompts, newCategories);
  };
  const removePrompt = (index: number) => {
    const newPrompts = systemPrompts.filter((_, i) => i !== index);
    const removedCategory = systemPrompts[index].category;

    // Remove category if no other prompts use it
    const newCategories = newPrompts.some(p => p.category === removedCategory) ? supportedCategories : supportedCategories.filter(c => c !== removedCategory);
    onChange(newPrompts, newCategories);
  };
  const deleteSystemPrompt = async (promptId: string) => {
    try {
      const {
        supabase
      } = await import('@/integrations/supabase/client');

      const {
        error
      } = await supabase.from('system_prompts').delete().eq('id', promptId);
      if (error) throw error;

      // Remove from local state
      setDatabasePrompts(prev => prev.filter(p => p.id !== promptId));
      toast({
        title: "System prompt deleted",
        description: "The system prompt has been successfully deleted from the database."
      });
    } catch (error) {
      console.error('Error deleting system prompt:', error);
      toast({
        title: "Error",
        description: "Failed to delete system prompt. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleCopyPrompt = async (promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      toast({
        title: "Copied!",
        description: "System prompt copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy prompt to clipboard.",
        variant: "destructive"
      });
    }
  };
  return <Card>
      <CardHeader>
        
      </CardHeader>
      <CardContent className="space-y-6 h-full min-h-screen flex flex-col">
        {/* Active Categories Display */}
        <div>
          <h4 className="text-sm font-medium mb-2">Active Categories ({activeCategories.length})</h4>
          <div className="flex flex-wrap gap-2">
            {activeCategories.length > 0 ? activeCategories.map(category => <Badge key={category} variant="secondary">
                  {getCategoryLabel(category)}
                </Badge>) : <p className="text-sm text-muted-foreground">No categories with prompts found</p>}
          </div>
        </div>


        {/* Database System Prompts */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Database System Prompts</h4>
          {loading ? <div className="text-sm text-muted-foreground">Loading system prompts...</div> : databasePrompts.length > 0 ? databasePrompts.map(dbPrompt => <div key={dbPrompt.id} className="border rounded-lg p-4 h-screen flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopyPrompt(dbPrompt.prompt_text || '')} disabled={!dbPrompt.prompt_text?.trim()} className="gap-2">
                      <Copy className="h-4 w-4" />
                      Copy Prompt
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete System Prompt</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the "{dbPrompt.name}" system prompt? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteSystemPrompt(dbPrompt.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <CategoryPromptEditor prompt={dbPrompt.prompt_text || ''} onChange={newPrompt => {
            // Update the database prompt directly
            const updateDatabasePrompt = async () => {
              try {
                const {
                  supabase
                } = await import('@/integrations/supabase/client');
                const {
                  error
                } = await supabase.from('system_prompts').update({
                  prompt_text: newPrompt
                }).eq('id', dbPrompt.id);
                if (error) throw error;
                // Update local state
                setDatabasePrompts(prev => prev.map(p => p.id === dbPrompt.id ? {
                  ...p,
                  prompt_text: newPrompt
                } : p));
              } catch (error) {
                console.error('Error updating system prompt:', error);
              }
            };
            updateDatabasePrompt();
          }} />
              </div>) : <div className="text-sm text-muted-foreground italic p-4 border-2 border-dashed rounded-md">
              No system prompts found in database. Use the "Generate Rich Prompt" button to create CDI template prompts.
            </div>}
        </div>

        {/* Legacy System Prompts from Agent Configuration */}
        {systemPrompts.length > 0 && <div className="space-y-4">
            <h4 className="text-sm font-medium">Legacy Agent System Prompts</h4>
            {activeCategories.filter(category => systemPrompts.some(p => p.category === category)).length > 0 ? activeCategories.filter(category => systemPrompts.some(p => p.category === category)).map(category => {
          const existingPrompt = systemPrompts.find(p => p.category === category);
          const promptIndex = systemPrompts.findIndex(p => p.category === category);
          return <div key={category} className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">Legacy Category:</span>
                        <Badge variant="outline" className="w-48 justify-start">
                          {getCategoryLabel(category)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {existingPrompt && <Button variant="ghost" size="sm" onClick={() => removePrompt(promptIndex)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>}
                      </div>
                    </div>
                    
                    {existingPrompt ? <CategoryPromptEditor prompt={existingPrompt.prompt} onChange={newPrompt => updatePrompt(promptIndex, newPrompt)} /> : <div className="text-sm text-muted-foreground italic p-4 border-2 border-dashed rounded-md">
                        No legacy prompt found.
                      </div>}
                  </div>;
        }) : <p className="text-sm text-muted-foreground">
                No legacy categories configured.
              </p>}
          </div>}
      </CardContent>
    </Card>;
};