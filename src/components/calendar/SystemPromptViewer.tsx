import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Sparkles, GitCompare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { OptimizedMonacoEditor } from '@/components/ui/optimized-monaco-editor';
import { useSystemPromptCache } from '@/hooks/useSystemPromptCache';
import { useRealtimeSystemPrompts } from '@/hooks/realtime/useRealtimeSystemPrompts';
import { diffLines } from 'diff';
import { stripMarkdownFormatting } from '@/utils/markdownUtils';
import { ColorEnhancedText } from '@/components/ui/color-enhanced-text';

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
  const [isEditing, setIsEditing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [previousPrompt, setPreviousPrompt] = useState<string>('');
  const [realtimeUpdateReceived, setRealtimeUpdateReceived] = useState(false);
  
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
      if (!previousPrompt) {
        setPreviousPrompt(promptData.prompt);
      }
    }
  }, [promptData, previousPrompt]);

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
    setShowDiff(false);
  }, [promptData?.prompt]);

  const handleStartEditing = useCallback(() => {
    setPreviousPrompt(promptData?.prompt || '');
    setIsEditing(true);
    setShowDiff(false);
  }, [promptData?.prompt]);

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


  // Compute diff when in editing mode
  const diffResult = useMemo(() => {
    if (!isEditing || !previousPrompt || !editedPrompt) return null;
    return diffLines(previousPrompt, editedPrompt);
  }, [isEditing, previousPrompt, editedPrompt]);

  const hasChanges = useMemo(() => {
    return editedPrompt !== previousPrompt;
  }, [editedPrompt, previousPrompt]);

  // Diff component
  const DiffView = () => (
    <div className="max-h-[60vh] overflow-auto border rounded-md bg-muted/30">
      <div className="font-mono text-sm">
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

  // Shared content component
  const contentComponent = (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-full min-h-32">
          <div className="text-muted-foreground">Loading system prompt...</div>
        </div>
      ) : isEditing ? (
        <div className="space-y-4">
          {/* Content based on view mode */}
          {showDiff && hasChanges ? (
            <DiffView />
          ) : (
            <OptimizedMonacoEditor
              value={editedPrompt}
              onChange={(value) => setEditedPrompt(value || '')}
              language="markdown"
              height="400px"
              placeholder="Enter system prompt..."
              className="border border-input rounded-md overflow-hidden"
            />
          )}
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-auto">
          <div className="border rounded-md p-4 bg-muted/30 h-full">
            {promptData?.prompt ? (
              <ColorEnhancedText 
                text={stripMarkdownFormatting(promptData.prompt)} 
                className="text-sm leading-relaxed"
              />
            ) : (
              <div className="text-sm leading-relaxed">No system prompt found for this category</div>
            )}
          </div>
        </div>
      )}
    </>
  );

  // Shared header component
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
          {realtimeUpdateReceived && (
            <Badge variant="secondary" className="animate-pulse">
              Updated
            </Badge>
          )}
          {/* Close button - only show when not editing */}
          {(!isMobile || !isEditing) && !isEditing && (
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
                variant={!showDiff ? "default" : "outline"}
                size="icon"
                onClick={() => setShowDiff(false)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant={showDiff ? "default" : "outline"}
                size="icon"
                onClick={() => setShowDiff(true)}
              >
                <GitCompare className="h-4 w-4" />
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
                <Button variant="outline" size="sm" onClick={handleStartEditing}>
                  <Edit3 className="h-4 w-4" />
                </Button>
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
      
      <div className="flex items-center justify-between mt-2">
        {promptData?.lastUpdated && (
          <p className="text-xs text-muted-foreground">
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