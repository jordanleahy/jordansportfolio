import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { socialMediaService } from '@/services/socialMediaService';

interface ImagePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  postId: string;
  cachedPrompt?: string | null;
  category?: 'cdi' | 'contracts';
}

const HEALTHCARE_SYSTEM_PROMPT = `🧠 HC Image Prompt Instructions:
Healthcare Vector Illustration Generator

🎯 Project Goal
Create text prompts that generate flat, modern vector illustrations used in healthcare-RCM storytelling, training materials, and executive summaries. Prompts should produce clean, trustworthy visuals with an informative tone—supporting clarity around coding workflows, audit processes, and documentation quality.

✍️ Prompt Format (Template)
"A healthcare-style vector illustration showing [USER INPUT SCENE] in a clinical or office setting. The design should reflect the same tone and style as corporate infographics—clean, clear, and visually educational."

Focus on the scene, setting, and layout, not on narrative backstory or detailed character attributes.

🧩 Example Scene Elements
- EHR/chart review screens, audit flags, code sets (#ICD-10, #CPT)
- Clinicians or coders at desks, laptops, clipboards
- Document stacks, magnifying-glass icons, checkmarks/x-marks
- Dashboards with metrics (e.g., "Denial Rate," "Pre-bill Accuracy")
- Clocks or timers indicating turnaround
- Hospital corridors, office partitions, meeting rooms

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
- Simplified, geometric shapes for people and objects
- No photorealism—keep forms schematic and iconographic

🏙️ Composition & Scene Layout
- **Foreground:** Primary action (e.g., coder reviewing a flagged chart) centered and prominent
- **Mid-ground:** Supporting elements (dashboards, document icons, audit alerts)
- **Background:** Abstracted clinic/office environment—desks, partitions, simple window shapes
- **Iconography:** Embed symbols (checkmarks, clocks, alert triangles) naturally—don't float them arbitrarily

📐 Aspect Ratio & Safe Zone
- **Safe Zone:** Keep all critical elements—text, icons, human figures, charts—within the central 70–80% area of the frame (i.e., inset at least 10–15% from every edge).
- **Margin Usage:** Use the outer 10–15% solely for background color or minimal decorative shapes (no labels or essential imagery). That way, any crop to standard ratios never cuts off your core content.`;

const CONTRACTS_SYSTEM_PROMPT = `💼 Contracts & RCM Image Prompt Instructions:
Business Vector Illustration Generator

🎯 Project Goal
Create text prompts that generate flat, modern vector illustrations used in healthcare contract management, revenue cycle, and payer relations storytelling. Prompts should produce professional, trustworthy business visuals with an informative tone—supporting clarity around contract workflows, billing processes, and payer relationships.

✍️ Prompt Format (Template)
"A professional business-style vector illustration showing [USER INPUT SCENE] in a corporate office or healthcare business setting. The design should reflect the same tone and style as business infographics—clean, professional, and visually educational."

Focus on the business scene, office setting, and professional layout, not on narrative backstory or detailed character attributes.

🧩 Example Scene Elements
- Contract documents, billing systems, payer portals, claim processing screens
- Business professionals at desks, conference tables, presentation screens
- Charts with revenue metrics, denial rates, payment timelines
- Handshakes, contract signatures, approval workflows
- Office buildings, meeting rooms, corporate environments
- Filing systems, audit trails, compliance documentation

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
- Simplified, geometric shapes for people and objects
- No photorealism—keep forms schematic and iconographic

🏙️ Composition & Scene Layout
- **Foreground:** Primary business action (e.g., contract review, billing dashboard) centered and prominent
- **Mid-ground:** Supporting elements (charts, documents, approval workflows)
- **Background:** Professional office environment—desks, meeting rooms, corporate settings
- **Iconography:** Embed business symbols (handshakes, documents, charts) naturally—don't float them arbitrarily

📐 Aspect Ratio & Safe Zone
- **Safe Zone:** Keep all critical elements—text, icons, figures, charts—within the central 70–80% area of the frame (i.e., inset at least 10–15% from every edge).
- **Margin Usage:** Use the outer 10–15% solely for background color or minimal decorative shapes (no labels or essential imagery). That way, any crop to standard ratios never cuts off your core content.`;

export const ImagePromptModal = ({ isOpen, onClose, title, description, postId, cachedPrompt, category = 'cdi' }: ImagePromptModalProps) => {
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateImagePrompt = async () => {
    setIsGenerating(true);
    try {
      const userContent = `Title: ${title}\nDescription: ${description}`;
      const systemPrompt = category === 'contracts' ? CONTRACTS_SYSTEM_PROMPT : HEALTHCARE_SYSTEM_PROMPT;
      const promptType = category === 'contracts' ? 'business' : 'healthcare';
      
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: `${systemPrompt}

Based on the following content, create a detailed image generation prompt that follows the ${promptType} vector illustration guidelines above:

${userContent}

Please create a complete, ready-to-use prompt for generating a 16:9 ${promptType} vector illustration that incorporates the title and description provided. The prompt should include specific visual elements, color palette, composition details, and ensure all elements stay within the safe zone for proper cropping.`,
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
      
      setGeneratedPrompt(generatedText);

      // Cache the generated prompt in the database
      try {
        await socialMediaService.updatePost(postId, {
          generated_image_prompt: generatedText
        });
      } catch (cacheError) {
        console.error('Error caching prompt:', cacheError);
        // Don't show error to user since main functionality worked
      }
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
    if (isOpen) {
      if (cachedPrompt) {
        // Use cached prompt if available
        setGeneratedPrompt(cachedPrompt);
      } else if (!generatedPrompt && !isGenerating) {
        // Generate new prompt if no cache and no current prompt
        generateImagePrompt();
      }
    }
  }, [isOpen, cachedPrompt]);

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
          <DialogTitle>{category === 'contracts' ? 'Business' : 'Healthcare'} Image Prompt Generator</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Post Title:</strong> {title}</p>
            <p><strong>Description:</strong> {description}</p>
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
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">
                    Copy this prompt and paste it into OpenAI's image creator to generate your {category === 'contracts' ? 'business' : 'healthcare'} vector illustration.
                  </p>
                  {cachedPrompt && (
                    <p className="text-xs text-green-600">
                      ✓ Using cached prompt (no API call needed)
                    </p>
                  )}
                </div>
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