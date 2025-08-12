import React, { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Upload, Loader2, Copy } from 'lucide-react';
import { useStreamlinedThemeImport } from '@/hooks/useStreamlinedThemeImport';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from '@/hooks/useDebounce';
import type { ThemeImportModalOptimizedProps } from '@/types/stories/ui';
export const ThemeImportModalOptimized: React.FC<ThemeImportModalOptimizedProps> = ({
  open,
  onOpenChange,
  onImportComplete,
  onOptimisticStart,
  onOptimisticComplete
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Debounce input to prevent rapid submissions
  const debouncedJsonInput = useDebounce(jsonInput, 300);

  // Streamlined import with improved feedback
  const {
    submitRawData,
    isProcessing: isStreamlinedProcessing
  } = useStreamlinedThemeImport({
    onImportComplete: () => {
      setShowSuccessMessage(true);
      onImportComplete?.();
      // Trigger shimmer in parent component
      onOptimisticStart?.(jsonInput ? JSON.parse(jsonInput).category || 'New Theme' : 'New Theme');
      
      // Auto-close modal after showing success message
      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowErrorMessage(null);
        onOpenChange(false);
        setJsonInput('');
      }, 2000);
    },
    onOptimisticStart: categoryName => {
      setShowSuccessMessage(false);
      setShowErrorMessage(null);
      onOptimisticStart?.(categoryName);
    },
    onOptimisticComplete: (success, categoryName) => {
      if (!success) {
        setShowErrorMessage('Import failed. Please check your data and try again.');
      }
      onOptimisticComplete?.(success, categoryName);
    }
  });

  const handleStreamlinedSubmit = useCallback(() => {
    if (!debouncedJsonInput.trim()) return;
    
    // Prevent rapid successive submissions
    const now = Date.now();
    if (now - lastSubmitTime < 2000) {
      toast({
        title: "Please wait",
        description: "Please wait a moment before submitting again",
        variant: "destructive"
      });
      return;
    }
    
    setLastSubmitTime(now);
    setShowSuccessMessage(false);
    setShowErrorMessage(null);
    submitRawData(debouncedJsonInput);
  }, [debouncedJsonInput, submitRawData, lastSubmitTime, toast]);
  const handleCopyInstructions = useCallback(async () => {
    const instructions = `Please format your response as a JSON object with the following structure:

{
  "category": "string (1-100 characters, optional)",
  "theme": "string (1-200 characters, required)", 
  "theme_description": "string (max 1000 characters, optional)",
  "posts": [
    {
      "day": number (1-365, optional),
      "title": "string (1-500 characters, required)",
      "story_description": "string (1-2000 characters, required)",
      "status": "draft" | "scheduled" | "published" (default: "draft")
    }
  ]
}

REQUIREMENTS:
- Category: Brief category name (optional - defaults to "general" if not provided)
- Theme: Descriptive theme title
- Posts: Array of 1-100 posts maximum
- Day: Optional numbering for sequence (1-365)
- Status: Must be exactly "draft", "scheduled", or "published"
- All strings must be non-empty and within character limits

EXAMPLE:
{
  "category": "healthcare innovation",
  "theme": "AI in Healthcare",
  "theme_description": "Weekly posts about AI applications in healthcare",
  "posts": [
    {
      "day": 1,
      "title": "AI Diagnostics Revolution", 
      "story_description": "How artificial intelligence is transforming medical diagnostics and improving patient outcomes.",
      "status": "draft"
    },
    {
      "day": 2,
      "title": "Machine Learning in Drug Discovery",
      "story_description": "Exploring how ML algorithms accelerate pharmaceutical research and development.",
      "status": "draft"
    }
  ]
}

AVOID:
- Invalid JSON syntax (missing quotes, commas, brackets)
- Empty strings for required fields
- Exceeding character limits
- Invalid status values
- More than 100 posts`;
    try {
      await navigator.clipboard.writeText(instructions);
      toast({
        title: "Instructions copied",
        description: "JSON formatting instructions copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Example data for placeholder
  const exampleData = useMemo(() => ({
    category: "healthcare innovation",
    theme: "Healthcare Technology",
    theme_description: "Posts about healthcare technology trends",
    posts: [{
      day: 1,
      title: "AI in Healthcare: The Future is Now",
      story_description: "Artificial Intelligence is revolutionizing healthcare delivery, from diagnostic imaging to treatment planning.",
      status: "draft"
    }, {
      day: 2,
      title: "Telemedicine Best Practices",
      story_description: "Telemedicine has become essential for modern healthcare delivery.",
      status: "draft"
    }]
  }), []);
  const placeholderText = `Paste your JSON data here or use this example:\n\n${JSON.stringify(exampleData, null, 2)}`;
  const handleClose = useCallback(() => {
    // Prevent closing while processing
    if (isStreamlinedProcessing) {
      toast({
        title: "Processing in progress",
        description: "Please wait for the import to complete",
      });
      return;
    }
    setShowSuccessMessage(false);
    setShowErrorMessage(null);
    onOpenChange(false);
  }, [onOpenChange, isStreamlinedProcessing, toast]);
  
  const handleReset = useCallback(() => {
    setJsonInput('');
    setShowSuccessMessage(false);
    setShowErrorMessage(null);
  }, []);
  return <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Theme Data</DialogTitle>
          <DialogDescription>
            Paste your JSON theme data below and click Submit to import it with AI processing and validation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Processing Status */}
          {isStreamlinedProcessing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Processing your theme data...</span>
                  <div className="text-sm text-muted-foreground">This may take a few moments</div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {showSuccessMessage && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Success!</strong> Your theme has been imported successfully. The modal will close automatically.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {showErrorMessage && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Import Failed:</strong> {showErrorMessage}
              </AlertDescription>
            </Alert>
          )}


          {/* JSON Input */}
          <div>
            <Textarea 
              id="json-input" 
              value={jsonInput} 
              onChange={e => setJsonInput(e.target.value)} 
              placeholder={placeholderText} 
              readOnly={isStreamlinedProcessing} 
              rows={16} 
              className="font-mono text-sm resize-none min-h-[400px] leading-relaxed" 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {/* Streamlined One-Click Submit */}
            <Button 
              onClick={handleStreamlinedSubmit} 
              disabled={
                isStreamlinedProcessing || 
                !debouncedJsonInput.trim() ||
                showSuccessMessage ||
                (Date.now() - lastSubmitTime < 2000)
              } 
              className="bg-primary text-primary-foreground hover:bg-primary/90" 
              size="lg"
            >
              {isStreamlinedProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isStreamlinedProcessing ? 'Processing...' : 'Submit'}
            </Button>

            <Button 
              onClick={handleReset} 
              disabled={isStreamlinedProcessing} 
              variant="ghost" 
              size="sm"
            >
              Reset
            </Button>

            <Button 
              onClick={handleCopyInstructions} 
              disabled={isStreamlinedProcessing}
              variant="outline" 
              size="sm"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy Instructions
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>;
};

export default ThemeImportModalOptimized;