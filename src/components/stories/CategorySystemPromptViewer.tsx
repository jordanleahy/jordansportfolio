import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedMonacoEditor } from '@/components/ui/optimized-monaco-editor';
import { Save, Edit, GitCompare, RotateCcw, Lightbulb, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { diffLines } from 'diff';
import { ColorThemeSelector } from './ColorThemeSelector';
import { useColorThemes } from '@/hooks/useColorThemes';

interface CategorySystemPromptViewerProps {
  category: string;
  themeId?: string;
  selectedThemeId?: string;
  onThemeChange?: (themeId: string) => void;
}

interface SystemPromptData {
  id: string;
  prompt_text: string;
  updated_at: string;
  theme_id: string;
}

export const CategorySystemPromptViewer: React.FC<CategorySystemPromptViewerProps> = ({
  category,
  themeId,
  selectedThemeId,
  onThemeChange
}) => {
  const { toast } = useToast();
  const colorThemesQuery = useColorThemes();
  const colorThemes = colorThemesQuery.data || [];
  
  const [promptData, setPromptData] = useState<SystemPromptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [localPrompt, setLocalPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Fetch system prompt data
  const fetchSystemPrompt = useCallback(async () => {
    if (!themeId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('theme_system_prompts')
        .select('id, prompt_text, updated_at, theme_id')
        .eq('theme_id', themeId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching system prompt:', error);
        setPromptData(null);
      } else if (data) {
        setPromptData(data);
        setLocalPrompt(data.prompt_text || '');
        setOriginalPrompt(data.prompt_text || '');
      } else {
        setPromptData(null);
        setLocalPrompt('');
        setOriginalPrompt('');
      }
    } catch (error) {
      console.error('Error fetching system prompt:', error);
      setPromptData(null);
    } finally {
      setIsLoading(false);
    }
  }, [themeId]);

  useEffect(() => {
    fetchSystemPrompt();
  }, [fetchSystemPrompt]);

  const hasChanges = useMemo(() => {
    return localPrompt.trim() !== originalPrompt.trim();
  }, [localPrompt, originalPrompt]);

  const diffResult = useMemo(() => {
    if (!hasChanges || !originalPrompt) return null;
    return diffLines(originalPrompt, localPrompt);
  }, [localPrompt, originalPrompt, hasChanges]);

  const handleSave = useCallback(async () => {
    if (!hasChanges || !themeId) return;
    
    setIsSaving(true);
    try {
      if (promptData) {
        // Update existing prompt
        const { error } = await supabase
          .from('theme_system_prompts')
          .update({ prompt_text: localPrompt.trim() })
          .eq('id', promptData.id);

        if (error) throw error;
      } else {
        // Create new prompt - this would need proper agent_id setup
        // For now, just show an info message
        toast({
          title: "Info",
          description: "System prompt creation requires proper setup. Use 'Generate' button instead.",
          variant: "destructive",
        });
        return;
      }

      setOriginalPrompt(localPrompt.trim());
      setIsEditing(false);
      setShowDiff(false);
      await fetchSystemPrompt(); // Refresh data
      
      toast({
        title: "Success",
        description: "System prompt saved successfully",
      });
    } catch (error) {
      console.error('Failed to save system prompt:', error);
      toast({
        title: "Error",
        description: "Failed to save system prompt",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, localPrompt, promptData, themeId, category, fetchSystemPrompt, toast]);

  const handleCancel = useCallback(() => {
    setLocalPrompt(originalPrompt);
    setIsEditing(false);
    setShowDiff(false);
  }, [originalPrompt]);

  const handleGeneratePreview = useCallback(async () => {
    if (!themeId) return;
    
    setIsGeneratingPreview(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-abc-illustrations', {
        body: {
          themeId: themeId,
          samplePost: {
            title: 'Ask',
            description: 'Sample ABC illustration for asking politely'
          },
          aspectRatio: '1:1',
          preview: true
        }
      });

      if (error) throw error;
      
      toast({
        title: "Preview Generated",
        description: "Check the sample prompt in the response",
      });
      
      console.log('Preview result:', data);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast({
        title: "Error",
        description: "Failed to generate preview",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [themeId, toast]);

  const handleRegenerateSystemPrompt = useCallback(async () => {
    if (!themeId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('create-theme-system-prompt', {
        body: {
          themeId: themeId,
          category: category,
          regenerate: true
        }
      });

      if (error) throw error;
      
      await fetchSystemPrompt();
      setIsEditing(false);
      setShowDiff(false);
      
      toast({
        title: "Success",
        description: "System prompt regenerated successfully",
      });
    } catch (error) {
      console.error('Failed to regenerate system prompt:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate system prompt",
        variant: "destructive",
      });
    }
  }, [themeId, category, fetchSystemPrompt, toast]);

  const DiffView = () => {
    if (!diffResult) return null;

    return (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <div className="text-sm text-muted-foreground mb-2">
          Changes preview:
        </div>
        <pre className="text-sm whitespace-pre-wrap">
          {diffResult.map((part, index) => (
            <span
              key={index}
              className={
                part.added
                  ? 'bg-success/10 text-success dark:bg-success/20'
                  : part.removed
                  ? 'bg-destructive/10 text-destructive dark:bg-destructive/20 line-through'
                  : 'text-muted-foreground'
              }
            >
              {part.value}
            </span>
          ))}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          System prompt for <strong>{category}</strong> theme
        </div>
        
        {/* Color Theme Selector */}
        <ColorThemeSelector
          themes={colorThemes}
          selectedThemeId={selectedThemeId}
          onThemeChange={onThemeChange}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {isEditing ? (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            {hasChanges && (
              <Button
                variant={showDiff ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDiff(!showDiff)}
              >
                <GitCompare className="h-4 w-4 mr-2" />
                {showDiff ? 'Hide' : 'Show'} Changes
              </Button>
            )}
          </>
        ) : (
          <>
            {promptData && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateSystemPrompt}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {promptData ? 'Regenerate' : 'Generate'} Prompt
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePreview}
              disabled={isGeneratingPreview || !promptData}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isGeneratingPreview ? 'Testing...' : 'Test Preview'}
            </Button>
          </>
        )}
        
        {promptData && (
          <Badge variant="secondary" className="text-xs ml-auto">
            Updated: {new Date(promptData.updated_at).toLocaleDateString()}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading system prompt...</div>
          </div>
        ) : !promptData && !isEditing ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              No system prompt found for this theme.
            </div>
            <Button
              onClick={handleRegenerateSystemPrompt}
              variant="outline"
              size="sm"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Generate System Prompt
            </Button>
          </div>
        ) : showDiff ? (
          <DiffView />
        ) : (
          <OptimizedMonacoEditor
            value={localPrompt}
            onChange={(value) => setLocalPrompt(value || '')}
            language="plaintext"
            height="400px"
            readOnly={!isEditing}
            placeholder="Enter your system prompt here..."
            className="border rounded-md"
          />
        )}
      </div>
    </div>
  );
};