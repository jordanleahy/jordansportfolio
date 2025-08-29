import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image, Zap, Brain } from 'lucide-react';
import { ImageModelSelector } from '@/components/ui/image-model-selector';
import { useConcurrencyControlledImageGeneration } from '@/hooks/useConcurrencyControlledImageGeneration';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { SocialMediaPost } from '@/types/socialMedia';
import { useToast } from '@/hooks/use-toast';
import { ImageModel } from '@/hooks/useMultiProviderImageGeneration';

interface ImageGenerationPanelProps {
  post: SocialMediaPost;
  aspectRatio: string;
  onImageGenerated?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({
  post,
  aspectRatio,
  onImageGenerated,
  disabled = false,
  className = ''
}) => {
  const { 
    generateImage, 
    checkImageStatus, 
    canGenerateImage, 
    isGenerating,
    currentImageModel,
    setCurrentImageModel
  } = useConcurrencyControlledImageGeneration();
  
  const { getCreditStatus } = useCreditCheck();
  const { toast } = useToast();
  
  const [currentStatus, setCurrentStatus] = useState<string>('none');
  const [canGenerate, setCanGenerate] = useState(true);
  const creditStatus = getCreditStatus();

  // Check status on mount and provider change
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkImageStatus(post.id, aspectRatio);
      const canGen = await canGenerateImage(post.id, aspectRatio);
      setCurrentStatus(status || 'none');
      setCanGenerate(canGen);
    };
    checkStatus();
  }, [post.id, aspectRatio, checkImageStatus, canGenerateImage, currentImageModel]);

  const handleGenerate = async () => {
    if (!post.generated_image_prompt) {
      toast({
        title: "No prompt available",
        description: "Please generate a prompt first before creating images.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generateImage(post, {
        aspectRatio,
        category: post.category,
        provider: currentImageModel
      });

      if (result.success) {
        setCurrentStatus('completed');
        onImageGenerated?.();
        
        const modelName = currentImageModel === 'gemini' ? 'Gemini' : 'OpenAI';
        toast({
          title: "Success!",
          description: `Image generated using ${modelName}${result.usage ? ` (Cost: $${result.usage.estimated_cost.toFixed(3)})` : ''}`,
        });
      }
    } catch (error) {
      console.error('Generation error:', error);
      setCurrentStatus('failed');
    }
  };

  const getModelIcon = (model: ImageModel) => {
    return model === 'gemini' ? <Brain className="h-4 w-4" /> : <Zap className="h-4 w-4" />;
  };

  const getModelCost = (model: ImageModel) => {
    // Estimated costs per generation
    const costs = {
      openai: 0.04,
      gemini: 0.025
    };
    return costs[model];
  };

  const isButtonDisabled = disabled || 
    !canGenerate || 
    isGenerating || 
    currentStatus === 'generating' || 
    !creditStatus.hasCredits ||
    creditStatus.isLoading;

  const getButtonText = () => {
    if (isGenerating) return 'Generating...';
    if (currentStatus === 'generating') return 'In Progress';
    if (currentStatus === 'completed') return 'Regenerate';
    return 'Generate Image';
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'generating':
        return <Badge variant="secondary" className="animate-pulse">Generating</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Ready</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">None</Badge>;
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Image className="h-5 w-5" />
            Image Generation
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ImageModelSelector
          value={currentImageModel}
          onChange={setCurrentImageModel}
          disabled={isGenerating}
        />
        
        <Separator />
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {getModelIcon(currentImageModel)}
            <span>Aspect Ratio: {aspectRatio}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>~${getModelCost(currentImageModel).toFixed(3)}</span>
          </div>
        </div>

        {!creditStatus.hasCredits && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-medium">
              {creditStatus.blockingLimit === 'daily' 
                ? 'Daily generation limit reached' 
                : 'Monthly generation limit reached - upgrade to continue'
              }
            </p>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={isButtonDisabled}
          className="w-full"
          size="lg"
        >
          {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {getModelIcon(currentImageModel)}
          <span className="ml-2">{getButtonText()}</span>
        </Button>

        {post.generated_image_prompt && (
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md">
            <strong>Prompt:</strong> {post.generated_image_prompt.substring(0, 150)}
            {post.generated_image_prompt.length > 150 && '...'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};