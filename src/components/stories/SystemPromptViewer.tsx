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
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import { useAuth } from '@/contexts/AuthContext';
import { diffLines } from 'diff';
import { stripMarkdownFormatting } from '@/utils/markdownUtils';
import { ThemeAwareColorText } from '@/components/ui/theme-aware-color-text';
import { useCurrentColorTheme } from '@/hooks/useCurrentColorTheme';
import { ColorThemeSelector } from './ColorThemeSelector';
import { ColorThemeManager } from './ColorThemeManager';
import { ColorTheme } from '@/types/colorTheme';
import { updateTextWithNewTheme } from '@/utils/colorThemeUtils';
import type { SystemPromptViewerProps } from '@/types/stories/ui';

export const SystemPromptViewer = ({
  theme,
  themeId,
  isVisible,
  onClose,
  selectedThemeId,
  themes = [],
  onThemeChange
}: SystemPromptViewerProps) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [showDiff, setShowDiff] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [previousPrompt, setPreviousPrompt] = useState<string>('');
  const [realtimeUpdateReceived, setRealtimeUpdateReceived] = useState(false);
  const [previousTheme, setPreviousTheme] = useState<ColorTheme | null>(null);
  const [showColorThemeManager, setShowColorThemeManager] = useState(false);
  
  const { currentTheme } = useCurrentColorTheme({ selectedThemeId });
  
  // Use the optimized cache hook
  const {
    data: promptData,
    isLoading,
    updatePrompt,
    isUpdating,
    regeneratePrompt,
    isRegenerating,
    invalidateCache
  } = useSystemPromptCache(themeId);

  // Use realtime system prompts
  const { isConnected } = useUnifiedRealtime({
    enabled: isVisible,
    userId: user?.id,
    onSystemPromptUpdate: (data) => {
      if (data.theme === theme) {
        setRealtimeUpdateReceived(true);
        // Show update indicator briefly
        setTimeout(() => setRealtimeUpdateReceived(false), 3000);
        // Invalidate cache to refresh the prompt
        invalidateCache();
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

  // Handle theme changes and update hex codes in editor content
  useEffect(() => {
    if (currentTheme && previousTheme && currentTheme.id !== previousTheme.id && editedPrompt) {
      const updatedText = updateTextWithNewTheme(editedPrompt, previousTheme, currentTheme);
      if (updatedText !== editedPrompt) {
        setEditedPrompt(updatedText);
      }
    }
    if (currentTheme) {
      setPreviousTheme(currentTheme);
    }
  }, [currentTheme, previousTheme, editedPrompt]);

  const handleSave = useCallback(async () => {
    if (!editedPrompt || editedPrompt === promptData?.prompt) return;
    
    try {
      setPreviousPrompt(promptData?.prompt || '');
      await updatePrompt({ newPrompt: editedPrompt });
      toast.success('System prompt updated successfully');
    } catch (error) {
      console.error('Error saving system prompt:', error);
      toast.error('Failed to save system prompt');
    }
  }, [editedPrompt, promptData?.prompt, updatePrompt]);

  const handleCancel = useCallback(() => {
    setEditedPrompt(promptData?.prompt || '');
    setShowDiff(false);
  }, [promptData?.prompt]);

  const handleRegeneratePrompt = useCallback(async () => {
    console.log('🔄 Regenerate button clicked - Debug info:', { theme, themeId });
    if (!theme && !themeId) {
      console.error('❌ Cannot regenerate: missing theme', { theme, themeId });
      toast.error('Cannot regenerate: missing theme information');
      return;
    }
    
    try {
      console.log('🚀 Starting regeneration...');
      setPreviousPrompt(promptData?.prompt || '');
      const result = await regeneratePrompt();
      console.log('✅ Regeneration successful:', result);
      toast.success('System prompt regenerated successfully');
    } catch (error) {
      console.error('❌ Error regenerating system prompt:', error);
      toast.error('Failed to regenerate system prompt');
    }
  }, [theme, themeId, promptData?.prompt, regeneratePrompt]);


  // Compute diff when in diff view mode
  const diffResult = useMemo(() => {
    if (!showDiff || !previousPrompt || !editedPrompt) return null;
    return diffLines(previousPrompt, editedPrompt);
  }, [showDiff, previousPrompt, editedPrompt]);

  const hasChanges = useMemo(() => {
    return editedPrompt !== promptData?.prompt;
  }, [editedPrompt, promptData?.prompt]);

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

  // Shared content component - always show editor
  const contentComponent = (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-full min-h-32">
          <div className="text-muted-foreground">Loading system prompt...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Content based on view mode */}
          {showDiff && hasChanges ? (
            <DiffView />
          ) : (
            <OptimizedMonacoEditor
              value={editedPrompt}
              onChange={(value) => setEditedPrompt(value || '')}
              language="markdown"
              height={isMobile ? "250px" : "400px"}
              placeholder="Enter system prompt..."
              className="border border-input rounded-md overflow-hidden"
            />
          )}
        </div>
      )}
    </>
  );

  // Shared header component - always show editor with persistent save button
  const headerComponent = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {themes.length > 0 && onThemeChange && (
            <ColorThemeSelector
              themes={themes}
              selectedThemeId={selectedThemeId}
              onThemeChange={onThemeChange}
              showAddOption={true}
              onAddTheme={() => setShowColorThemeManager(true)}
              className="mb-2"
            />
          )}
        </div>
        
        {/* Mobile: Stack action buttons */}
        {isMobile ? (
          <div className="flex flex-col gap-1 ml-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-3 w-3" />
              </Button>
              <Button 
                variant={hasChanges ? "default" : "outline"} 
                size="sm" 
                onClick={handleSave} 
                disabled={isUpdating || !hasChanges}
                className="min-w-[60px]"
              >
                <Save className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={!showDiff ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDiff(false)}
                className="flex-1"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                variant={showDiff ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDiff(true)}
                className="flex-1"
              >
                <GitCompare className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {realtimeUpdateReceived && (
              <Badge variant="secondary" className="animate-pulse">
                Updated
              </Badge>
            )}
            
            {/* Desktop actions - always show persistent save button */}
            {isMobile && (
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
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
              variant="outline" 
              size="sm" 
              onClick={handleRegeneratePrompt} 
              disabled={isRegenerating}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button 
              variant={hasChanges ? "default" : "outline"} 
              size="sm" 
              onClick={handleSave}
              disabled={isUpdating || !hasChanges}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        )}
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
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0 pb-3">
          {headerComponent}
        </CardHeader>
        <CardContent className="flex-1">
          {contentComponent}
        </CardContent>
      </Card>
      
      <ColorThemeManager 
        isOpen={showColorThemeManager}
        onClose={() => setShowColorThemeManager(false)}
      />
    </>
  );
};