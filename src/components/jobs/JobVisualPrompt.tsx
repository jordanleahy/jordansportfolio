
import React from 'react';
import { ImagePromptGeneratorModal } from '@/components/ui/image-prompt-generator-modal';
import { ImagePromptConfig, ImagePromptContent } from '@/types/imagePromptGenerator';

interface JobVisualPromptProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobDescription: string;
  companyName: string;
}

export const JobVisualPrompt = ({ isOpen, onClose, jobTitle, jobDescription, companyName }: JobVisualPromptProps) => {
  const config: ImagePromptConfig = {
    title: "Generate Job Visual Prompt (9:16)",
    systemPrompt: '', // Handled by edge function
    edgeFunction: 'generate-hero-job-visual',
    enableCaching: true,
    cacheKeyPrefix: 'job_visual',
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
