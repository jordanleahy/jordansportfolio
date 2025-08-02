import { useState, useCallback } from 'react';
import type { SocialMediaPost } from '@/types/socialMedia';

interface VoiceoverModalState {
  isOpen: boolean;
  post: SocialMediaPost | null;
}

interface IndividualPromptPanelState {
  isOpen: boolean;
  post: SocialMediaPost | null;
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

  const [individualPromptPanel, setIndividualPromptPanel] = useState<IndividualPromptPanelState>({
    isOpen: false,
    post: null
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

  const openIndividualPromptPanel = useCallback((post: SocialMediaPost) => {
    setIndividualPromptPanel({
      isOpen: true,
      post
    });
  }, []);

  const closeIndividualPromptPanel = useCallback(() => {
    setIndividualPromptPanel({
      isOpen: false,
      post: null
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
    individualPromptPanel,
    previewImage,
    showWatermarkModal,
    
    // Actions
    openVoiceoverModal,
    closeVoiceoverModal,
    openIndividualPromptPanel,
    closeIndividualPromptPanel,
    openPreviewImage,
    closePreviewImage,
    openWatermarkModal,
    closeWatermarkModal
  };
};