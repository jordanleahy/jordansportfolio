import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Wand2, Download, Loader2, Palette, User } from 'lucide-react';

type CharacterType = 'pixar' | 'vector' | 'realistic';

export const CharacterCreator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [characterType, setCharacterType] = useState<CharacterType>('pixar');
  const [seed, setSeed] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [characterAnalysis, setCharacterAnalysis] = useState<string>('');
  const [characterId, setCharacterId] = useState<string | null>(null);

  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setReferenceImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearReferenceImage = () => {
    setReferenceImage(null);
  };

  const enhancePrompt = (userPrompt: string, type: CharacterType): string => {
    const trimmedPrompt = userPrompt.trim().toLowerCase();
    
    // Default prompts for minimal input
    const defaults = {
      pixar: 'as a cheerful character with large expressive eyes in a magical, colorful setting',
      vector: 'as a clean, modern character with bold colors and geometric shapes',
      realistic: 'as a detailed, lifelike character with natural lighting and realistic proportions'
    };
    
    // If prompt is very short or just the style name, use defaults
    if (trimmedPrompt.length < 10 || trimmedPrompt === type) {
      return defaults[type];
    }
    
    return userPrompt.trim();
  };

  const generateSeed = () => {
    const newSeed = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSeed(newSeed);
  };

  const generateCharacter = async () => {
    if (!referenceImage) {
      toast.error('Please upload an image first');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a character prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      console.log('🎭 Starting character creation...');
      
      // Extract base64 data from the reference image
      const base64Data = referenceImage.split(',')[1];
      
      // Enhance the prompt if it's minimal
      const enhancedPrompt = enhancePrompt(prompt, characterType);
      console.log('📝 Enhanced prompt:', enhancedPrompt);

      const { data, error } = await supabase.functions.invoke('character', {
        body: {
          image: base64Data,
          prompt: enhancedPrompt,
          characterType,
          seed: seed || undefined
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        toast.error('Failed to generate character');
        return;
      }

      if (data.success) {
        console.log('✅ Character generated successfully');
        setGeneratedImage(data.imageData);
        setCharacterAnalysis(data.characterAnalysis);
        setCharacterId(data.characterId);
        setSeed(data.seed);
        toast.success('Character generated! Click download to save.');
        
        // Auto-download the image
        setTimeout(() => downloadImage(data.imageData), 1000);
      } else {
        toast.error(data.error || 'Failed to generate character');
      }
    } catch (error) {
      console.error('❌ Error generating character:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (imageData: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `character-${characterType}-${prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const characterTypeOptions = [
    {
      value: 'pixar' as const,
      label: 'Pixar Style',
      description: '3D animated, large eyes, colorful'
    },
    {
      value: 'vector' as const,
      label: 'Vector Art',
      description: 'Clean geometric, flat colors'
    },
    {
      value: 'realistic' as const,
      label: 'Realistic',
      description: 'Photorealistic, natural lighting'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Character Creator
          </h1>
          <p className="text-muted-foreground text-lg">
            Transform any person into unique characters with multiple artistic styles
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
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
                      className="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
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

          {/* Character Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Character Style
              </CardTitle>
              <CardDescription>
                Choose your character style and customize the creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="character-type">Style</Label>
                <Select value={characterType} onValueChange={(value: CharacterType) => setCharacterType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select character style" />
                  </SelectTrigger>
                  <SelectContent>
                    {characterTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Character Prompt</Label>
                <Input
                  id="prompt"
                  placeholder="Describe your character vision..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seed">Seed (Optional)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSeed}
                    className="text-xs"
                  >
                    Generate
                  </Button>
                </div>
                <Input
                  id="seed"
                  placeholder="Leave empty for random"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use the same seed to recreate similar characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Prompts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Quick Prompts
              </CardTitle>
              <CardDescription>
                Click any prompt to get started quickly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <button
                  className="text-left text-sm p-2 rounded-md hover:bg-muted transition-colors border"
                  onClick={() => setPrompt('as a superhero with a flowing cape')}
                >
                  🦸‍♀️ Superhero with flowing cape
                </button>
                <button
                  className="text-left text-sm p-2 rounded-md hover:bg-muted transition-colors border"
                  onClick={() => setPrompt('as a princess in a magical castle')}
                >
                  👑 Princess in magical castle
                </button>
                <button
                  className="text-left text-sm p-2 rounded-md hover:bg-muted transition-colors border"
                  onClick={() => setPrompt('sitting in a colorful garden with animals')}
                >
                  🌸 Garden scene with animals
                </button>
                <button
                  className="text-left text-sm p-2 rounded-md hover:bg-muted transition-colors border"
                  onClick={() => setPrompt('as a space explorer on an alien planet')}
                >
                  🚀 Space explorer adventure
                </button>
                <button
                  className="text-left text-sm p-2 rounded-md hover:bg-muted transition-colors border"
                  onClick={() => setPrompt('as a chef cooking in a bright kitchen')}
                >
                  👨‍🍳 Chef in bright kitchen
                </button>
              </div>

              <Button
                onClick={generateCharacter}
                disabled={!referenceImage || !prompt.trim() || isGenerating}
                className="w-full mt-4"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Character...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Create Character
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {(generatedImage || isGenerating) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Generated Character
              </CardTitle>
              {characterAnalysis && (
                <CardDescription>
                  Character Analysis: {characterAnalysis}
                </CardDescription>
              )}
              {seed && (
                <CardDescription>
                  Seed: <code className="text-xs bg-muted px-2 py-1 rounded">{seed}</code>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="text-lg font-medium">Creating your {characterType} character...</p>
                  <p className="text-sm text-muted-foreground">This usually takes 10-15 seconds</p>
                </div>
              ) : generatedImage ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={generatedImage}
                      alt="Generated character"
                      className="max-w-full max-h-96 rounded-lg shadow-lg border"
                    />
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => downloadImage(generatedImage)}
                      size="lg"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Character
                    </Button>
                    {characterId && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Regenerate with same character but new prompt
                          generateCharacter();
                        }}
                        disabled={isGenerating}
                        className="gap-2"
                      >
                        <Wand2 className="w-4 h-4" />
                        Regenerate
                      </Button>
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