
import React from 'react';
import { ImagePromptGeneratorModal } from '@/components/ui/image-prompt-generator-modal';
import { ImagePromptConfig, ImagePromptContent } from '@/types/imagePromptGenerator';

interface JobVisualPromptProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  vendorId?: string;
}

export const JobVisualPrompt = ({ isOpen, onClose, jobTitle, jobDescription, companyName, vendorId }: JobVisualPromptProps) => {
  const config: ImagePromptConfig = {
    title: `Generate ${companyName} Job Visual Prompt (9:16)`,
    systemPrompt: '', // Will be handled by the edge function
    edgeFunction: 'create-single-image-prompt',
    category: 'healthcare',
    enableCaching: true,
    cacheKeyPrefix: `job_visual_${companyName.toLowerCase().replace(/\s+/g, '_')}`,
    fixedAspectRatio: "9:16"
  };

  const content: ImagePromptContent = {
    primary: jobTitle,
    secondary: jobDescription,
    tertiary: companyName
  };

  return (
    <ImagePromptGeneratorModal
      isOpen={isOpen}
      onClose={onClose}
      config={config}
      content={content}
    />
  );
};
