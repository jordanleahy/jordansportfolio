import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, X, Sparkles, GitCompare, RotateCcw, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { OptimizedMonacoEditor } from '@/components/ui/optimized-monaco-editor';
import { useSystemPromptCache } from '@/hooks/useSystemPromptCache';
import { useRealtimeSystemPrompts } from '@/hooks/realtime/useRealtimeSystemPrompts';
import { diffLines } from 'diff';

interface SystemPromptViewerProps {
  category: string;
  isVisible: boolean;
  onClose: () => void;
  selectedThemeId?: string;
}

export const SystemPromptViewer = ({
  category,
  isVisible,
  onClose,
  selectedThemeId
}: SystemPromptViewerProps) => {
  const isMobile = useIsMobile();
  const [showDiff, setShowDiff] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [originalPrompt, setOriginalPrompt] = useState<string>('');
  const [realtimeUpdateReceived, setRealtimeUpdateReceived] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Use the optimized cache hook
  const {
    data: promptData,
    isLoading,
    updatePrompt,
    isUpdating,
    regeneratePrompt,
    isRegenerating,
    invalidateCache
  } = useSystemPromptCache(category);

  // Use realtime system prompts
  const { isConnected } = useRealtimeSystemPrompts({
    enabled: isVisible,
    onPromptUpdated: (data) => {
      if (data.category === category) {
        setRealtimeUpdateReceived(true);
        // Show update indicator briefly
        setTimeout(() => setRealtimeUpdateReceived(false), 3000);
      }
    }
  });

  // Update local state when data changes
  useEffect(() => {
    if (promptData) {
      setEditedPrompt(promptData.prompt);
      setOriginalPrompt(promptData.prompt);
    }
  }, [promptData]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return editedPrompt !== originalPrompt;
  }, [editedPrompt, originalPrompt]);

  // Add keyboard shortcut for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges) {
          handleSave();
        }
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [hasChanges, isVisible]);

  const handleSave = useCallback(async () => {
    if (!editedPrompt || editedPrompt === originalPrompt) return;
    
    try {
      setSaveStatus('saving');
      await updatePrompt({ newPrompt: editedPrompt });
      setOriginalPrompt(editedPrompt);
      setSaveStatus('saved');
      toast.success('System prompt saved successfully');
      
      // Reset save status after showing success
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving system prompt:', error);
      setSaveStatus('error');
      toast.error('Failed to save system prompt');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [editedPrompt, originalPrompt, updatePrompt]);

  const handleReset = useCallback(() => {
    setEditedPrompt(originalPrompt);
    setShowDiff(false);
    setSaveStatus('idle');
  }, [originalPrompt]);

  const handleRegeneratePrompt = useCallback(async () => {
    if (!category) return;
    
    try {
      await regeneratePrompt();
      toast.success('System prompt regenerated successfully');
    } catch (error) {
      console.error('Error regenerating system prompt:', error);
      toast.error('Failed to regenerate system prompt');
    }
  }, [category, regeneratePrompt]);

  // Compute diff for changes
  const diffResult = useMemo(() => {
    if (!hasChanges || !originalPrompt || !editedPrompt) return null;
    return diffLines(originalPrompt, editedPrompt);
  }, [hasChanges, originalPrompt, editedPrompt]);

  // Diff component
  const DiffView = () => (
    <div className={`${isMobile ? 'max-h-[40vh]' : 'max-h-[60vh]'} overflow-auto border rounded-md bg-muted/30`}>
      <div className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>
        {diffResult?.map((part, index) => (
          <div
            key={index}
            className={`px-3 py-1 ${
              part.added
                ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                : part.removed
                ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                : 'text-foreground'
            }`}
          >
            <span className="text-muted-foreground mr-2 select-none">
              {part.added ? '+' : part.removed ? '-' : ' '}
            </span>
            {part.value.split('\n').map((line, lineIndex) => (
              lineIndex < part.value.split('\n').length - 1 && (
                <div key={lineIndex}>{line}</div>
              )
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  // Get save button text based on status
  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving':
        return isMobile ? 'Saving...' : 'Saving...';
      case 'saved':
        return isMobile ? 'Saved!' : 'Saved!';
      case 'error':
        return isMobile ? 'Error' : 'Error';
      default:
        return isMobile ? 'Save' : 'Save Changes';
    }
  };

  // Get save button variant based on status
  const getSaveButtonVariant = () => {
    switch (saveStatus) {
      case 'saved':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return hasChanges ? 'default' : 'outline';
    }
  };

  // Shared content component
  const contentComponent = (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-full min-h-32">
          <div className="text-muted-foreground">Loading system prompt...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Show prominent save button when there are changes */}
          {hasChanges && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md">
              <div className="flex-1">
                <p className="text-sm font-medium">You have unsaved changes</p>
                <p className="text-xs text-muted-foreground">Press Ctrl+S or click Save to save your changes</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
                <Button 
                  variant={getSaveButtonVariant()}
                  size="sm" 
                  onClick={handleSave} 
                  disabled={saveStatus === 'saving' || !hasChanges}
                  className="min-w-[80px]"
                >
                  {saveStatus === 'saving' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {saveStatus !== 'saving' && <Save className="h-3 w-3 mr-1" />}
                  {getSaveButtonText()}
                </Button>
              </div>
            </div>
          )}

          {/* Content based on view mode */}
          {showDiff && hasChanges ? (
            <DiffView />
          ) : (
            <OptimizedMonacoEditor
              value={editedPrompt}
              onChange={(value) => setEditedPrompt(value || '')}
              language="markdown"
              height={isMobile ? "300px" : "450px"}
              placeholder="Enter system prompt..."
              className="border border-input rounded-md overflow-hidden"
            />
          )}
        </div>
      )}
    </>
  );

  // Shared header component
  const headerComponent = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className={`font-semibold truncate ${isMobile ? 'text-base' : 'text-lg'}`}>
            {category} System Prompt
          </h2>
          {promptData?.agentName && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              Agent: {promptData.agentName}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {realtimeUpdateReceived && (
            <Badge variant="secondary" className="animate-pulse">
              Updated
            </Badge>
          )}
          
          {/* Action buttons */}
          {hasChanges && (
            <Button
              variant={showDiff ? "default" : "outline"}
              size={isMobile ? "sm" : "icon"}
              onClick={() => setShowDiff(!showDiff)}
              title="Toggle diff view"
            >
              <GitCompare className="h-4 w-4" />
              {isMobile && <span className="ml-1">Diff</span>}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "icon"}
            onClick={handleRegeneratePrompt} 
            disabled={isRegenerating}
            title="Regenerate prompt"
          >
            <Sparkles className="h-4 w-4" />
            {isMobile && <span className="ml-1">Regenerate</span>}
          </Button>
          
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "icon"}
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
            {isMobile && <span className="ml-1">Close</span>}
          </Button>
        </div>
      </div>
      
      {/* Status row */}
      <div className="flex items-center justify-between mt-2">
        {promptData?.lastUpdated && (
          <p className="text-xs text-muted-foreground truncate">
            Last updated: {new Date(promptData.lastUpdated).toLocaleString()}
          </p>
        )}
        {isConnected && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        )}
      </div>
    </>
  );

  if (!isVisible) return null;

  // Mobile: Use Sheet
  if (isMobile) {
    return (
      <Sheet open={isVisible} onOpenChange={(open) => !open && onClose()}>
        <SheetContent 
          side="right" 
          className="w-full p-0 flex flex-col max-h-[100dvh]"
          hideClose={true}
        >
          <SheetHeader className="p-4 pb-3 border-b flex-shrink-0">
            {headerComponent}
          </SheetHeader>
          <div className="flex-1 p-4 pt-3 overflow-auto">
            {contentComponent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Card
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