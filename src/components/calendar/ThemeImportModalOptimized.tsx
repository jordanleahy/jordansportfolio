import React, { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, Upload, Loader2, Copy } from 'lucide-react';
import { useThemeImport } from '@/hooks/useThemeImport';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { OptimizedMonacoEditor } from '@/components/ui/optimized-monaco-editor';
import { useIsMobile } from '@/hooks/use-mobile';
import { Textarea } from '@/components/ui/textarea';

interface ThemeImportModalOptimizedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export const ThemeImportModalOptimized: React.FC<ThemeImportModalOptimizedProps> = ({
  open,
  onOpenChange,
  onImportComplete
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const {
    state,
    progress,
    validationResult,
    isProcessing,
    canImport,
    hasErrors,
    hasWarnings,
    validateInput,
    processWithAI,
    importData,
    reset
  } = useThemeImport({
    onImportComplete: () => {
      onImportComplete?.();
      onOpenChange(false);
      handleReset();
    }
  });

  // Debounced validation
  const debouncedInput = useDebounce(jsonInput, 500);
  
  // Auto-validate on input change
  React.useEffect(() => {
    if (debouncedInput.trim() && state.type === 'idle') {
      try {
        validateInput(debouncedInput);
      } catch {
        // Ignore validation errors during typing
      }
    }
  }, [debouncedInput, state.type, validateInput]);

  const handleProcess = useCallback(() => {
    if (!jsonInput.trim()) return;
    processWithAI(jsonInput);
  }, [jsonInput, processWithAI]);

  const handleImport = useCallback(() => {
    importData();
  }, [importData]);

  const handleReset = useCallback(() => {
    setJsonInput('');
    reset();
  }, [reset]);

  const handleCopyInstructions = useCallback(async () => {
    const instructions = `Please format your response as a JSON object with the following structure:

{
  "category": "string (1-100 characters, required)",
  "theme": "string (1-200 characters, required)", 
  "description": "string (max 1000 characters, optional)",
  "posts": [
    {
      "day": number (1-365, optional),
      "title": "string (1-500 characters, required)",
      "description": "string (1-2000 characters, required)",
      "status": "draft" | "scheduled" | "published" (default: "draft")
    }
  ]
}

REQUIREMENTS:
- Category: Brief category name (e.g., "healthcare", "technology")
- Theme: Descriptive theme title
- Posts: Array of 1-100 posts maximum
- Day: Optional numbering for sequence (1-365)
- Status: Must be exactly "draft", "scheduled", or "published"
- All strings must be non-empty and within character limits

EXAMPLE:
{
  "category": "healthcare innovation",
  "theme": "AI in Healthcare",
  "description": "Weekly posts about AI applications in healthcare",
  "posts": [
    {
      "day": 1,
      "title": "AI Diagnostics Revolution", 
      "description": "How artificial intelligence is transforming medical diagnostics and improving patient outcomes.",
      "status": "draft"
    },
    {
      "day": 2,
      "title": "Machine Learning in Drug Discovery",
      "description": "Exploring how ML algorithms accelerate pharmaceutical research and development.",
      "status": "draft"
    }
  ]
}

AVOID:
- Invalid JSON syntax (missing quotes, commas, brackets)
- Empty strings for required fields
- Exceeding character limits
- Invalid status values
- More than 100 posts
- Missing required fields`;

    try {
      await navigator.clipboard.writeText(instructions);
      toast({
        title: "Instructions copied",
        description: "JSON formatting instructions copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Example data for placeholder
  const exampleData = useMemo(() => ({
    category: "healthcare innovation",
    theme: "Healthcare Technology",
    description: "Posts about healthcare technology trends",
    posts: [
      {
        day: 1,
        title: "AI in Healthcare: The Future is Now",
        description: "Artificial Intelligence is revolutionizing healthcare delivery, from diagnostic imaging to treatment planning.",
        status: "draft"
      },
      {
        day: 2,
        title: "Telemedicine Best Practices",
        description: "Telemedicine has become essential for modern healthcare delivery.",
        status: "draft"
      }
    ]
  }), []);

  const placeholderText = `Paste your JSON data here or use this example:\n\n${JSON.stringify(exampleData, null, 2)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Theme Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress indicator */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{progress.message}</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="w-full" />
            </div>
          )}

          {/* JSON Input */}
          <div>
            <Label htmlFor="json-input">JSON Data</Label>
            {isMobile ? (
              <Textarea
                id="json-input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={placeholderText}
                readOnly={isProcessing}
                rows={12}
                className="font-mono text-sm resize-none"
              />
            ) : (
              <div className="border border-input rounded-md overflow-hidden">
                <OptimizedMonacoEditor
                  height="300px"
                  language="json"
                  value={jsonInput}
                  onChange={(value) => setJsonInput(value || '')}
                  placeholder={placeholderText}
                  readOnly={isProcessing}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleProcess}
              disabled={isProcessing || !jsonInput.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing && state.type === 'processing' && state.step === 'ai' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Process & Validate
            </Button>
            
            <Button
              onClick={handleImport}
              disabled={isProcessing || !canImport}
              className="bg-primary"
            >
              {isProcessing && state.type === 'processing' && state.step === 'import' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Import Data
            </Button>

            <Button
              onClick={handleReset}
              disabled={isProcessing}
              variant="ghost"
            >
              Reset
            </Button>

            <Button
              onClick={handleCopyInstructions}
              variant="outline"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy JSON Prompt Instructions
            </Button>
          </div>

          {/* Results Display */}
          {validationResult && (
            <div className="space-y-4">
              <Separator />
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Processing Results</h3>
                
                <div className="flex items-center gap-2">
                  {validationResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={validationResult.success ? "text-green-700" : "text-red-700"}>
                    {validationResult.success ? "Ready for import" : "Processing failed"}
                  </span>
                </div>

                {/* Errors */}
                {hasErrors && validationResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Errors:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {validationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Warnings */}
                {hasWarnings && validationResult.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warnings:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Fixes */}
                {validationResult.fixes && validationResult.fixes.length > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Applied Fixes:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {validationResult.fixes.map((fix, index) => (
                          <li key={index}>{fix}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Data Preview */}
                {validationResult.data && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Preview:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Category:</span> 
                        <Badge variant="outline" className="ml-2">
                          {validationResult.data.category}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Theme:</span> 
                        <Badge variant="outline" className="ml-2">
                          {validationResult.data.theme}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Posts:</span> {validationResult.data.posts.length}
                      </div>
                    </div>
                    
                    {validationResult.data.posts.slice(0, 3).map((post, index) => (
                      <div key={index} className="border rounded p-3 text-sm">
                        <div className="font-medium">{post.title}</div>
                        <div className="text-muted-foreground mt-1 line-clamp-2">
                          {post.description}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {post.day && <Badge variant="secondary">Day {post.day}</Badge>}
                          <Badge variant="outline">{post.status}</Badge>
                        </div>
                      </div>
                    ))}
                    
                    {validationResult.data.posts.length > 3 && (
                      <div className="text-center text-muted-foreground">
                        ... and {validationResult.data.posts.length - 3} more posts
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};