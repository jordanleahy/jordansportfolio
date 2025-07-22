import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BlogVisualPromptProps {
  isOpen: boolean;
  onClose: () => void;
  headline: string;
  content: string;
  category?: 'cdi' | 'contracts' | 'forms' | 'coding ai';
}

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
  const { toast } = useToast();

  const generateImagePrompt = async () => {
    setIsGenerating(true);
    try {
      const userContent = `Headline: ${headline}\nContent: ${content}`;
      const cacheKey = `blog_visual_prompt_${category}_${btoa(userContent).slice(0, 20)}`;
      
      // Check if we have a cached prompt
      const { data: cachedData } = await supabase
        .from('cached_prompts')
        .select('prompt_text')
        .eq('cache_key', cacheKey)
        .single();

      if (cachedData?.prompt_text) {
        setGeneratedPrompt(cachedData.prompt_text);
        return;
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
      await supabase
        .from('cached_prompts')
        .upsert({
          cache_key: cacheKey,
          prompt_text: generatedText,
          category: 'blog_visual',
          metadata: { headline, content, category }
        });
      
      setGeneratedPrompt(generatedText);
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

  React.useEffect(() => {
    if (isOpen && !generatedPrompt && !isGenerating) {
      generateImagePrompt();
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      setGeneratedPrompt('');
      setCopied(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Blog Visual Image Prompt Generator</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Headline:</strong> {headline}</p>
            <p><strong>Content:</strong> {content}</p>
          </div>
          
          {isGenerating ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Generating {category === 'contracts' ? 'business' : 'healthcare'} image prompt...</span>
            </div>
          ) : generatedPrompt ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Generated Image Prompt:</label>
                <Textarea
                  value={generatedPrompt}
                  readOnly
                  className="min-h-[300px] mt-2 font-mono text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Copy this prompt and paste it into OpenAI's image creator to generate your {category === 'contracts' ? 'business' : 'healthcare'} vector illustration.
                </p>
                <Button onClick={handleCopyPrompt} className="flex items-center gap-2">
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
            </div>
          ) : (
            <div className="flex justify-center p-8">
              <Button onClick={generateImagePrompt}>Generate Image Prompt</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
