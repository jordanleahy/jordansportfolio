import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Eye, Sparkles, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { OptimizedMonacoEditor } from '@/components/ui/optimized-monaco-editor';
import { useSystemPromptCache } from '@/hooks/useSystemPromptCache';
import { diffLines } from 'diff';

interface SystemPromptViewerOptimizedProps {
  category: string;
  isVisible: boolean;
  onClose: () => void;
}

export const SystemPromptViewerOptimized = ({
  category,
  isVisible,
  onClose
}: SystemPromptViewerOptimizedProps) => {
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [previousPrompt, setPreviousPrompt] = useState<string>('');
  
  // Use the optimized cache hook
  const {
    data: promptData,
    isLoading,
    updatePrompt,
    isUpdating,
    regeneratePrompt,
    isRegenerating,
    invalidateCache,
    prefetchPrompt
  } = useSystemPromptCache(category);

  // Update local state when data changes
  useEffect(() => {
    if (promptData) {
      setEditedPrompt(promptData.prompt);
      if (!previousPrompt) {
        setPreviousPrompt(promptData.prompt);
      }
      console.log(`✅ [SystemPromptViewerOptimized] Updated prompt data for ${category}`);
    }
  }, [promptData, category, previousPrompt]);

  // Prefetch on mount for better performance
  useEffect(() => {
    if (isVisible && category) {
      prefetchPrompt();
    }
  }, [isVisible, category, prefetchPrompt]);

  const handleSave = useCallback(async () => {
    if (!editedPrompt || editedPrompt === promptData?.prompt) return;
    
    try {
      setPreviousPrompt(promptData?.prompt || '');
      await updatePrompt({ newPrompt: editedPrompt });
      setIsEditing(false);
      toast.success('System prompt updated successfully');
    } catch (error) {
      console.error('Error saving system prompt:', error);
      toast.error('Failed to save system prompt');
    }
  }, [editedPrompt, promptData?.prompt, updatePrompt]);

  const handleCancel = useCallback(() => {
    setEditedPrompt(promptData?.prompt || '');
    setIsEditing(false);
  }, [promptData?.prompt]);

  const handleManualRefresh = useCallback(async () => {
    if (!category || !promptData?.prompt) return;
    
    console.log('🔄 [SystemPromptViewerOptimized] Manual refresh triggered');
    setPreviousPrompt(promptData.prompt);
    await invalidateCache();
    toast.success('System prompt refreshed');
  }, [category, promptData?.prompt, invalidateCache]);

  const handleRegeneratePrompt = useCallback(async () => {
    if (!category) return;
    
    try {
      setPreviousPrompt(promptData?.prompt || '');
      await regeneratePrompt();
      toast.success('System prompt regenerated successfully');
    } catch (error) {
      console.error('Error regenerating system prompt:', error);
      toast.error('Failed to regenerate system prompt');
    }
  }, [category, promptData?.prompt, regeneratePrompt]);

  // Memoized diff rendering for performance
  const renderedPrompt = useMemo(() => {
    const currentPrompt = promptData?.prompt;
    
    if (!currentPrompt) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground min-h-32">
          No system prompt found for this category
        </div>
      );
    }

    if (!previousPrompt || currentPrompt === previousPrompt) {
      return (
        <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed border rounded-md p-3 bg-muted/30 h-full">
          {currentPrompt}
        </div>
      );
    }

    // Generate unified diff
    const diff = diffLines(previousPrompt, currentPrompt);
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
  }, [promptData?.prompt, previousPrompt]);

  // Shared content component for both mobile and desktop
  const contentComponent = (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-full min-h-32">
          <div className="text-muted-foreground">Loading system prompt...</div>
        </div>
      ) : isEditing ? (
        <OptimizedMonacoEditor
          value={editedPrompt}
          onChange={(value) => setEditedPrompt(value || '')}
          language="markdown"
          height="400px"
          placeholder="Enter system prompt..."
          className="border border-input rounded-md overflow-hidden"
        />
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
          {promptData?.agentName && (
            <p className="text-sm text-muted-foreground mt-1">
              Agent: {promptData.agentName}
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
                onClick={handleSave} 
                disabled={isUpdating || editedPrompt === promptData?.prompt}
              >
                <Save className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {promptData?.prompt && (
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
      
      {promptData?.lastUpdated && (
        <p className="text-xs text-muted-foreground mt-2">
          Last updated: {new Date(promptData.lastUpdated).toLocaleString()}
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