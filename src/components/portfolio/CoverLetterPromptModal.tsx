import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface CoverLetterPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customPrompt: string, roleType: 'product_manager' | 'product_designer') => void;
  isLoading: boolean;
}

export const CoverLetterPromptModal: React.FC<CoverLetterPromptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [roleType, setRoleType] = useState<'product_manager' | 'product_designer'>('product_manager');
  
  const debouncedPrompt = useDebounce(customPrompt, 500);

  // Load cached prompt on mount
  useEffect(() => {
    const cachedPrompt = localStorage.getItem('coverLetterCustomPrompt');
    if (cachedPrompt) {
      setCustomPrompt(cachedPrompt);
    }
  }, []);

  // Save to localStorage when prompt changes (debounced)
  useEffect(() => {
    if (debouncedPrompt) {
      localStorage.setItem('coverLetterCustomPrompt', debouncedPrompt);
    }
  }, [debouncedPrompt]);

  const handleSubmit = () => {
    if (customPrompt.trim()) {
      onSubmit(customPrompt.trim(), roleType);
      setCustomPrompt('');
      localStorage.removeItem('coverLetterCustomPrompt');
    }
  };

  const handleClose = () => {
    setCustomPrompt('');
    localStorage.removeItem('coverLetterCustomPrompt');
    onClose();
  };

  const examplePrompts = [
    "Make it more technical and focus on healthcare AI experience",
    "Emphasize product strategy and stakeholder management skills",
    "Highlight specific projects related to clinical workflow optimization",
    "Use a more conversational tone and mention interest in startup culture",
    "Focus on data-driven decision making and analytics experience",
    "Emphasize design system and user research expertise"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Customize Cover Letter Generation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="role-type">Role Type</Label>
            <Select value={roleType} onValueChange={(value: 'product_manager' | 'product_designer') => setRoleType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product_manager">Product Manager</SelectItem>
                <SelectItem value="product_designer">Product Designer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-prompt">Custom Instructions</Label>
            <Textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Provide specific instructions for how you want the cover letter to be generated. For example: 'Focus more on healthcare experience and emphasize technical skills with AI/ML projects.'"
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Example Instructions:</Label>
            <div className="grid grid-cols-1 gap-2">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setCustomPrompt(prompt)}
                  className="text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent p-2 rounded-md transition-colors"
                >
                  ""{prompt}""
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!customPrompt.trim() || isLoading}
            className="bg-gradient-to-r from-primary to-primary-glow"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isLoading ? 'Generating...' : 'Generate with Custom Instructions'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};