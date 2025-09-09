import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { useOptimizedPromptGeneration } from '@/hooks/useOptimizedPromptGeneration';
import { useThemePromptProcessor } from '@/hooks/useThemePromptProcessor';
import { usePromptConsistencyAnalysis } from '@/hooks/usePromptConsistencyAnalysis';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Zap, Sparkles } from 'lucide-react';

interface OptimizedPromptGeneratorProps {
  themeId: string;
  posts: Array<{
    id: string;
    title: string;
    generated_image_prompt?: string;
  }>;
}

export const OptimizedPromptGenerator = ({ themeId, posts }: OptimizedPromptGeneratorProps) => {
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const { metrics, generateBatch, isGenerating } = useOptimizedPromptGeneration();
  const { processThemePrompts, getThemeStatus } = useThemePromptProcessor();
  const { cleanPrompts, isCleaning } = usePromptConsistencyAnalysis();
  
  const status = getThemeStatus(themeId);
  const postsWithoutPrompts = posts.filter(post => !post.generated_image_prompt);
  
  const handleGenerateSelected = async () => {
    if (postsWithoutPrompts.length === 0) return;
    
    const requests = postsWithoutPrompts.slice(0, 5).map(post => ({
      postId: post.id,
      themeId,
      aspectRatio
    }));
    
    try {
      await generateBatch(requests);
    } catch (error) {
      console.error('Batch generation failed:', error);
    }
  };

  const handleProcessEntireTheme = async () => {
    await processThemePrompts(themeId, {
      aspectRatio,
      batchSize: 8 // Optimal batch size for performance
    });
  };

  const handleCleanPrompts = async () => {
    await cleanPrompts(themeId);
    // Refresh the page to show cleaned prompts
    window.location.reload();
  };

  const getStatusIcon = () => {
    if (!status) return <Clock className="h-4 w-4" />;
    
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getProgress = () => {
    if (!status || status.totalPosts === 0) return 0;
    return (status.completed / status.totalPosts) * 100;
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Optimized Prompt Generation
        </h3>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <Badge variant={status?.status === 'completed' ? 'default' : 'secondary'}>
            {posts.length - postsWithoutPrompts.length} / {posts.length} Ready
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      {status && status.status === 'processing' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing...</span>
            <span>{status.completed} / {status.totalPosts}</span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>
      )}

      {/* Aspect Ratio Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Aspect Ratio</label>
        <div className="flex gap-2">
          {['1:1', '16:9', '9:16', '4:3'].map((ratio) => (
            <Button
              key={ratio}
              variant={aspectRatio === ratio ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAspectRatio(ratio)}
            >
              {ratio}
            </Button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handleGenerateSelected}
          disabled={isGenerating || postsWithoutPrompts.length === 0}
          size="sm"
        >
          Generate Next 5 ({postsWithoutPrompts.length} remaining)
        </Button>
        
        <Button
          onClick={handleProcessEntireTheme}
          disabled={isGenerating || status?.status === 'processing'}
          variant="outline"
          size="sm"
        >
          Process Entire Theme
        </Button>

        <Button
          onClick={handleCleanPrompts}
          disabled={isCleaning || isGenerating}
          variant="secondary"
          size="sm"
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {isCleaning ? 'Cleaning...' : 'Clean Prompts'}
        </Button>
      </div>

      {/* Performance Metrics */}
      {metrics.totalRequests > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t text-sm">
          <div className="text-center">
            <div className="font-semibold">{metrics.cacheHits}</div>
            <div className="text-muted-foreground">Cache Hits</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{Math.round(metrics.averageTime)}ms</div>
            <div className="text-muted-foreground">Avg Time</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{metrics.batchSize}</div>
            <div className="text-muted-foreground">Last Batch</div>
          </div>
        </div>
      )}
    </Card>
  );
};