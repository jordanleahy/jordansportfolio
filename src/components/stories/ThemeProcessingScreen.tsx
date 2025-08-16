import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ThemeProcessingScreenProps {
  themeName: string;
  completionProgress: number;
  hasSystemPrompt: boolean;
}

export const ThemeProcessingScreen = ({ 
  themeName, 
  completionProgress, 
  hasSystemPrompt 
}: ThemeProcessingScreenProps) => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-4 px-4">
      {/* Navigation Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/stories')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Processing Content */}
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-spin border-t-primary" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground">
            Processing "{themeName}"
          </h1>
          
          <p className="text-muted-foreground text-lg">
            We're generating optimized image prompts for your theme. This ensures the best quality results for your content.
          </p>
        </div>

        {/* Progress Section */}
        <div className="space-y-6 bg-card border rounded-lg p-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {!hasSystemPrompt 
                ? "Generating system prompt..." 
                : `Processing individual prompts... ${completionProgress}%`
              }
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completionProgress}%</span>
            </div>
            <Progress value={completionProgress} className="h-2" />
          </div>

          {/* Status Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              hasSystemPrompt ? 'bg-emerald-50 border-emerald-200' : 'bg-muted/50'
            }`}>
              <div className={`h-2 w-2 rounded-full ${
                hasSystemPrompt ? 'bg-emerald-500' : 'bg-muted-foreground'
              }`} />
              <div>
                <div className="font-medium text-sm">System Prompt</div>
                <div className="text-xs text-muted-foreground">
                  {hasSystemPrompt ? 'Completed' : 'Generating...'}
                </div>
              </div>
            </div>
            
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              completionProgress === 100 ? 'bg-emerald-50 border-emerald-200' : 'bg-muted/50'
            }`}>
              <div className={`h-2 w-2 rounded-full ${
                completionProgress === 100 ? 'bg-emerald-500' : 'bg-muted-foreground'
              }`} />
              <div>
                <div className="font-medium text-sm">Individual Prompts</div>
                <div className="text-xs text-muted-foreground">
                  {completionProgress === 100 ? 'Completed' : 'Processing...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            ⏱️ <strong>Estimated time:</strong> 2-5 minutes depending on theme complexity
          </p>
          <p>
            🔄 <strong>Real-time updates:</strong> This page will automatically refresh when processing is complete
          </p>
          <p>
            💡 <strong>Quality focus:</strong> We optimize each prompt individually for the best image generation results
          </p>
        </div>
      </div>
    </div>
  );
};