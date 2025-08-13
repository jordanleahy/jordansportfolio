import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { Loader2, Palette, Layout, Brush, Sun, Eye, Layers, CheckCircle2, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReferenceImageAnalyzerProps {
  onAnalysisComplete?: (analysis: any, extractedCharacteristics: any) => void;
  className?: string;
}

interface AnalysisAspect {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const ANALYSIS_ASPECTS: AnalysisAspect[] = [
  {
    id: 'colors',
    label: 'Color Palette',
    icon: <Palette className="h-4 w-4" />,
    description: 'Extract dominant colors and mood'
  },
  {
    id: 'composition',
    label: 'Composition',
    icon: <Layout className="h-4 w-4" />,
    description: 'Analyze layout and visual balance'
  },
  {
    id: 'style',
    label: 'Artistic Style',
    icon: <Brush className="h-4 w-4" />,
    description: 'Identify artistic technique and aesthetic'
  },
  {
    id: 'lighting',
    label: 'Lighting',
    icon: <Sun className="h-4 w-4" />,
    description: 'Analyze lighting quality and mood'
  },
  {
    id: 'mood',
    label: 'Mood & Tone',
    icon: <Eye className="h-4 w-4" />,
    description: 'Extract emotional and professional tone'
  },
  {
    id: 'elements',
    label: 'Visual Elements',
    icon: <Layers className="h-4 w-4" />,
    description: 'Identify subjects and objects'
  }
];

export const ReferenceImageAnalyzer: React.FC<ReferenceImageAnalyzerProps> = ({
  onAnalysisComplete,
  className = ''
}) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAspects, setSelectedAspects] = useState<string[]>(['colors', 'composition', 'style']);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
    setAnalysis(null);
    
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const toggleAspect = useCallback((aspectId: string) => {
    setSelectedAspects(prev => 
      prev.includes(aspectId) 
        ? prev.filter(id => id !== aspectId)
        : [...prev, aspectId]
    );
  }, []);

  const analyzeImage = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: "No Image Selected",
        description: "Please select a reference image to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAspects.length === 0) {
      toast({
        title: "No Analysis Aspects Selected",
        description: "Please select at least one aspect to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      console.log('🔍 Analyzing reference image...');

      const response = await supabase.functions.invoke('analyze-reference-image', {
        body: {
          image: base64,
          aspectsToAnalyze: selectedAspects
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to analyze image');
      }

      const { analysis: analysisData, extractedCharacteristics } = response.data;
      
      setAnalysis(analysisData);
      onAnalysisComplete?.(analysisData, extractedCharacteristics);

      toast({
        title: "Analysis Complete",
        description: "Reference image has been analyzed successfully.",
      });

    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze reference image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, selectedAspects, onAnalysisComplete, toast]);

  const renderColorPalette = (colors: string[]) => (
    <div className="flex flex-wrap gap-2">
      {colors.map((color, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded border border-border"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-mono text-muted-foreground">{color}</span>
        </div>
      ))}
    </div>
  );

  const renderAnalysisResults = () => {
    if (!analysis) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-medium">Analysis Results</h4>
        
        {selectedAspects.includes('colors') && analysis.colors && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Color Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.colors.dominant && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Dominant Colors</p>
                  {renderColorPalette(analysis.colors.dominant)}
                </div>
              )}
              {analysis.colors.palette && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Full Palette</p>
                  {renderColorPalette(analysis.colors.palette)}
                </div>
              )}
              {analysis.colors.mood && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Mood</p>
                  <p className="text-sm">{analysis.colors.mood}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedAspects.includes('composition') && analysis.composition && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Composition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Layout</p>
                <p className="text-sm">{analysis.composition.layout}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Balance</p>
                <p className="text-sm">{analysis.composition.balance}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedAspects.includes('style') && analysis.style && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brush className="h-4 w-4" />
                Style & Technique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Artistic Style</p>
                <p className="text-sm">{analysis.style.artistic}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Technique</p>
                <p className="text-sm">{analysis.style.technique}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reference Image Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload a reference image to extract visual characteristics that will enhance your image prompts.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <FileUpload
            onFileSelect={handleFileSelect}
            accept="image/*"
            maxSize={10}
            label="Reference Image"
            description="Upload an image to analyze"
          />

          {/* Image Preview */}
          {previewUrl && (
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="Reference preview"
                className="max-w-full max-h-48 rounded-lg object-contain border border-border"
              />
            </div>
          )}

          {/* Analysis Aspects Selection */}
          <div>
            <h4 className="font-medium mb-3">Select Analysis Aspects</h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {ANALYSIS_ASPECTS.map((aspect) => (
                <Card
                  key={aspect.id}
                  className={`cursor-pointer transition-colors ${
                    selectedAspects.includes(aspect.id)
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleAspect(aspect.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        {aspect.icon}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{aspect.label}</p>
                          <p className="text-xs text-muted-foreground">{aspect.description}</p>
                        </div>
                      </div>
                      {selectedAspects.includes(aspect.id) ? (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={analyzeImage}
            disabled={!selectedFile || selectedAspects.length === 0 || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Image...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Analyze Reference Image
              </>
            )}
          </Button>

          {/* Analysis Results */}
          {renderAnalysisResults()}
        </CardContent>
      </Card>
    </div>
  );
};