import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Image, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useConcurrencyControlledImageGeneration } from '@/hooks/useConcurrencyControlledImageGeneration';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { supabase } from '@/integrations/supabase/client';
import { SocialMediaPost } from '@/types/socialMedia';
import { useToast } from '@/hooks/use-toast';

interface ConcurrencyControlledImageButtonProps {
  post: SocialMediaPost;
  aspectRatio: string;
  onImageGenerated?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

export const ConcurrencyControlledImageButton: React.FC<ConcurrencyControlledImageButtonProps> = ({
  post,
  aspectRatio,
  onImageGenerated,
  disabled = false,
  size = 'default',
  variant = 'default'
}) => {
  const { generateImage, checkImageStatus, canGenerateImage, isGenerating } = useConcurrencyControlledImageGeneration();
  const { getCreditStatus } = useCreditCheck();
  const [currentStatus, setCurrentStatus] = useState<string>('none');
  const [canGenerate, setCanGenerate] = useState(true);
  const { toast } = useToast();

  const creditStatus = getCreditStatus();

  // Check initial status and setup real-time updates
  useEffect(() => {
    let channel: any = null;

    const setupStatusMonitoring = async () => {
      // Check initial status
      const status = await checkImageStatus(post.id, aspectRatio);
      setCurrentStatus(status || 'none');
      setCanGenerate(await canGenerateImage(post.id, aspectRatio));

      // Setup real-time updates
      channel = supabase
        .channel(`image-status-${post.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'social_media_posts',
            filter: `id=eq.${post.id}`
          },
          (payload) => {
            const statusField = `image_${aspectRatio.replace(':', '_')}_status`;
            const newStatus = (payload.new as any)?.[statusField];
            
            if (newStatus && newStatus !== currentStatus) {
              console.log('🔄 Real-time status update:', {
                postId: post.id,
                aspectRatio,
                oldStatus: currentStatus,
                newStatus
              });
              
              setCurrentStatus(newStatus);
              setCanGenerate(['none', 'failed', 'error'].includes(newStatus));

              // Show toast for status changes from other tabs
              if (newStatus === 'generating' && currentStatus !== 'generating') {
                toast({
                  title: "Generation started",
                  description: "Image generation started in another tab",
                  variant: "default",
                });
              } else if (newStatus === 'complete' && currentStatus === 'generating') {
                toast({
                  title: "Generation complete",
                  description: "Image generation completed",
                  variant: "default",
                });
                onImageGenerated?.();
              } else if (newStatus === 'failed' && currentStatus === 'generating') {
                toast({
                  title: "Generation failed",
                  description: "Image generation failed",
                  variant: "destructive",
                });
              }
            }
          }
        )
        .subscribe();
    };

    setupStatusMonitoring();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [post.id, aspectRatio, checkImageStatus, canGenerateImage, currentStatus, onImageGenerated, toast]);

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) {
      return;
    }

    const result = await generateImage(post, { aspectRatio });
    
    if (result.success) {
      onImageGenerated?.();
    }
  };

  const getButtonContent = () => {
    if (creditStatus.isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading...
        </>
      );
    }

    if (!creditStatus.hasCredits) {
      if (creditStatus.blockingLimit === 'daily') {
        return "Daily limit reached";
      }
      return "Upgrade to Continue";
    }

    if (isGenerating || currentStatus === 'generating') {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Generating...
        </>
      );
    }

    if (currentStatus === 'complete') {
      return (
        <>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Regenerate {aspectRatio}
        </>
      );
    }

    if (currentStatus === 'failed' || currentStatus === 'error') {
      return (
        <>
          <AlertCircle className="h-4 w-4 mr-2" />
          Retry {aspectRatio}
        </>
      );
    }

    return (
      <>
        <Image className="h-4 w-4 mr-2" />
        Generate {aspectRatio}
      </>
    );
  };

  const getButtonVariant = () => {
    if (currentStatus === 'failed' || currentStatus === 'error') {
      return 'destructive';
    }
    if (currentStatus === 'complete') {
      return 'outline';
    }
    return variant;
  };

  const isButtonDisabled = disabled || 
    !canGenerate || 
    isGenerating || 
    currentStatus === 'generating' || 
    !creditStatus.hasCredits ||
    creditStatus.isLoading;

  return (
    <Button
      onClick={handleGenerate}
      disabled={isButtonDisabled}
      size={size}
      variant={getButtonVariant()}
      className="transition-all duration-200"
      title={!creditStatus.hasCredits ? (creditStatus.blockingLimit === 'daily' ? 'Daily limit reached' : 'Monthly limit reached - upgrade to continue') : undefined}
    >
      {getButtonContent()}
    </Button>
  );
};