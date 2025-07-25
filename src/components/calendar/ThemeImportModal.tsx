import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, XCircle, Upload, Eye, Trash2 } from 'lucide-react';
import { themeImportService } from '@/services/themeImportService';
import type { ValidationResult, ProcessingResult } from '@/types/themeImport';
import { useToast } from '@/hooks/use-toast';

interface ThemeImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export const ThemeImportModal: React.FC<ThemeImportModalProps> = ({
  open,
  onOpenChange,
  onImportComplete
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handlePreview = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "No data to preview",
        description: "Please enter JSON data first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await themeImportService.previewImport(jsonInput);
      setValidation(result);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Preview failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!validation?.isValid) {
      toast({
        title: "Cannot import",
        description: "Please fix validation errors first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result: ProcessingResult = await themeImportService.importThemeData(jsonInput);
      
      if (result.success) {
        toast({
          title: "Import successful",
          description: `Imported ${result.insertedCount} posts successfully`,
        });
        onImportComplete?.();
        onOpenChange(false);
        handleReset();
      } else {
        toast({
          title: "Import failed",
          description: result.errors.join(', '),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCleanup = async () => {
    setIsProcessing(true);
    try {
      const result = await themeImportService.runCleanupAgent();
      
      if (result.errors.length === 0) {
        toast({
          title: "Cleanup completed",
          description: `Cleaned up ${result.cleaned} invalid posts`,
        });
      } else {
        toast({
          title: "Cleanup had issues",
          description: result.errors.join(', '),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Cleanup failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setJsonInput('');
    setValidation(null);
    setShowPreview(false);
  };

  const exampleData = {
    category: "healthcare-tech",
    theme: "Healthcare Technology",
    description: "Posts about healthcare technology trends",
    posts: [
      {
        day: 1,
        title: "AI in Healthcare: The Future is Now",
        description: "Artificial Intelligence is revolutionizing healthcare delivery, from diagnostic imaging to treatment planning. Modern AI systems can analyze medical images faster than radiologists, predict patient outcomes, and personalize treatment protocols.",
        status: "draft"
      },
      {
        day: 2,
        title: "Telemedicine Best Practices",
        description: "Telemedicine has become essential for modern healthcare delivery. Key best practices include ensuring secure communication, maintaining patient privacy, and providing clear virtual consultation guidelines.",
        status: "draft"
      }
    ]
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Theme Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="json-input">JSON Data</Label>
            <Textarea
              id="json-input"
              placeholder={`Paste your JSON data here or use this example:\n\n${JSON.stringify(exampleData, null, 2)}`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handlePreview}
              disabled={isProcessing || !jsonInput.trim()}
              variant="outline"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            
            <Button
              onClick={handleImport}
              disabled={isProcessing || !validation?.isValid}
              className="bg-primary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>

            <Button
              onClick={handleCleanup}
              disabled={isProcessing}
              variant="outline"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Run Cleanup
            </Button>

            <Button
              onClick={handleReset}
              disabled={isProcessing}
              variant="ghost"
            >
              Reset
            </Button>
          </div>

          {validation && showPreview && (
            <div className="space-y-4">
              <Separator />
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Validation Results</h3>
                
                <div className="flex items-center gap-2">
                  {validation.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={validation.isValid ? "text-green-700" : "text-red-700"}>
                    {validation.isValid ? "Valid data ready for import" : "Validation failed"}
                  </span>
                </div>

                {validation.errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Errors:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validation.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warnings:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {validation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validation.cleanedData && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Preview:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Category:</span> 
                        <Badge variant="outline" className="ml-2">
                          {validation.cleanedData.category}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Theme:</span> 
                        <Badge variant="outline" className="ml-2">
                          {validation.cleanedData.theme}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Posts:</span> {validation.cleanedData.posts.length}
                      </div>
                    </div>
                    
                    {validation.cleanedData.posts.slice(0, 3).map((post, index) => (
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
                    
                    {validation.cleanedData.posts.length > 3 && (
                      <div className="text-center text-muted-foreground">
                        ... and {validation.cleanedData.posts.length - 3} more posts
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