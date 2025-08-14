import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedMonacoEditor } from '@/components/ui/optimized-monaco-editor';
import { Save, X, Edit, GitCompare, RotateCcw, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIndividualPromptCache } from '@/hooks/useIndividualPromptCache';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
import { diffLines } from 'diff';
import type { SocialMediaPost } from '@/types/socialMedia';

import type { IndividualPromptViewerProps } from '@/types/stories/ui';

export const IndividualPromptViewer: React.FC<IndividualPromptViewerProps> = ({
  post,
  isVisible,
  onClose,
  themeId
}) => {
  console.log('🎨 [IndividualPromptViewer] Component rendered', { 
    isVisible, 
    postId: post?.id, 
    postTitle: post?.title,
    themeId,
    hasGeneratedPrompt: !!post?.generated_image_prompt,
    generatedPromptLength: post?.generated_image_prompt?.length || 0
  });

  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isProcessing } = useProcessingStatesContext();
  
  const {
    data: promptData,
    isLoading,
    updatePrompt,
    isUpdating,
    regeneratePrompt,
    isRegenerating,
    refetch
  } = useIndividualPromptCache(post?.id || '', themeId);

  console.log('🎨 [IndividualPromptViewer] Hook data received', {
    postId: post?.id,
    promptData,
    isLoading,
    isUpdating,
    isRegenerating,
    hasPromptData: !!promptData,
    promptLength: promptData?.prompt?.length || 0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [localPrompt, setLocalPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  // Update local state when prompt data changes
  useEffect(() => {
    if (promptData?.prompt) {
      setLocalPrompt(promptData.prompt);
      setOriginalPrompt(promptData.prompt);
    } else {
      setLocalPrompt('');
      setOriginalPrompt('');
    }
  }, [promptData]);

  // Reset editing state when post changes
  useEffect(() => {
    if (post) {
      setIsEditing(false);
      setShowDiff(false);
    }
  }, [post?.id]);

  // Auto-close when regeneration starts
  useEffect(() => {
    if (post && isVisible && isProcessing(post.id, 'generate')) {
      console.log('🎨 [IndividualPromptViewer] Auto-closing due to regeneration', { postId: post.id });
      onClose();
    }
  }, [post, isVisible, isProcessing, onClose]);

  const hasChanges = useMemo(() => {
    return localPrompt.trim() !== originalPrompt.trim();
  }, [localPrompt, originalPrompt]);

  const diffResult = useMemo(() => {
    if (!hasChanges || !originalPrompt) return null;
    return diffLines(originalPrompt, localPrompt);
  }, [localPrompt, originalPrompt, hasChanges]);

  const handleSave = useCallback(async () => {
    if (!hasChanges || !post) return;
    
    try {
      await updatePrompt({ newPrompt: localPrompt.trim() });
      setOriginalPrompt(localPrompt.trim());
      setIsEditing(false);
      setShowDiff(false);
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  }, [hasChanges, localPrompt, updatePrompt, post]);

  const handleCancel = useCallback(() => {
    setLocalPrompt(originalPrompt);
    setIsEditing(false);
    setShowDiff(false);
  }, [originalPrompt]);

  const handleRegeneratePrompt = useCallback(async () => {
    if (!post) {
      console.error('❌ Missing post for regeneration');
      toast({
        title: "Error",
        description: "Post data not available for regeneration",
        variant: "destructive",
      });
      return;
    }
    
    if (!themeId) {
      console.error('❌ Missing themeId for regeneration');
      toast({
        title: "Error", 
        description: "Theme information not available. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('✅ Starting regeneration with:', {
        postId: post.id,
        themeId: themeId
      });
      
      await regeneratePrompt({});
      setIsEditing(false);
      setShowDiff(false);
      
      console.log('✅ Regeneration completed successfully');
    } catch (error) {
      console.error('❌ Failed to regenerate prompt:', error);
    }
  }, [post, themeId, regeneratePrompt, toast]);

  if (!post) return null;

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
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : part.removed
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 line-through'
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

  const contentComponent = (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading prompt...</div>
        </div>
      ) : !promptData && !isEditing ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            No image prompt generated yet for this post.
          </div>
          <Button
            onClick={() => {
              console.log('🎨 [IndividualPromptViewer] Generate Initial Prompt clicked', { 
                postId: post?.id, 
                themeId 
              });
              handleRegeneratePrompt();
            }}
            disabled={isRegenerating}
            variant="outline"
            size="sm"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Generate Initial Prompt
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
          placeholder="Enter your image prompt here..."
          className="border rounded-md"
        />
      )}
    </div>
  );

  const headerComponent = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-lg truncate">
            {post.title}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {post.description}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {isEditing ? (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isUpdating}
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isUpdating}
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
              onClick={handleRegeneratePrompt}
              disabled={isRegenerating}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {isRegenerating ? 'Generating...' : 'Regenerate'}
            </Button>
          </>
        )}
        
        {promptData && (
          <Badge variant="secondary" className="text-xs">
            Updated: {new Date(promptData.lastUpdated).toLocaleDateString()}
          </Badge>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isVisible} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Individual Image Prompt</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {headerComponent}
            {contentComponent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!isVisible) return null;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Individual Image Prompt</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {headerComponent}
      </CardHeader>
      <CardContent>
        {contentComponent}
      </CardContent>
    </Card>
  );
};