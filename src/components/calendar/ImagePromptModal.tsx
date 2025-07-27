import React from 'react';
import { ImagePromptGeneratorModal } from '@/components/ui/image-prompt-generator-modal';
import { ImagePromptConfig, ImagePromptContent, AspectRatioOption } from '@/types/imagePromptGenerator';
import { getCategoryLabel } from '@/constants/categoryConstants';

interface ImagePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  postId: string;
  cachedPrompt?: string | null;
  category?: string;
}

const aspectRatioOptions: AspectRatioOption[] = [
  { label: "Landscape (16:9)", value: "16:9" },
  { label: "Portrait (3:4)", value: "3:4" },
  { label: "Mobile (9:16)", value: "9:16" },
  { label: "Standard (4:3)", value: "4:3" }
];

export const ImagePromptModal = ({ isOpen, onClose, title, description, postId, cachedPrompt, category = 'cdi' }: ImagePromptModalProps) => {
  const config: ImagePromptConfig = {
    title: 'Universal Image Prompt Generator',
    systemPrompt: '', // Will be handled by the edge function
    edgeFunction: 'generate-image-prompt-simplified',
    enableCaching: true,
    aspectRatioOptions,
    cacheKeyPrefix: 'calendar_image'
  };

  const content: ImagePromptContent = {
    primary: title,
    secondary: description
  };

  const handlePromptGenerated = async (prompt: string) => {
    // Update the post with the generated prompt
    try {
      const { optimizedSocialMediaService } = await import('@/services/optimizedSocialMediaService');
      await optimizedSocialMediaService.updatePost(postId, {
        generated_image_prompt: prompt
      });
    } catch (error) {
      console.error('Failed to update post with generated prompt:', error);
    }
  };

  return (
    <ImagePromptGeneratorModal
      isOpen={isOpen}
      onClose={onClose}
      config={config}
      content={content}
      cachedPrompt={cachedPrompt || undefined}
      onPromptGenerated={handlePromptGenerated}
    />
  );
};
