import { useState, useCallback } from 'react';
import type { SocialMediaPost } from '@/types/socialMedia';

interface VoiceoverModalState {
  isOpen: boolean;
  post: SocialMediaPost | null;
}

interface ImagePromptModalState {
  isOpen: boolean;
  postId: string;
  title: string;
  description: string;
  cachedPrompt?: string | null;
  category?: string;
}

interface PreviewImageState {
  url: string;
  alt: string;
}

export const useModalManager = () => {
  const [voiceoverModal, setVoiceoverModal] = useState<VoiceoverModalState>({
    isOpen: false,
    post: null
  });

  const [imagePromptModal, setImagePromptModal] = useState<ImagePromptModalState>({
    isOpen: false,
    postId: '',
    title: '',
    description: '',
    cachedPrompt: null,
    category: 'cdi'
  });

  const [previewImage, setPreviewImage] = useState<PreviewImageState | null>(null);
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);

  const openVoiceoverModal = useCallback((post: SocialMediaPost) => {
    setVoiceoverModal({
      isOpen: true,
      post
    });
  }, []);

  const closeVoiceoverModal = useCallback(() => {
    setVoiceoverModal({
      isOpen: false,
      post: null
    });
  }, []);

  const openImagePromptModal = useCallback((post: SocialMediaPost) => {
    setImagePromptModal({
      isOpen: true,
      postId: post.id,
      title: post.title,
      description: post.description,
      cachedPrompt: post.generated_image_prompt,
      category: post.category
    });
  }, []);

  const closeImagePromptModal = useCallback(() => {
    setImagePromptModal({
      isOpen: false,
      postId: '',
      title: '',
      description: '',
      cachedPrompt: null,
      category: 'cdi'
    });
  }, []);

  const openPreviewImage = useCallback((url: string, alt: string) => {
    setPreviewImage({ url, alt });
  }, []);

  const closePreviewImage = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const openWatermarkModal = useCallback(() => {
    setShowWatermarkModal(true);
  }, []);

  const closeWatermarkModal = useCallback(() => {
    setShowWatermarkModal(false);
  }, []);

  return {
    // States
    voiceoverModal,
    imagePromptModal,
    previewImage,
    showWatermarkModal,
    
    // Actions
    openVoiceoverModal,
    closeVoiceoverModal,
    openImagePromptModal,
    closeImagePromptModal,
    openPreviewImage,
    closePreviewImage,
    openWatermarkModal,
    closeWatermarkModal
  };
};