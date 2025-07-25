import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Loader2, Database, Sparkles, Settings, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedCacheManagement } from './EnhancedCacheManagement';

interface BlogVisualPromptProps {
  isOpen: boolean;
  onClose: () => void;
  headline: string;
  content: string;
  category?: 'cdi' | 'contracts' | 'forms' | 'coding ai';
}

type AspectRatio = '16:9' | '3:4' | '9:16' | '4:3' | null;

const HEALTHCARE_SYSTEM_PROMPT = `🧠 HC Image Prompt Instructions:
Healthcare Vector Illustration Generator

🎯 Project Goal
Create text prompts that generate flat, modern vector illustrations used in healthcare-RCM storytelling, training materials, and executive summaries. Prompts should produce clean, trustworthy visuals with an informative tone—supporting clarity around coding workflows, audit processes, and documentation quality.

✍️ Prompt Format (Template)
"A healthcare-style vector illustration showing [USER INPUT SCENE] in a clinical or office setting. The design should reflect the same tone and style as corporate infographics—clean, clear, and visually educational."

Focus on the scene, setting, and layout, not on narrative backstory. Do not include human figures, people, or characters in the generated images.

🧩 Example Scene Elements
- EHR/chart review screens, audit flags, code sets (#ICD-10, #CPT)
- Coding workstations, laptops, digital interfaces, clipboards
- Document stacks, magnifying-glass icons, checkmarks/x-marks
- Dashboards with metrics (e.g., "Denial Rate," "Pre-bill Accuracy")
- Clocks or timers indicating turnaround
- Hospital corridors, office partitions, meeting rooms
- Medical necessity documentation systems and workflows

✅ Updated Visual Style & Layout Guidance

🎨 Color Palette
Use a professional healthcare palette—bright but not neon:
- Sky Blue for backgrounds and headers
- Teal-Green for positive indicators and highlights
- Burnt Orange for warnings or flags
- Rich Gray for text, outlines, and neutral elements
- Deep Navy for shadows and key iconography

🧱 Style Details
- Flat vector design only
- No gradients, no textures, no outlines
- Minimal soft shadows for element separation
- Simplified, geometric shapes for objects and interfaces
- No photorealism—keep forms schematic and iconographic

🏙️ Composition & Scene Layout
- **Foreground:** Primary system or process (e.g., coding dashboard displaying flagged charts) centered and prominent
- **Mid-ground:** Supporting elements (dashboards, document icons, audit alerts)
- **Background:** Abstracted clinic/office environment—desks, partitions, simple window shapes
- **Iconography:** Embed symbols (checkmarks, clocks, alert triangles) naturally—don't float them arbitrarily

📐 Aspect Ratio & Safe Zone
- **Safe Zone:** Keep all critical elements—text, icons, charts, interfaces—within the central 70–80% area of the frame (i.e., inset at least 10–15% from every edge).
- **Margin Usage:** Use the outer 10–15% solely for background color or minimal decorative shapes (no labels or essential imagery). That way, any crop to 4:3 aspect ratio never cuts off your core content.`;

