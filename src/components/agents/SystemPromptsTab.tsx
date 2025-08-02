import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { CategoryPromptEditor } from './CategoryPromptEditor';
import { GenerateSystemPromptButton } from './GenerateSystemPromptButton';
import { useSystemPromptCache } from '@/hooks/useSystemPromptCache';
import { useRealtimeSystemPrompts } from '@/hooks/realtime/useRealtimeSystemPrompts';

import { DEFAULT_CATEGORIES, getCategoryLabel } from '@/constants/categoryConstants';

interface SystemPromptsTabProps {
  agentId?: string;
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
  const { toast } = useToast();

  // Set up realtime updates for system prompts
  useRealtimeSystemPrompts({
    enabled: !!agentId,
    onPromptUpdated: () => {
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
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('system_prompts')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: true });

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
    const dbCategories = databasePrompts.map(p => p.category);
    const legacyCategories = systemPrompts.map(p => p.category);
    const allCategories = [...new Set([...dbCategories, ...legacyCategories])];
    return allCategories.filter(Boolean); // Remove any undefined/null categories
  }, [databasePrompts, systemPrompts]);

  // Update agent's supported categories when active categories change
  useEffect(() => {
    if (JSON.stringify(activeCategories.sort()) !== JSON.stringify(supportedCategories.sort())) {
      onChange(systemPrompts, activeCategories);
    }
  }, [activeCategories, supportedCategories, systemPrompts, onChange]);

  const updatePrompt = (index: number, prompt: string) => {
    const newPrompts = [...systemPrompts];
    newPrompts[index] = { ...newPrompts[index], prompt };
    onChange(newPrompts, supportedCategories);
  };

  const updatePromptCategory = (index: number, category: string) => {
    const newPrompts = [...systemPrompts];
    const oldCategory = newPrompts[index].category;
    newPrompts[index] = { ...newPrompts[index], category };
    
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
    const newCategories = newPrompts.some(p => p.category === removedCategory)
      ? supportedCategories
      : supportedCategories.filter(c => c !== removedCategory);
    
    onChange(newPrompts, newCategories);
  };

  const deleteSystemPrompt = async (promptId: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('system_prompts')
        .delete()
        .eq('id', promptId);
      
      if (error) throw error;
      
      // Remove from local state
      setDatabasePrompts(prev => prev.filter(p => p.id !== promptId));
      
      toast({
        title: "System prompt deleted",
        description: "The system prompt has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting system prompt:', error);
      toast({
        title: "Error",
        description: "Failed to delete system prompt. Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>System Prompts Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Categories Display */}
        <div>
          <h4 className="text-sm font-medium mb-2">Active Categories</h4>
          <div className="flex flex-wrap gap-2">
            {activeCategories.length > 0 ? (
              activeCategories.map((category) => (
                <Badge key={category} variant="secondary">
                  {getCategoryLabel(category)}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No categories with prompts found</p>
            )}
          </div>
        </div>

        {/* Database System Prompts */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Database System Prompts</h4>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading system prompts...</div>
          ) : databasePrompts.length > 0 ? (
            databasePrompts.map((dbPrompt) => (
              <div key={dbPrompt.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dbPrompt.name}</span>
                      <Badge variant="outline">
                        {getCategoryLabel(dbPrompt.category)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{dbPrompt.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(`/calendar?category=${dbPrompt.category}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {agentId && (
                      <GenerateSystemPromptButton
                        agentId={agentId}
                        category={dbPrompt.category}
                        onSuccess={() => {
                          fetchDatabasePrompts();
                        }}
                      />
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
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
                          <AlertDialogAction 
                            onClick={() => deleteSystemPrompt(dbPrompt.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <CategoryPromptEditor
                  prompt={dbPrompt.prompt_text || ''}
                  onChange={(newPrompt) => {
                    // Update the database prompt directly
                    const updateDatabasePrompt = async () => {
                      try {
                        const { supabase } = await import('@/integrations/supabase/client');
                        const { error } = await supabase
                          .from('system_prompts')
                          .update({ prompt_text: newPrompt })
                          .eq('id', dbPrompt.id);
                        
                        if (error) throw error;
                        // Update local state
                        setDatabasePrompts(prev => 
                          prev.map(p => p.id === dbPrompt.id ? { ...p, prompt_text: newPrompt } : p)
                        );
                      } catch (error) {
                        console.error('Error updating system prompt:', error);
                      }
                    };
                    updateDatabasePrompt();
                  }}
                />
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground italic p-4 border-2 border-dashed rounded-md">
              No system prompts found in database. Use the "Generate Rich Prompt" button to create CDI template prompts.
            </div>
          )}
        </div>

        {/* Legacy System Prompts from Agent Configuration */}
        {systemPrompts.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Legacy Agent System Prompts</h4>
            {activeCategories.filter(category => systemPrompts.some(p => p.category === category)).length > 0 ? (
              activeCategories.filter(category => systemPrompts.some(p => p.category === category)).map((category) => {
                const existingPrompt = systemPrompts.find(p => p.category === category);
                const promptIndex = systemPrompts.findIndex(p => p.category === category);
                
                return (
                  <div key={category} className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">Legacy Category:</span>
                        <Badge variant="outline" className="w-48 justify-start">
                          {getCategoryLabel(category)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {existingPrompt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePrompt(promptIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {existingPrompt ? (
                      <CategoryPromptEditor
                        prompt={existingPrompt.prompt}
                        onChange={(newPrompt) => updatePrompt(promptIndex, newPrompt)}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground italic p-4 border-2 border-dashed rounded-md">
                        No legacy prompt found.
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No legacy categories configured.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
