import React from 'react';
import { ImagePromptGeneratorModal } from '@/components/ui/image-prompt-generator-modal';
import { ImagePromptConfig, ImagePromptContent, AspectRatioOption } from '@/types/imagePromptGenerator';
import { getCategoryLabel } from '@/constants/categoryConstants';
import type { ImagePromptModalProps } from '@/types/stories/ui';
import { useParams } from 'react-router-dom';

const aspectRatioOptions: AspectRatioOption[] = [
  { label: "Landscape (16:9)", value: "16:9" },
  { label: "Portrait (3:4)", value: "3:4" },
  { label: "Mobile (9:16)", value: "9:16" },
  { label: "Standard (4:3)", value: "4:3" }
];

export const ImagePromptModal = ({ isOpen, onClose, title, description, postId, cachedPrompt, category = 'cdi', theme: propTheme, themeId }: ImagePromptModalProps) => {
  const params = useParams();
  const routeTheme = params.theme ? decodeURIComponent(params.theme) : undefined;
  const theme = propTheme ?? routeTheme;
  
  const config: ImagePromptConfig = {
    title: theme 
      ? `${theme} Image Prompt Generator`
      : `${getCategoryLabel(category)} Image Prompt Generator`,
    systemPrompt: '', // Will be handled by the edge function
    edgeFunction: 'visual-prompt-generator',
    category: category,
    theme: theme,
    themeId: themeId,
    enableCaching: true,
    aspectRatioOptions,
    cacheKeyPrefix: theme ? `theme_${theme.toLowerCase().replace(/\s+/g, '_')}_image` : 'calendar_image'
  };

  const content: ImagePromptContent = {
    postId: postId,
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
