import React from 'react';
import { ImagePromptGeneratorModal } from '@/components/ui/image-prompt-generator-modal';
import { ImagePromptConfig, ImagePromptContent, AspectRatioOption } from '@/types/imagePromptGenerator';
import { getCategoryLabel } from '@/constants/categoryConstants';
import { useParams } from 'react-router-dom';

interface BlogVisualPromptProps {
  isOpen: boolean;
  onClose: () => void;
  headline: string;
  content: string;
  category?: string;
  themeId?: string;
}

const aspectRatioOptions: AspectRatioOption[] = [
  { label: "Landscape (16:9)", value: "16:9" },
  { label: "Portrait (3:4)", value: "3:4" },
  { label: "Mobile (9:16)", value: "9:16" },
  { label: "Standard (4:3)", value: "4:3" }
];

export const BlogVisualPrompt = ({ isOpen, onClose, headline, content, category = 'healthcare', themeId }: BlogVisualPromptProps) => {
  const params = useParams();
  const theme = params.theme ? decodeURIComponent(params.theme) : undefined;

  const config: ImagePromptConfig = {
    title: theme ? `${theme} Visual Prompt Generator` : `${getCategoryLabel(category)} Visual Prompt Generator`,
    systemPrompt: '', // Will be handled by the edge function
    edgeFunction: 'visual-prompt-generator',
    category: category,
    theme,
    themeId,
    enableCaching: true,
    aspectRatioOptions,
    cacheKeyPrefix: 'blog_visual'
  };

  const contentData: ImagePromptContent = {
    primary: headline,
    secondary: content
  };

  return (
    <ImagePromptGeneratorModal
      isOpen={isOpen}
      onClose={onClose}
      config={config}
      content={contentData}
    />
  );
};