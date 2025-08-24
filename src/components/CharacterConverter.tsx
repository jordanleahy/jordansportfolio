import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useReferenceImage } from '@/hooks/useReferenceImage';
import { useCharacters } from '@/hooks/useCharacters';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Wand2, Download, Loader2, Save } from 'lucide-react';
import { ErrorBanner } from '@/components/common/ErrorBanner';

interface GenerationResult {
  success: boolean;
  imageUrl: string;
  characterAnalysis: string;
  enhancedPrompt: string;
  style: string;
  characterId?: string;
  characterName?: string;
  existingCharacter?: boolean;
}

export const CharacterConverter: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [vectorPrompt, setVectorPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'3d' | 'vector'>('3d');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [saveAsCharacter, setSaveAsCharacter] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [characterAnalysis, setCharacterAnalysis] = useState<string>('');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [validationError, setValidationError] = useState<{
    message: string;
    issues: string[];
    faceCount?: number;
  } | null>(null);

  const { data: characters = [] } = useCharacters();

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

  const enhancePrompt = (userPrompt: string, style: '3d' | 'vector'): string => {
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
      // 3D character-specific enhancements
      if (trimmedPrompt === '3d' || trimmedPrompt === 'character' || trimmedPrompt === 'animated' || trimmedPrompt === 'cartoon') {
        return 'as a cheerful 3D animated character with large expressive eyes in a magical, colorful setting';
      }
      
      if (trimmedPrompt.length < 10 && trimmedPrompt.length > 0) {
        return `as a 3D animated character ${userPrompt.trim()} with large expressive eyes in a vibrant, magical scene`;
      }
      
      return userPrompt.trim();
    }
  };

  const generateCharacterImage = async () => {
    if (!referenceImage && !selectedCharacterId) {
      toast.error('Please upload an image or select an existing character');
      return;
    }

    const activePrompt = selectedStyle === '3d' ? prompt : vectorPrompt;
    if (!activePrompt.trim()) {
      toast.error(`Please enter a ${selectedStyle} prompt`);
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setValidationError(null);

    try {
      console.log('🎭 Starting character conversion...');
      
      // Extract base64 data from the reference image
      const base64Data = referenceImage ? referenceImage.split(',')[1] : null;
      
      // Enhance the prompt if it's minimal
      const enhancedPrompt = enhancePrompt(activePrompt, selectedStyle);
      console.log('📝 Enhanced prompt:', enhancedPrompt);

      const { data, error } = await supabase.functions.invoke('character', {
        body: {
          image: base64Data,
          prompt: enhancedPrompt,
          style: selectedStyle,
          characterId: selectedCharacterId,
          saveAsCharacter: saveAsCharacter && !selectedCharacterId,
          characterName: characterName || null
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        toast.error('Failed to generate character image');
        return;
      }

      if (data.success) {
        console.log('✅ Character image generated successfully');
        setGeneratedImage(data.imageUrl);
        setCharacterAnalysis(data.characterAnalysis);
        setGenerationResult(data);
        
        if (data.characterId && saveAsCharacter) {
          toast.success(`Character saved and ${selectedStyle === '3d' ? '3D' : 'Vector'} image generated!`);
        } else {
          toast.success('Character image generated! Click download to save.');
        }
        
        // Auto-download the image
        setTimeout(() => downloadImage(data.imageUrl, selectedStyle), 1000);
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
        toast.error(data.error || 'Failed to generate character image');
      }
    } catch (error) {
      console.error('❌ Error generating character image:', error);
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
      return 'Please use a photo of a human person for character conversion.';
    }

    return 'Photo is not suitable for character creation. Please try a clear, well-lit photo with one person\'s face prominently visible.';
  };

  const retryGeneration = () => {
    setValidationError(null);
    generateCharacterImage();
  };

  const downloadImage = (imageData: string, style?: '3d' | 'vector') => {
    try {
      const activePrompt = style === 'vector' ? vectorPrompt : prompt;
      const stylePrefix = style === 'vector' ? 'vector' : '3d';
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
            Transform any person into a 3D animated character or flat vector illustration
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
                Upload Image or Select Character
              </CardTitle>
              <CardDescription>
                Upload a new image or select an existing character
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Existing Characters Selection */}
              {characters.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Select Existing Character</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {characters.map((character) => (
                      <div
                        key={character.id}
                        className={`border rounded-lg p-2 cursor-pointer transition-colors ${
                          selectedCharacterId === character.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedCharacterId(character.id)}
                      >
                        <img 
                          src={character.sample_image_url} 
                          alt={character.character_name || 'Character'}
                          className="w-full h-16 object-cover rounded"
                        />
                        <p className="text-xs mt-1 truncate">
                          {character.character_name || 'Unnamed'}
                        </p>
                      </div>
                    ))}
                  </div>
                  {selectedCharacterId && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedCharacterId(null)}
                      className="mt-3 w-full"
                      size="sm"
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
              )}

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
                      <p className="text-sm font-medium">
                        {selectedCharacterId 
                          ? 'Or upload a new photo to create a different character'
                          : 'Click to upload, drag & drop, or paste'
                        }
                      </p>
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
                <CardDescription>Choose between 3D animated or flat vector illustration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedStyle('3d')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      selectedStyle === '3d'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="font-medium">3D Animated Style</h3>
                      <p className="text-sm text-muted-foreground mt-1">Cheerful animated character</p>
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

            {/* Character Saving Options */}
            {referenceImage && !selectedCharacterId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Save Character</CardTitle>
                  <CardDescription>Save this person as a reusable character</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="save-character"
                      checked={saveAsCharacter}
                      onCheckedChange={(checked) => setSaveAsCharacter(checked === true)}
                    />
                    <Label htmlFor="save-character" className="text-sm font-medium">
                      Save as reusable character
                    </Label>
                  </div>
                  
                  {saveAsCharacter && (
                    <div className="space-y-2">
                      <Label htmlFor="character-name" className="text-sm">Character Name (optional)</Label>
                      <Input
                        id="character-name"
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        placeholder="e.g., Sarah, Business Professional"
                        className="text-sm"
                      />
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Saved characters can be reused for consistent results across different styles and prompts
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 3D Character Prompt */}
            {selectedStyle === '3d' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    3D Character Prompt
                  </CardTitle>
                  <CardDescription>
                    Describe how you want the character to appear in 3D animated style
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Your Character Vision</Label>
                    <Input
                      id="prompt"
                      placeholder="Type '3d' or describe your vision (you can also paste an image here)"
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
                        onClick={() => setPrompt('3d')}
                      >
                        • Just type "3d" for automatic magic ✨
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
              onClick={generateCharacterImage}
              disabled={(!referenceImage && !selectedCharacterId) || (!prompt.trim() && !vectorPrompt.trim()) || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating {selectedStyle === '3d' ? '3D Character' : 'Vector Art'}...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Create {selectedStyle === '3d' ? '3D Character' : 'Vector Illustration'}
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
                Generated {selectedStyle === '3d' ? '3D Character' : 'Vector Illustration'}
                {generationResult?.characterId && (
                  <Badge variant="outline" className="ml-2">
                    <Save className="w-3 h-3 mr-1" />
                    Saved Character
                  </Badge>
                )}
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
                  <p className="text-lg font-medium">Creating your {selectedStyle === '3d' ? '3D character' : 'vector illustration'}...</p>
                  <p className="text-sm text-muted-foreground">This usually takes 10-15 seconds</p>
                </div>
              ) : generatedImage ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={generatedImage}
                      alt={`Generated ${selectedStyle === '3d' ? '3D character' : 'vector illustration'}`}
                      className="w-full rounded-lg shadow-lg border"
                    />
                    <Button
                      onClick={() => downloadImage(generatedImage, selectedStyle)}
                      size="lg"
                      className="gap-2 w-full mt-4"
                    >
                      <Download className="w-4 h-4" />
                      Download {selectedStyle === '3d' ? '3D Character' : 'Vector Image'}
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Character Analysis</h3>
                      <p className="text-sm text-muted-foreground">{characterAnalysis}</p>
                    </div>
                    {generationResult?.existingCharacter && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          ✅ Used existing character for consistent results
                        </p>
                      </div>
                    )}
                    {generationResult?.characterName && (
                      <div>
                        <h4 className="font-medium">Character Name</h4>
                        <p className="text-sm text-muted-foreground">{generationResult.characterName}</p>
                      </div>
                    )}
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
