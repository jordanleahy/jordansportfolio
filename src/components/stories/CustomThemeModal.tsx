import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Download, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useThemeImport } from '@/hooks/useThemeImport';

import type { CustomThemeModalProps } from '@/types/stories/ui';

interface GeneratedTheme {
  category: string;
  theme: string;
  description?: string;
  posts: Array<{
    day: number;
    title: string;
    description: string;
  }>;
}

export const CustomThemeModal: React.FC<CustomThemeModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [description, setDescription] = useState('');
  const [generatedTheme, setGeneratedTheme] = useState<GeneratedTheme | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const {
    validateInput,
    importData,
    isProcessing,
    validationResult,
    canImport,
    hasErrors
  } = useThemeImport({
    onImportComplete: () => {
      toast({
        title: "Success!",
        description: "Custom theme imported successfully",
      });
      handleClose();
      onImportComplete?.();
    }
  });

  const handleClose = () => {
    setDescription('');
    setGeneratedTheme(null);
    setIsGenerating(false);
    onClose();
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe the theme you want to create",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-custom-theme', {
        body: { description: description.trim() }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate theme');
      }

      setGeneratedTheme(data.themeData);
      
      // Automatically validate the generated theme
      await validateInput(JSON.stringify(data.themeData, null, 2));
      
      toast({
        title: "Theme Generated!",
        description: `Generated ${data.themeData.posts.length} posts for "${data.themeData.theme}"`,
      });

    } catch (error) {
      console.error('Error generating theme:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate custom theme",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImport = async () => {
    if (!generatedTheme) return;
    
    try {
      await importData();
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const downloadJSON = () => {
    if (!generatedTheme) return;
    
    const blob = new Blob([JSON.stringify(generatedTheme, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedTheme.category}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Custom Theme with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Describe Your Theme
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Tell us what kind of social media content theme you want. For example: "AI in healthcare for doctors", "Marketing tips for small businesses", or "Financial planning for millennials"
              </p>
              <Textarea
                id="description"
                placeholder="Enter your theme description here... (e.g., 'Create 10 posts about AI applications in healthcare targeted for medical professionals')"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
                disabled={isGenerating}
              />
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Theme...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Custom Theme
                </>
              )}
            </Button>
          </div>

          {/* Generated Theme Preview */}
          {generatedTheme && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Generated Theme: {generatedTheme.theme}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadJSON}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download JSON
                  </Button>
                </CardTitle>
                {generatedTheme.description && (
                  <p className="text-sm text-muted-foreground">
                    {generatedTheme.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {generatedTheme.posts.map((post, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                          Day {post.day}
                        </span>
                        <h4 className="font-medium text-sm">{post.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {post.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Results */}
          {validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertCircle className={`h-4 w-4 ${hasErrors ? 'text-destructive' : 'text-green-500'}`} />
                  Validation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {validationResult.errors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-destructive mb-1">Errors:</h4>
                    <ul className="text-xs text-destructive space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validationResult.warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-yellow-600 mb-1">Warnings:</h4>
                    <ul className="text-xs text-yellow-600 space-y-1">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {!hasErrors && (
                  <p className="text-xs text-green-600">✓ Theme is valid and ready to import</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Import Button */}
          {generatedTheme && canImport && (
            <Button 
              onClick={handleImport}
              disabled={isProcessing || hasErrors}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing Theme...
                </>
              ) : (
                `Import ${generatedTheme.posts.length} Posts to Calendar`
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};