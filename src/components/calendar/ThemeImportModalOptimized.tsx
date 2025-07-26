import React, { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, Upload, Loader2 } from 'lucide-react';
import { useThemeImport } from '@/hooks/useThemeImport';
import { useDebounce } from '@/hooks/useDebounce';

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
            <Textarea
              id="json-input"
              placeholder={placeholderText}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              disabled={isProcessing}
            />
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