import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferenceImage } from '@/hooks/useReferenceImage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Wand2, Download, Loader2 } from 'lucide-react';
import { ErrorBanner } from '@/components/common/ErrorBanner';

export const PixarConverter: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [vectorPrompt, setVectorPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'pixar' | 'vector'>('pixar');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [characterAnalysis, setCharacterAnalysis] = useState<string>('');
  const [validationError, setValidationError] = useState<{
    message: string;
    issues: string[];
    faceCount?: number;
  } | null>(null);

  const {
    referenceImage,
    fileInputRef,
    handleImagePaste,
    handleDragOver,
    handleDrop,
    handleImageUpload,
    clearReferenceImage
  } = useReferenceImage();

  const handleInputPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Convert HTMLInputElement event to HTMLTextAreaElement event type for compatibility
    const textAreaEvent = e as unknown as React.ClipboardEvent<HTMLTextAreaElement>;
    await handleImagePaste(textAreaEvent);
  };

  const enhancePrompt = (userPrompt: string, style: 'pixar' | 'vector'): string => {
    const trimmedPrompt = userPrompt.trim().toLowerCase();
    
    if (style === 'vector') {
      // Vector-specific enhancements
      if (trimmedPrompt === 'vector' || trimmedPrompt === 'flat' || trimmedPrompt === 'illustration') {
        return 'as a professional flat vector illustration with clean geometric shapes and bold colors';
      }
      
      if (trimmedPrompt.length < 10 && trimmedPrompt.length > 0) {
        return `as a flat vector illustration ${userPrompt.trim()} with clean lines and modern design`;
      }
      
      return userPrompt.trim();
    } else {
      // Pixar-specific enhancements
      if (trimmedPrompt === 'pixar' || trimmedPrompt === 'disney' || trimmedPrompt === 'animated' || trimmedPrompt === 'cartoon') {
        return 'as a cheerful Disney Pixar animated character with large expressive eyes in a magical, colorful setting';
      }
      
      if (trimmedPrompt.length < 10 && trimmedPrompt.length > 0) {
        return `as a Disney Pixar character ${userPrompt.trim()} with large expressive eyes in a vibrant, magical scene`;
      }
      
      return userPrompt.trim();
    }
  };

  const generatePixarImage = async () => {
    if (!referenceImage) {
      toast.error('Please upload an image first');
      return;
    }

    const activePrompt = selectedStyle === 'pixar' ? prompt : vectorPrompt;
    if (!activePrompt.trim()) {
      toast.error(`Please enter a ${selectedStyle} prompt`);
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setValidationError(null);

    try {
      console.log('🎭 Starting Pixar conversion...');
      
      // Extract base64 data from the reference image
      const base64Data = referenceImage.split(',')[1];
      
      // Enhance the prompt if it's minimal
      const enhancedPrompt = enhancePrompt(activePrompt, selectedStyle);
      console.log('📝 Enhanced prompt:', enhancedPrompt);

      const { data, error } = await supabase.functions.invoke('pixar', {
        body: {
          image: base64Data,
          prompt: enhancedPrompt,
          style: selectedStyle
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        toast.error('Failed to generate Pixar image');
        return;
      }

      if (data.success) {
        console.log('✅ Pixar image generated successfully');
        setGeneratedImage(data.imageData);
        setCharacterAnalysis(data.characterAnalysis);
        toast.success('Pixar image generated! Click download to save.');
        
        // Auto-download the image
        setTimeout(() => downloadImage(data.imageData, selectedStyle), 1000);
      } else if (data.validationError) {
        // Handle validation errors with specific messaging
        const errorMessage = getValidationErrorMessage(data.issues, data.faceCount);
        setValidationError({
          message: errorMessage,
          issues: data.issues || [],
          faceCount: data.faceCount
        });
        toast.error('Image validation failed');
      } else {
        toast.error(data.error || 'Failed to generate Pixar image');
      }
    } catch (error) {
      console.error('❌ Error generating Pixar image:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const getValidationErrorMessage = (issues: string[], faceCount?: number): string => {
    if (!issues || issues.length === 0) {
      return 'Image validation failed. Please try a different photo.';
    }

    const issueSet = new Set(issues);
    
    if (issueSet.has('multiple_faces')) {
      return `Multiple faces detected (${faceCount || 'several'}). Please crop the photo to focus on one person.`;
    }
    
    if (issueSet.has('no_face')) {
      return 'No face clearly visible. Please use a photo with a clear view of a person\'s face.';
    }
    
    if (issueSet.has('poor_quality')) {
      return 'Image quality too low. Please use a clearer, well-lit photo with good resolution.';
    }
    
    if (issueSet.has('face_too_small')) {
      return 'Face is too small in the image. Please use a closer photo where the face is more prominent.';
    }
    
    if (issueSet.has('unclear_features')) {
      return 'Facial features are unclear. Please use a sharper photo with better lighting.';
    }
    
    if (issueSet.has('not_human')) {
      return 'Please use a photo of a human person for Pixar character conversion.';
    }

    return 'Photo is not suitable for character creation. Please try a clear, well-lit photo with one person\'s face prominently visible.';
  };

  const retryGeneration = () => {
    setValidationError(null);
    generatePixarImage();
  };

  const downloadImage = (imageData: string, style?: 'pixar' | 'vector') => {
    try {
      const activePrompt = style === 'vector' ? vectorPrompt : prompt;
      const stylePrefix = style === 'vector' ? 'vector' : 'pixar';
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `${stylePrefix}-${activePrompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Character Art Converter
          </h1>
          <p className="text-muted-foreground text-lg">
            Transform any person into a Disney Pixar character or flat vector illustration
          </p>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mb-6">
            <ErrorBanner
              message={validationError.message}
              onDismiss={() => setValidationError(null)}
              onRetry={retryGeneration}
            />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Image
              </CardTitle>
              <CardDescription>
                Upload, drag & drop, or paste an image of a person
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                {referenceImage ? (
                  <div className="space-y-4">
                    <img
                      src={referenceImage}
                      alt="Uploaded reference"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearReferenceImage();
                      }}
                      className="text-sm"
                    >
                      Clear Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Click to upload, drag & drop, or paste</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Style Selection and Prompt Sections */}
          <div className="space-y-6">
            {/* Style Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Art Style</CardTitle>
                <CardDescription>Choose between 3D Pixar or flat vector illustration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedStyle('pixar')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      selectedStyle === 'pixar'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="font-medium">3D Pixar Style</h3>
                      <p className="text-sm text-muted-foreground mt-1">Disney-style animated character</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedStyle('vector')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      selectedStyle === 'vector'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="font-medium">Flat Vector Style</h3>
                      <p className="text-sm text-muted-foreground mt-1">Clean geometric illustration</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Pixar Prompt */}
            {selectedStyle === 'pixar' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Pixar Prompt
                  </CardTitle>
                  <CardDescription>
                    Describe how you want the character to appear in 3D Pixar style
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Your Pixar Vision</Label>
                    <Input
                      id="prompt"
                      placeholder="Type 'pixar' or describe your vision (you can also paste an image here)"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onPaste={handleInputPaste}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Quick options:</p>
                    <div className="grid gap-1 text-xs">
                      <button
                        className="text-left text-primary hover:underline"
                        onClick={() => setPrompt('pixar')}
                      >
                        • Just type "pixar" for automatic magic ✨
                      </button>
                      <button
                        className="text-left text-primary hover:underline"
                        onClick={() => setPrompt('as a princess in a magical castle with sparkling lights')}
                      >
                        • as a princess in a magical castle with sparkling lights
                      </button>
                      <button
                        className="text-left text-primary hover:underline"
                        onClick={() => setPrompt('as a superhero flying through puffy white clouds')}
                      >
                        • as a superhero flying through puffy white clouds
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vector Prompt */}
            {selectedStyle === 'vector' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Vector Style Prompt
                  </CardTitle>
                  <CardDescription>
                    Describe how you want the character to appear as a flat vector illustration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vectorPrompt">Your Vector Vision</Label>
                    <Input
                      id="vectorPrompt"
                      placeholder="Type 'vector' or describe your vision"
                      value={vectorPrompt}
                      onChange={(e) => setVectorPrompt(e.target.value)}
                      onPaste={handleInputPaste}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Quick options:</p>
                    <div className="grid gap-1 text-xs">
                      <button
                        className="text-left text-primary hover:underline"
                        onClick={() => setVectorPrompt('vector')}
                      >
                        • Just type "vector" for clean flat design ✨
                      </button>
                      <button
                        className="text-left text-primary hover:underline"
                        onClick={() => setVectorPrompt('as a professional avatar with modern geometric style')}
                      >
                        • as a professional avatar with modern geometric style
                      </button>
                      <button
                        className="text-left text-primary hover:underline"
                        onClick={() => setVectorPrompt('in minimalist flat design with bold colors')}
                      >
                        • in minimalist flat design with bold colors
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generate Button */}
            <Button
              onClick={generatePixarImage}
              disabled={!referenceImage || (!prompt.trim() && !vectorPrompt.trim()) || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating {selectedStyle === 'pixar' ? 'Pixar Magic' : 'Vector Art'}...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Create {selectedStyle === 'pixar' ? 'Pixar Character' : 'Vector Illustration'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {(generatedImage || isGenerating) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Generated {selectedStyle === 'pixar' ? 'Pixar Character' : 'Vector Illustration'}
              </CardTitle>
              {characterAnalysis && (
                <CardDescription>
                  Character Analysis: {characterAnalysis}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="text-lg font-medium">Creating your {selectedStyle === 'pixar' ? 'Pixar character' : 'vector illustration'}...</p>
                  <p className="text-sm text-muted-foreground">This usually takes 10-15 seconds</p>
                </div>
              ) : generatedImage ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={generatedImage}
                      alt={`Generated ${selectedStyle === 'pixar' ? 'Pixar character' : 'vector illustration'}`}
                      className="max-w-full max-h-96 rounded-lg shadow-lg border"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => downloadImage(generatedImage, selectedStyle)}
                      size="lg"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download {selectedStyle === 'pixar' ? 'Pixar Image' : 'Vector Image'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};