import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Eye, Sparkles, Trash2, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { connectionPoolManager } from '@/services/realtime/RealtimeConnectionPoolManager';
import { realtimeEventBus } from '@/services/realtime/RealtimeEventBus';
import { useDebouncedCallback } from 'use-debounce';
import * as Diff from 'diff';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';

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
  const isMobile = useIsMobile();
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [agentName, setAgentName] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [previousPrompt, setPreviousPrompt] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { theme } = useTheme();
  
  // Refs for cleanup
  const componentId = useRef(`system-prompt-viewer-${Date.now()}`);
  const eventUnsubscribeRef = useRef<(() => void) | null>(null);

  const loadSystemPrompt = useCallback(async () => {
    if (!category) return;
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('openai_agents')
        .select('name, system_prompts, updated_at')
        .eq('user_id', user.id)
        .not('system_prompts', 'is', null);

      if (error) throw error;

      const agent = data?.find(agent => 
        agent.system_prompts && 
        Array.isArray(agent.system_prompts) && 
        agent.system_prompts.some((p: any) => p.category === category)
      );

      if (agent) {
        const prompts = Array.isArray(agent.system_prompts) ? agent.system_prompts : [];
        const categoryPrompt = prompts.find((p: any) => p.category === category);
        
        if (categoryPrompt) {
          const prompt = (categoryPrompt as { category: string; prompt: string }).prompt;
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
  }, [category]);

  // Debounced auto-save for better UX
  const debouncedSave = useDebouncedCallback(
    useCallback(async (promptToSave: string) => {
      if (promptToSave === systemPrompt || !promptToSave.trim()) return;
      
      console.log('🔄 [SystemPromptViewer] Auto-saving changes...');
      await handleSave(promptToSave);
    }, [systemPrompt]),
    2000
  );

  // Optimized event handler with useCallback
  const handleRealtimeUpdate = useCallback((event: any) => {
    if (event.type === 'update-received' && event.payload.table === 'openai_agents') {
      console.log('🔔 SystemPromptViewer: Received agent update', event.payload);
      // Check if system_prompts changed and contains our category
      if (event.payload.data?.system_prompts) {
        const hasCategory = event.payload.data.system_prompts.some((prompt: any) => prompt.category === category);
        if (hasCategory) {
          // Store current prompt as previous before loading new one
          setPreviousPrompt(systemPrompt);
          loadSystemPrompt();
        }
      }
    }
  }, [category, loadSystemPrompt, systemPrompt]);

  // Enhanced real-time connection with connection pooling
  useEffect(() => {
    if (!isVisible || !category) return;

    const setupConnection = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        console.log(`🔌 [SystemPromptViewer] Setting up pooled connection for user ${user.id}, category: ${category}`);

        // Get pooled connection
        connectionPoolManager.getOrCreateConnection(user.id, componentId.current);

        // Subscribe to events
        eventUnsubscribeRef.current = realtimeEventBus.on('update-received', handleRealtimeUpdate);

        // Initial load
        await loadSystemPrompt();

      } catch (error) {
        console.error('Error setting up real-time connection:', error);
      }
    };

    setupConnection();

    return () => {
      // Cleanup
      if (eventUnsubscribeRef.current) {
        eventUnsubscribeRef.current();
        eventUnsubscribeRef.current = null;
      }

      // Remove from connection pool
      const cleanup = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          connectionPoolManager.removeSubscriber(user.id, componentId.current);
        }
      };
      cleanup();
    };
  }, [isVisible, category, handleRealtimeUpdate]);

  // Listen for theme change success and manually refresh
  useEffect(() => {
    if (!isVisible || !category) return;
    
    const timer = setTimeout(() => {
      // Check if theme update happened by looking for 🏁 THEME UPDATE COMPLETE log
      if (systemPrompt) {
        setPreviousPrompt(systemPrompt);
        loadSystemPrompt();
      }
    }, 3000); // Wait 3 seconds after component becomes visible

    return () => clearTimeout(timer);
  }, [isVisible, category, systemPrompt, loadSystemPrompt]);

  // Auto-save when editing
  useEffect(() => {
    if (isEditing && editedPrompt !== systemPrompt) {
      debouncedSave(editedPrompt);
    }
  }, [editedPrompt, isEditing, debouncedSave, systemPrompt]);


  const handleSave = useCallback(async (promptToSave?: string) => {
    const finalPrompt = promptToSave || editedPrompt;
    if (!category || finalPrompt === systemPrompt) return;
    
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('openai_agents')
        .select('id, system_prompts')
        .eq('user_id', user.id)
        .not('system_prompts', 'is', null);

      if (error) throw error;

      const agent = data?.find(agent => 
        agent.system_prompts && 
        Array.isArray(agent.system_prompts) && 
        agent.system_prompts.some((p: any) => p.category === category)
      );

      if (agent) {
        const prompts = Array.isArray(agent.system_prompts) ? agent.system_prompts : [];
        const updatedPrompts = prompts.map((p: any) => 
          p.category === category ? { ...p, prompt: finalPrompt } : p
        );

        const { error: updateError } = await supabase
          .from('openai_agents')
          .update({
            system_prompts: updatedPrompts,
            updated_at: new Date().toISOString()
          })
          .eq('id', agent.id);

        if (updateError) throw updateError;

        setPreviousPrompt(systemPrompt);
        setSystemPrompt(finalPrompt);
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
  }, [category, editedPrompt, systemPrompt]);

  const handleCancel = useCallback(() => {
    setEditedPrompt(systemPrompt);
    setIsEditing(false);
  }, [systemPrompt]);

  const handleManualRefresh = useCallback(async () => {
    if (!category || !systemPrompt) return;
    
    console.log('🔄 [SystemPromptViewer] Manual refresh triggered');
    setPreviousPrompt(systemPrompt);
    await loadSystemPrompt();
    toast.success('System prompt refreshed');
  }, [category, systemPrompt, loadSystemPrompt]);

  const handleRegeneratePrompt = useCallback(async () => {
    if (!category) return;
    setIsRegenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('invoke-system-prompt-agent', {
        body: {
          category: category.replace('-', '_'),
          user_id: user.id,
          theme: `${category} content generation`,
          description: `Professional system prompt for generating ${category} themed visual content`,
          sample_posts: []
        }
      });

      if (error) throw error;
      if (data && data.generatedPrompt) {
        setPreviousPrompt(systemPrompt);
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
  }, [category, systemPrompt]);

  // Memoized diff rendering for performance
  const renderedPrompt = useMemo(() => {
    if (!systemPrompt) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No system prompt found for this category
        </div>
      );
    }

    if (!previousPrompt || systemPrompt === previousPrompt) {
      return (
        <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed border rounded-md p-3 bg-muted/30 h-full">
          {systemPrompt}
        </div>
      );
    }

    // Generate unified diff
    const diff = Diff.diffLines(previousPrompt, systemPrompt);
    let addedLines = 0;
    let removedLines = 0;
    
    diff.forEach(part => {
      if (part.added) addedLines += part.count || 0;
      if (part.removed) removedLines += part.count || 0;
    });

    return (
      <div className="border rounded-md overflow-hidden">
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
  }, [systemPrompt, previousPrompt]);

  // Shared content component for both mobile and desktop
  const contentComponent = (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-full min-h-32">
          <div className="text-muted-foreground">Loading system prompt...</div>
        </div>
      ) : isEditing ? (
        <div className="border border-input rounded-md overflow-hidden">
          <Editor
            height="400px"
            defaultLanguage="markdown"
            value={editedPrompt}
            onChange={(value) => setEditedPrompt(value || '')}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              folding: false,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              padding: { top: 12, bottom: 12 },
              contextmenu: !isMobile,
              commandPalette: !isMobile,
              placeholder: 'Enter system prompt...'
            }}
          />
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-auto">
          {renderedPrompt}
        </div>
      )}
    </>
  );

  // Shared header component for both mobile and desktop
  const headerComponent = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{category} System Prompt</h2>
          {agentName && (
            <p className="text-sm text-muted-foreground mt-1">
              Agent: {agentName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {/* Only show close button on desktop, or on mobile when not editing */}
          {(!isMobile || !isEditing) && (
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => handleSave()} 
                disabled={isSaving || editedPrompt === systemPrompt}
              >
                <Save className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {systemPrompt && (
                <>
                  <Button variant="outline" size="sm" onClick={handleManualRefresh}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRegeneratePrompt} 
                disabled={isRegenerating}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      {lastUpdated && (
        <p className="text-xs text-muted-foreground mt-2">
          Last updated: {lastUpdated}
        </p>
      )}
    </>
  );

  if (!isVisible) return null;

  // Mobile: Use Sheet for full-screen experience
  if (isMobile) {
    return (
      <Sheet open={isVisible} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full p-0 flex flex-col">
          <SheetHeader className="p-6 pb-3 border-b">
            {headerComponent}
          </SheetHeader>
          <div className="flex-1 p-6 pt-3">
            {contentComponent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Card with close button
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        {headerComponent}
      </CardHeader>
      <CardContent className="flex-1">
        {contentComponent}
      </CardContent>
    </Card>
  );
};