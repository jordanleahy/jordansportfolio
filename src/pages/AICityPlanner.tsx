import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ImageUploadArea } from '@/components/ai-city-planner/ImageUploadArea';
import { PromptInput } from '@/components/ai-city-planner/PromptInput';
import { RunButton } from '@/components/ai-city-planner/RunButton';
import { StreetVisionResults } from '@/components/ai-city-planner/StreetVisionResults';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useStreetVisionProcessing } from '@/hooks/useStreetVisionProcessing';

const AICityPlanner: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  
  const { 
    currentRecord, 
    isProcessing, 
    startProcessing, 
    clearProcessing, 
    error 
  } = useStreetVisionProcessing();

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

    await startProcessing(uploadedImage, prompt);
  };

  const handleRetry = () => {
    if (uploadedImage && prompt.trim()) {
      clearProcessing();
      handleRun();
    }
  };

  const canRun = uploadedImage && prompt.trim() && !isProcessing;

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
                loading={isProcessing}
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
                    onEnterPress={canRun ? handleRun : undefined}
                    disabled={isProcessing}
                  />
                </div>

              </CardContent>
            </Card>

            {/* Results Section */}
            <StreetVisionResults
              record={currentRecord}
              isProcessing={isProcessing}
              error={error}
              originalImageBase64={uploadedImage}
              onRetry={handleRetry}
            />

          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AICityPlanner;