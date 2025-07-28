import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { CompanyPortfolio } from '@/types/companyPortfolio';
import { useUpdateCompanyPortfolio } from '@/hooks/useCompanyPortfolios';
import { uploadVideoToStorage, isVideoFile } from '@/utils/videoUpload';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface UploadTopVideoButtonProps {
  portfolio?: CompanyPortfolio;
  className?: string;
}

export const UploadTopVideoButton: React.FC<UploadTopVideoButtonProps> = ({
  portfolio,
  className
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const updatePortfolio = useUpdateCompanyPortfolio();
  const { user } = useAuth();

  if (!user || !portfolio) {
    return null;
  }

  const validateVideoAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        const aspectRatio = video.videoWidth / video.videoHeight;
        // 9:16 aspect ratio check (portrait)
        const isValidRatio = aspectRatio < 1;
        resolve(isValidRatio);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = isVideoFile(file);
    if (!validation.isValid) {
      toast.error(validation.reason || 'Invalid video file');
      return;
    }

    const hasValidRatio = await validateVideoAspectRatio(file);
    if (!hasValidRatio) {
      toast.error('Please upload a video with 9:16 aspect ratio (portrait orientation)');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadVideoToStorage(file, 'general', 'portfolio-videos');
      if (result.success && result.url) {
        await updatePortfolio.mutateAsync({
          id: portfolio.id,
          custom_top_video_url: result.url
        });
        toast.success('Video uploaded successfully! It will appear above the current video.');
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <>
      <Button
        onClick={() => document.getElementById('top-video-upload-button')?.click()}
        disabled={isUploading}
        className={className}
      >
        <Upload className="h-4 w-4 mr-2" />
        {isUploading ? 'Uploading...' : 'Upload Video'}
      </Button>
      
      <input
        id="top-video-upload-button"
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        style={{ display: 'none' }}
      />
    </>
  );
};