const CONTRACTS_SYSTEM_PROMPT = `💼 Contracts & RCM Image Prompt Instructions:
Business Vector Illustration Generator

🎯 Project Goal
Create text prompts that generate flat, modern vector illustrations used in healthcare contract management, revenue cycle, and payer relations storytelling. Prompts should produce professional, trustworthy business visuals with an informative tone—supporting clarity around contract workflows, billing processes, and payer relationships.

✍️ Prompt Format (Template)
"A professional business-style vector illustration showing [USER INPUT SCENE] in a corporate office or healthcare business setting. The design should reflect the same tone and style as business infographics—clean, professional, and visually educational."

Focus on the business scene, office setting, and professional layout, not on narrative backstory. Do not include human figures, people, or characters in the generated images.

🧩 Example Scene Elements
- Contract management systems, billing interfaces, payer portals, claim processing screens
- Business workstations, presentation screens, digital dashboards
- Charts with revenue metrics, denial rates, payment timelines
- Contract documents, approval workflows, signature systems
- Office buildings, meeting rooms, corporate environments
- Filing systems, audit trails, compliance documentation
- Payer coverage determination systems and workflows

✅ Updated Visual Style & Layout Guidance

🎨 Color Palette
Use a professional business palette—trustworthy and corporate:
- Deep Blue for backgrounds and primary elements
- Forest Green for success indicators and approvals
- Gold/Amber for important highlights and warnings
- Charcoal Gray for text, outlines, and neutral elements
- Rich Navy for shadows and business iconography

🧱 Style Details
- Flat vector design only
- No gradients, no textures, no outlines
- Minimal soft shadows for element separation
- Simplified, geometric shapes for objects and interfaces
- No photorealism—keep forms schematic and iconographic

🏙️ Composition & Scene Layout
- **Foreground:** Primary business system or process (e.g., contract management dashboard, billing workflow) centered and prominent
- **Mid-ground:** Supporting elements (charts, documents, approval workflows)
- **Background:** Professional office environment—desks, meeting rooms, corporate settings
- **Iconography:** Embed business symbols (documents, charts, approval indicators) naturally—don't float them arbitrarily

📐 Aspect Ratio & Safe Zone
- **Safe Zone:** Keep all critical elements—text, icons, charts, interfaces—within the central 70–80% area of the frame (i.e., inset at least 10–15% from every edge).
- **Margin Usage:** Use the outer 10–15% solely for background color or minimal decorative shapes (no labels or essential imagery). That way, any crop to 4:3 aspect ratio never cuts off your core content.`;

