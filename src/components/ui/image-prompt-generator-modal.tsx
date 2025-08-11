import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, Check, RefreshCw, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedCacheManagement } from '@/components/blog/EnhancedCacheManagement';
import { ImagePromptGeneratorModalProps } from '@/types/imagePromptGenerator';
import type { AspectRatio } from '@/types/bulkImageGeneration';

export const ImagePromptGeneratorModal = ({
  isOpen,
  onClose,
  config,
  content,
  cachedPrompt,
  onPromptGenerated
}: ImagePromptGeneratorModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheManagementOpen, setCacheManagementOpen] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(
    config.fixedAspectRatio || config.aspectRatioOptions?.[0]?.value || "16:9"
  );
  const [basePrompt, setBasePrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);

  const generateImagePrompt = async () => {
    if (!content.primary.trim() || !content.secondary.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide all required content.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setIsFromCache(false);

    try {
      let response;
      
      switch (config.edgeFunction) {
        case 'generate-content':
          response = await supabase.functions.invoke('generate-content', {
            body: {
              prompt: `${config.systemPrompt}\n\nTitle: ${content.primary}\nDescription: ${content.secondary}`,
              type: 'image_prompt'
            }
          });
          break;
          
        case 'generate-image-prompt-dynamic':
          response = await supabase.functions.invoke('generate-image-prompt-dynamic', {
            body: {
              title: content.primary,
              description: content.secondary,
              theme: config.theme,
              themeId: config.themeId,
              category: config.category,
              aspectRatio: selectedAspectRatio,
            }
          });
          break;
          
        case 'generate-hero-job-visual':
          response = await supabase.functions.invoke('generate-hero-job-visual', {
            body: {
              jobTitle: content.primary,
              jobDescription: content.secondary,
              companyName: content.tertiary || ''
            }
          });
          break;
          
          
        default:
          throw new Error(`Unknown edge function: ${config.edgeFunction}`);
      }

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate prompt');
      }

      const prompt = response.data?.generatedText || 
                      response.data?.generatedPrompt || 
                      response.data?.imagePrompt || '';
      const receivedSystemPrompt = response.data?.systemPrompt || '';
      
      if (!prompt) {
        throw new Error('No prompt received from the service');
      }

      // Store the system prompt if received
      if (receivedSystemPrompt) {
        setSystemPrompt(receivedSystemPrompt);
      }

      // Clean any existing aspect ratio mentions from the received prompt
      const cleanPrompt = prompt.replace(/\b\d+:\d+\s+aspect\s+ratio\b/gi, '').trim();
      setBasePrompt(cleanPrompt);
      
      // Apply aspect ratio if needed - integrate naturally at the end
      const finalPrompt = config.aspectRatioOptions && selectedAspectRatio 
        ? `${cleanPrompt}. Composed in ${selectedAspectRatio} aspect ratio format with appropriate layout for this orientation.`
        : cleanPrompt;
        
      setGeneratedPrompt(finalPrompt);

      // Cache the prompt if caching is enabled
      if (config.enableCaching && config.cacheKeyPrefix) {
        try {
          const cacheKey = `${config.cacheKeyPrefix}_${content.primary.toLowerCase().replace(/\s+/g, '_')}`;
          await supabase.from('cached_prompts').upsert({
            cache_key: cacheKey,
            prompt_text: prompt,
            category: config.cacheKeyPrefix || 'image_prompt',
            created_at: new Date().toISOString()
          });
        } catch (cacheError) {
          console.error('Failed to cache prompt:', cacheError);
        }
      }

      onPromptGenerated?.(finalPrompt);

      toast({
        title: "Prompt Generated",
        description: "Your image prompt has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAspectRatioSelect = (ratio: AspectRatio) => {
    setSelectedAspectRatio(ratio);
    if (basePrompt) {
      // Clean any existing aspect ratio mentions from the base prompt
      const cleanPrompt = basePrompt.replace(/\b\d+:\d+\s+aspect\s+ratio\b/gi, '').trim();
      // Add the new aspect ratio naturally at the end
      const newPrompt = `${cleanPrompt}. Composed in ${ratio} aspect ratio format with appropriate layout for this orientation.`;
      setGeneratedPrompt(newPrompt);
    }
  };

  const handleCopyPrompt = async () => {
    if (generatedPrompt) {
      try {
        await navigator.clipboard.writeText(generatedPrompt);
        setCopied(true);
        toast({
          title: "Copied to Clipboard",
          description: "The image prompt has been copied to your clipboard.",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy to clipboard. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    if (isOpen && content.primary && content.secondary) {
      if (cachedPrompt) {
        // Clean any existing aspect ratio mentions from cached prompt
        const cleanCachedPrompt = cachedPrompt.replace(/\b\d+:\d+\s+aspect\s+ratio\b/gi, '').trim();
        setBasePrompt(cleanCachedPrompt);
        
        // Apply current aspect ratio if needed
        const finalPrompt = config.aspectRatioOptions && selectedAspectRatio 
          ? `${cleanCachedPrompt}. Composed in ${selectedAspectRatio} aspect ratio format with appropriate layout for this orientation.`
          : cleanCachedPrompt;
          
        setGeneratedPrompt(finalPrompt);
        setIsFromCache(true);
      } else {
        generateImagePrompt();
      }
    }
  }, [isOpen, content.primary, content.secondary, cachedPrompt]);

  useEffect(() => {
    if (!isOpen) {
      setGeneratedPrompt('');
      setBasePrompt('');
      setSystemPrompt('');
      setShowSystemPrompt(false);
      setIsGenerating(false);
      setCopied(false);
      setIsFromCache(false);
      setCacheManagementOpen(false);
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {isGenerating ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mr-3" />
                <span>Generating your image prompt...</span>
              </div>
            ) : generatedPrompt ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Generated Image Prompt:</label>
                    <div className="flex items-center gap-2">
                      {isFromCache && (
                        <span className="text-xs text-muted-foreground bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                          From Cache
                        </span>
                      )}
                      {config.enableCaching && (
                        <Button
                          onClick={() => setCacheManagementOpen(true)}
                          variant="ghost"
                          size="sm"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={generateImagePrompt}
                        variant="outline"
                        size="sm"
                        disabled={isGenerating}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea
                    value={generatedPrompt}
                    readOnly
                    className="min-h-[120px] resize-none"
                    placeholder="Your generated prompt will appear here..."
                  />
                  
                  {config.aspectRatioOptions && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {config.aspectRatioOptions.map((option) => (
                          <Button
                            key={option.value}
                            variant={selectedAspectRatio === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleAspectRatioSelect(option.value)}
                            className="text-sm"
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                      
                      <Button 
                        onClick={handleCopyPrompt} 
                        className="flex items-center gap-2"
                        size="default"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Prompt
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {!config.aspectRatioOptions && (
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleCopyPrompt} 
                        className="flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Prompt
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* System Prompt Section */}
                  {systemPrompt && (
                    <div className="border-t pt-4 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        {showSystemPrompt ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        Show System Prompt Used
                      </Button>
                      
                      {showSystemPrompt && (
                        <div className="mt-3">
                          <Textarea
                            value={systemPrompt}
                            readOnly
                            className="min-h-[100px] resize-none text-sm bg-muted/50"
                            placeholder="System prompt details..."
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Button 
                  onClick={generateImagePrompt}
                  disabled={isGenerating || !content.primary.trim() || !content.secondary.trim()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate Image Prompt
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {config.enableCaching && config.cacheKeyPrefix && (
        <EnhancedCacheManagement
          isOpen={cacheManagementOpen}
          onClose={() => setCacheManagementOpen(false)}
        />
      )}
    </>
  );
};