import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Camera, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface QAAnalysis {
  hasIssues: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  issues: string[];
  suggestions: string[];
  overallAssessment: string;
}

interface QAResult {
  success: boolean;
  analysis: QAAnalysis;
  rawAnalysis: string;
}

export const QAVisionChecker: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [context, setContext] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [qaResult, setQaResult] = useState<QAResult | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setQaResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('qa-vision-check', {
        body: {
          image: selectedImage,
          context: context.trim() || undefined
        }
      });

      if (error) throw error;

      setQaResult(data);
      
      if (data.analysis.hasIssues) {
        toast.warning(`QA Issues Found (${data.analysis.severity} severity)`);
      } else {
        toast.success('No issues detected');
      }
    } catch (error) {
      console.error('QA analysis error:', error);
      toast.error('Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (hasIssues: boolean, severity: string) => {
    if (!hasIssues) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (severity === 'critical' || severity === 'high') return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            QA Vision Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Upload Image for Analysis</label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload an image for QA analysis
                </p>
              </label>
            </div>
          </div>

          {selectedImage && (
            <div>
              <label className="block text-sm font-medium mb-2">Preview</label>
              <img 
                src={selectedImage} 
                alt="Selected for QA analysis" 
                className="max-w-full max-h-64 rounded-lg border"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Context (Optional)
            </label>
            <Textarea
              placeholder="Provide additional context about what this image should contain or any specific concerns..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <Button 
            onClick={handleAnalyze}
            disabled={!selectedImage || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
          </Button>
        </CardContent>
      </Card>

      {qaResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getSeverityIcon(qaResult.analysis.hasIssues, qaResult.analysis.severity)}
              QA Analysis Results
              <Badge variant={getSeverityColor(qaResult.analysis.severity)}>
                {qaResult.analysis.severity.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                {qaResult.analysis.overallAssessment}
              </AlertDescription>
            </Alert>

            {qaResult.analysis.hasIssues && qaResult.analysis.issues.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-destructive">Issues Found:</h4>
                <ul className="space-y-1">
                  {qaResult.analysis.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-1 h-1 bg-destructive rounded-full mt-2 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {qaResult.analysis.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Suggestions:</h4>
                <ul className="space-y-1">
                  {qaResult.analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};