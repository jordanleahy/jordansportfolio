
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
    systemPrompt: 'You are an expert at creating professional, context-aware visual prompts for job applications. Generate detailed image prompts that match the company industry, role type, and professional aesthetic.',
    edgeFunction: 'generate-content',
    category: 'job_visual',
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
