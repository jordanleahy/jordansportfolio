import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ImageUploadArea } from '@/components/ai-city-planner/ImageUploadArea';
import { PromptInput } from '@/components/ai-city-planner/PromptInput';
import { RunButton } from '@/components/ai-city-planner/RunButton';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const AICityPlanner: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (base64Image: string) => {
    setUploadedImage(base64Image);
  };

  const handleRemoveImage = () => {
    setUploadedImage('');
  };

  const handleRun = async () => {
    if (!uploadedImage) {
      toast({
        title: "Image required",
        description: "Please upload a street photo first",
        variant: "destructive",
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "Prompt required", 
        description: "Please describe your vision for the street transformation",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // This will be connected to the street-vision-agent later
      toast({
        title: "Coming soon!",
        description: "Street vision transformation will be available shortly.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process transformation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canRun = uploadedImage && prompt.trim() && !isLoading;

  return (
    <PageLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Street Vision</h1>
                <p className="text-sm text-muted-foreground">
                  Transform streets into safer, more livable spaces
                </p>
              </div>
              <RunButton
                onClick={handleRun}
                disabled={!canRun}
                loading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Input Section */}
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-6">
                
                {/* Image Upload */}
                <div>
                  <h2 className="text-lg font-medium mb-4 text-foreground">Street Photo</h2>
                  <ImageUploadArea
                    onImageUpload={handleImageUpload}
                    uploadedImage={uploadedImage}
                    onRemoveImage={handleRemoveImage}
                  />
                </div>

                {/* Prompt Input */}
                <div>
                  <PromptInput
                    value={prompt}
                    onChange={setPrompt}
                  />
                </div>

              </CardContent>
            </Card>

            {/* Results Section - Placeholder for future implementation */}
            {isLoading && (
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-2">
                      <div className="h-8 w-8 mx-auto animate-spin border-2 border-accent border-t-transparent rounded-full"></div>
                      <p className="text-muted-foreground">Analyzing street and generating transformation...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AICityPlanner;