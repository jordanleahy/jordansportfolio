import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, XCircle, Upload } from 'lucide-react';
import { themeImportService } from '@/services/themeImportService';
import type { ProcessingResult } from '@/types/themeImport';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ThemeImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

type ProcessingState = 'idle' | 'processing' | 'success' | 'error';

export const ThemeImportModal: React.FC<ThemeImportModalProps> = ({
  open,
  onOpenChange,
  onImportComplete
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [state, setState] = useState<ProcessingState>('idle');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processMutation = useMutation({
    mutationFn: async (data: string) => {
      console.log('🚀 ThemeImportModal: Starting process mutation');
      console.log('📝 Raw JSON input length:', data.length);
      
      setState('processing');
      
      try {
        // Parse JSON first with detailed logging
        console.log('📋 Parsing JSON input...');
        const parsedData = JSON.parse(data);
        console.log('✅ JSON parsed successfully:', parsedData);
        
        // First process with AI to clean the data
        console.log('🤖 Calling AI processing...');
        const processed = await themeImportService.processWithAI(parsedData);
        console.log('🎯 AI processing result:', processed);
        
        if (!processed.success) {
          console.error('❌ AI processing failed:', processed.errors);
          throw new Error(processed.errors.join(', '));
        }
        
        console.log('✅ Processing completed successfully');
        return processed;
      } catch (error) {
        console.error('💥 Process mutation error:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        throw error;
      }
    },
    onSuccess: (processedResult) => {
      console.log('🎉 Process mutation success:', processedResult);
      setResult(processedResult);
      setState('success');
      toast({
        title: "Processing completed",
        description: `Applied ${processedResult.fixes?.length || 0} fixes`,
      });
    },
    onError: (error) => {
      console.error('🚨 Process mutation error handler:', error);
      setState('error');
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      console.log('📦 Starting import mutation');
      console.log('📋 Current result state:', result);
      
      if (!result?.cleanedData) {
        console.error('❌ No processed data to import');
        throw new Error('No processed data to import');
      }
      
      console.log('🗂️ Cleaned data to import:', result.cleanedData);
      console.log('📊 Posts count:', result.cleanedData.posts?.length);
      
      try {
        const importResult = await themeImportService.importThemeData(JSON.stringify(result.cleanedData));
        console.log('📥 Import service result:', importResult);
        return importResult;
      } catch (error) {
        console.error('💥 Import mutation error:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        throw error;
      }
    },
    onSuccess: (importResult) => {
      console.log('🎉 Import mutation success:', importResult);
      
      if (importResult.success) {
        console.log('✅ Import successful, invalidating queries...');
        queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
        queryClient.invalidateQueries({ queryKey: ['available-categories'] });
        toast({
          title: "Import successful",
          description: `Imported ${importResult.insertedCount} posts successfully`,
        });
        onImportComplete?.();
        onOpenChange(false);
        handleReset();
      } else {
        console.error('❌ Import failed with errors:', importResult.errors);
        toast({
          title: "Import failed",
          description: importResult.errors.join(', '),
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('🚨 Import mutation error handler:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  const handleProcess = () => {
    console.log('🔄 Handle process triggered');
    console.log('📝 JSON input:', jsonInput.substring(0, 200) + (jsonInput.length > 200 ? '...' : ''));
    
    if (!jsonInput.trim()) {
      console.warn('⚠️ No JSON input provided');
      toast({
        title: "No data to process",
        description: "Please enter JSON data first",
        variant: "destructive"
      });
      return;
    }
    
    console.log('🚀 Starting process mutation...');
    processMutation.mutate(jsonInput);
  };

  const handleImport = () => {
    console.log('📦 Handle import triggered');
    console.log('🔍 Can import:', canImport);
    console.log('📋 Current result:', result);
    importMutation.mutate();
  };

  const handleReset = () => {
    setJsonInput('');
    setResult(null);
    setState('idle');
  };

  const isProcessing = processMutation.isPending || importMutation.isPending;
  const canImport = state === 'success' && result?.success;

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
              onClick={handleProcess}
              disabled={isProcessing || !jsonInput.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Process & Validate
            </Button>
            
            <Button
              onClick={handleImport}
              disabled={isProcessing || !canImport}
              className="bg-primary"
            >
              <Upload className="w-4 h-4 mr-2" />
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

          {result && state !== 'idle' && (
            <div className="space-y-4">
              <Separator />
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Processing Results</h3>
                
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={result.success ? "text-green-700" : "text-red-700"}>
                    {result.success ? "Ready for import" : "Processing failed"}
                  </span>
                </div>

                {result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Errors:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {result.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warnings:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {result.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {result.fixes && result.fixes.length > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Applied Fixes:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {result.fixes.map((fix, index) => (
                          <li key={index}>{fix}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {result.cleanedData && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Preview:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Category:</span> 
                        <Badge variant="outline" className="ml-2">
                          {result.cleanedData.category}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Theme:</span> 
                        <Badge variant="outline" className="ml-2">
                          {result.cleanedData.theme}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Posts:</span> {result.cleanedData.posts.length}
                      </div>
                    </div>
                    
                    {result.cleanedData.posts.slice(0, 3).map((post, index) => (
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
                    
                    {result.cleanedData.posts.length > 3 && (
                      <div className="text-center text-muted-foreground">
                        ... and {result.cleanedData.posts.length - 3} more posts
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