
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface JobVisualPromptProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobDescription: string;
  companyName: string;
}

const JOB_ROLE_SYSTEM_PROMPT = `🎯 Job Role Visual Prompt Generator (9:16 Aspect Ratio)

Create text prompts that generate flat, modern vector illustrations for job role social media posts in 9:16 vertical format. These illustrations are designed for Instagram stories, LinkedIn posts, and other vertical social media formats showcasing career opportunities and professional development.

✍️ Prompt Format (Template)
"A professional 9:16 vertical vector illustration showcasing [JOB ROLE] in a modern workplace setting. The design should be clean, aspirational, and career-focused, suitable for social media recruitment and professional networking."

Focus on the professional environment, tools, and abstract representations of the role - DO NOT include human figures or people in the generated images.

🧩 Example Scene Elements for Job Roles
- Professional workstations with laptops, monitors, and modern office equipment
- Digital interfaces, dashboards, and software tools relevant to the role
- Abstract representations of skills and responsibilities (charts, code snippets, design mockups)
- Modern office environments with clean desks, plants, and contemporary furniture
- Industry-specific tools and equipment (cameras for designers, stethoscopes for healthcare, etc.)
- Achievement symbols like awards, certificates, or progress indicators
- Technology devices and modern workspace accessories

✅ Visual Style & Layout Guidance for 9:16 Format

🎨 Color Palette
Use a modern professional palette that's vibrant but trustworthy:
- Deep Navy for primary backgrounds and headers
- Bright Teal for positive highlights and success indicators
- Warm Orange for accent elements and call-to-action areas
- Light Gray for supporting text and neutral elements
- Pure White for contrast and clean spacing

🧱 Style Details
- Flat vector design only
- No gradients, no textures, minimal outlines
- Soft shadows only for element separation
- Simplified, geometric shapes for objects and interfaces
- Modern, minimalist aesthetic
- No photorealism—keep forms clean and iconographic

🏙️ Composition & Scene Layout for Vertical Format
- **Top Third:** Header area with role-specific tools or environment setup
- **Middle Third:** Primary focus area showing main workspace or key responsibility visualization
- **Bottom Third:** Supporting elements like achievement indicators or company branding space
- **Safe Zone:** Keep all critical elements within the central 70% width and 80% height
- **Margins:** Use outer areas for subtle background elements only

📐 Aspect Ratio & Safe Zone (9:16 Vertical)
- **Safe Zone:** Keep all essential elements—text, icons, main subjects—within the central 70% width and 80% height of the frame
- **Margin Usage:** Use the outer 15% width and 10% height for background color or minimal decorative shapes only
- **Social Media Optimization:** Ensure the design works well when cropped for different social platforms (Instagram, LinkedIn, etc.)

🎯 Job Role Specific Guidelines
- Focus on the tools, environment, and abstract concepts related to the specific job role
- Use industry-appropriate iconography and visual metaphors
- Emphasize growth, opportunity, and professional development
- Keep the tone aspirational and motivating for job seekers
- Ensure the illustration communicates the value and excitement of the role

Remember: NO human figures or people should be included in these illustrations. Focus on the professional environment, tools, and abstract representations of success and opportunity.`;

export const JobVisualPrompt = ({ isOpen, onClose, jobTitle, jobDescription, companyName }: JobVisualPromptProps) => {
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateJobVisualPrompt = async () => {
    setIsGenerating(true);
    try {
      const userContent = `Job Title: ${jobTitle}\nCompany: ${companyName}\nJob Description: ${jobDescription}`;
      // Fix btoa encoding issue by using a safer method for cache key generation
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(userContent);
      const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const cacheKey = `job_visual_prompt_${hashArray.slice(0, 10).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      
      // Check if we have a cached prompt
      const { data: cachedData } = await supabase
        .from('cached_prompts')
        .select('prompt_text')
        .eq('cache_key', cacheKey)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (cachedData?.prompt_text) {
        setGeneratedPrompt(cachedData.prompt_text);
        return;
      }

      // Use the new hero job visual function
      const { data: functionData, error } = await supabase.functions.invoke('generate-hero-job-visual', {
        body: {
          jobTitle,
          companyName,
          jobDescription
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      const generatedText = functionData?.generatedPrompt;
      
      if (!generatedText) {
        throw new Error('No generated prompt received from function');
      }
      
      // Cache the generated prompt
      const currentUser = await supabase.auth.getUser();
      if (currentUser.data.user) {
        await supabase
          .from('cached_prompts')
          .upsert({
            cache_key: cacheKey,
            prompt_text: generatedText,
            category: 'job_visual_hero',
            metadata: { jobTitle, jobDescription, companyName, style: 'hero' },
            user_id: currentUser.data.user.id
          });
      }
      
      setGeneratedPrompt(generatedText);
    } catch (error) {
      console.error('Error generating job visual prompt:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate job visual prompt. Please try again.",
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
      generateJobVisualPrompt();
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
          <DialogTitle>Job Role Visual Prompt Generator (9:16)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Job Title:</strong> {jobTitle}</p>
            <p><strong>Company:</strong> {companyName}</p>
            <p><strong>Description:</strong> {jobDescription}</p>
          </div>
          
          {isGenerating ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Generating 9:16 job role illustration prompt...</span>
            </div>
          ) : generatedPrompt ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Generated 9:16 Job Visual Prompt:</label>
                <Textarea
                  value={generatedPrompt}
                  readOnly
                  className="min-h-[300px] mt-2 font-mono text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Copy this prompt and paste it into OpenAI's image creator to generate your 9:16 job role illustration for social media.
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
              <Button onClick={generateJobVisualPrompt}>Generate Job Visual Prompt</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