export const BlogVisualPrompt = ({ isOpen, onClose, headline, content, category = 'cdi' }: BlogVisualPromptProps) => {
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheManagementOpen, setCacheManagementOpen] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(null);
  const [basePrompt, setBasePrompt] = useState('');
  const { toast } = useToast();

  const aspectRatioOptions = [
    { value: '16:9' as const, label: '16:9', description: 'widescreen format' },
    { value: '3:4' as const, label: '3:4', description: 'portrait format' },
    { value: '9:16' as const, label: '9:16', description: 'mobile/vertical format' },
    { value: '4:3' as const, label: '4:3', description: 'standard format' }
  ];

  const handleAspectRatioSelect = (ratio: AspectRatio) => {
    if (!basePrompt) return;

    if (selectedAspectRatio === ratio) {
      // If clicking the same ratio, reset to base prompt
      setSelectedAspectRatio(null);
      setGeneratedPrompt(basePrompt);
    } else {
      setSelectedAspectRatio(ratio);
      const aspectRatioInstruction = `Aspect Ratio: ${ratio} (${aspectRatioOptions.find(opt => opt.value === ratio)?.description})`;
      setGeneratedPrompt(aspectRatioInstruction + '\n\n' + basePrompt);
    }
  };

  const handleResetPrompt = () => {
    setSelectedAspectRatio(null);
    setGeneratedPrompt(basePrompt);
  };

  const generateImagePrompt = async () => {
    setIsGenerating(true);
    try {
      const userContent = `Headline: ${headline}\nContent: ${content}`;
      // Create a more unique cache key using full content hash
      const contentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userContent));
      const hashArray = Array.from(new Uint8Array(contentHash));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const cacheKey = `blog_visual_prompt_${category}_${hashHex.slice(0, 16)}`;
      
      // Check if we have a cached prompt
      if (!isGenerating) {
        const { data: cachedData } = await supabase
          .from('cached_prompts')
          .select('prompt_text')
          .eq('cache_key', cacheKey)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (cachedData?.prompt_text) {
          setBasePrompt(cachedData.prompt_text);
          setGeneratedPrompt(cachedData.prompt_text);
          setIsFromCache(true);
          return;
        }
      }

      const systemPrompt = category === 'contracts' ? CONTRACTS_SYSTEM_PROMPT : HEALTHCARE_SYSTEM_PROMPT;
      const promptType = category === 'contracts' ? 'business' : 'healthcare';
      
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: `${systemPrompt}

Based on the following content, create a detailed image generation prompt that follows the ${promptType} vector illustration guidelines above:

${userContent}

Please create a complete, ready-to-use prompt for generating a 4:3 ${promptType} vector illustration that incorporates the headline and content provided. The prompt should include specific visual elements, color palette, composition details, and ensure all elements stay within the safe zone for proper cropping.`,
          type: 'image_prompt'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Function response:', data);
      const generatedText = data.generatedText;

      if (!generatedText) {
        throw new Error('No generated text received from function');
      }
      
      // Cache the generated prompt
      const currentUser = await supabase.auth.getUser();
      if (currentUser.data.user) {
        await supabase
          .from('cached_prompts')
          .upsert({
            cache_key: cacheKey,
            prompt_text: generatedText,
            category: 'blog_visual',
            metadata: { headline, content, category },
            user_id: currentUser.data.user.id
          });
      }
      
      setBasePrompt(generatedText);
      setGeneratedPrompt(generatedText);
      setIsFromCache(false);
    } catch (error) {
      console.error('Error generating image prompt:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate image prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy prompt to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = () => {
    generateImagePrompt();
  };

  React.useEffect(() => {
    if (isOpen && !generatedPrompt && !isGenerating) {
      generateImagePrompt();
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      setGeneratedPrompt('');
      setBasePrompt('');
      setSelectedAspectRatio(null);
      setCopied(false);
      setIsFromCache(false);
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-0">
          {/* Fixed Header */}
          <div className="flex-shrink-0 p-6 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Blog Visual Image Prompt Generator</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCacheManagementOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Manage Cache
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="text-sm text-muted-foreground mt-4">
              <p><strong>Headline:</strong> {headline}</p>
              <p><strong>Content:</strong> {content}</p>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto px-6">
            {isGenerating ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Generating {category === 'contracts' ? 'business' : 'healthcare'} image prompt...</span>
              </div>
            ) : generatedPrompt ? (
              <div className="py-4 space-y-4">
                {isFromCache && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      This prompt was loaded from cache for faster access
                    </span>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Generated Image Prompt:</label>
                    <div className="flex items-center gap-2">
                      {isFromCache && (
                        <Button
                          onClick={() => generateImagePrompt()}
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 text-muted-foreground"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Regenerate
                        </Button>
                      )}
                    </div>
                  </div>
                  <Textarea
                    value={generatedPrompt}
                    readOnly
                    className="min-h-[200px] sm:min-h-[250px] mt-2 font-mono text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-12">
                <Button onClick={() => generateImagePrompt()}>Generate Image Prompt</Button>
              </div>
            )}
          </div>

          {/* Fixed Footer - Always Visible */}
          {generatedPrompt && basePrompt && (
            <div className="flex-shrink-0 border-t bg-background/80 backdrop-blur-sm">
              <div className="p-4 space-y-4">
                {/* Aspect Ratio and Copy Button Row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Aspect Ratio Options:</label>
                    {selectedAspectRatio && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetPrompt}
                        className="text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                  
                  {/* Aspect Ratio Buttons and Copy Button in same row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                      {aspectRatioOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={selectedAspectRatio === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleAspectRatioSelect(option.value)}
                          className="text-sm min-h-[44px] sm:min-h-auto"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={handleCopyPrompt} 
                      className="flex items-center gap-2 min-h-[44px] sm:min-h-auto w-full sm:w-auto sm:ml-auto"
                      size="lg"
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
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Click an aspect ratio to append it to your prompt, or click again to remove it.</p>
                    <div className="flex items-center justify-between">
                      <span>Copy this prompt and paste it into OpenAI's image creator to generate your {category === 'contracts' ? 'business' : 'healthcare'} vector illustration.</span>
                      {isFromCache && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Sparkles className="h-3 w-3" />
                          Using cached prompt
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EnhancedCacheManagement 
        isOpen={cacheManagementOpen} 
        onClose={() => setCacheManagementOpen(false)} 
      />
    </>
  );
};
