import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Upload, Trash2 } from 'lucide-react';
import { CompanyPortfolio } from '@/types/companyPortfolio';
import { useUpdateCompanyPortfolio } from '@/hooks/useCompanyPortfolios';
import { uploadVideoToStorage, isVideoFile } from '@/utils/videoUpload';
import { toast } from 'sonner';
import { TimeOnTaskTimer } from '@/components/TimeOnTaskTimer';

interface DualVideoUploadSectionProps {
  topVideoSrc?: string;
  bottomVideoSrc: string;
  posterSrc: string;
  showTimer?: boolean;
  portfolio?: CompanyPortfolio;
  showControls?: boolean;
}

export const DualVideoUploadSection: React.FC<DualVideoUploadSectionProps> = ({
  topVideoSrc,
  bottomVideoSrc,
  posterSrc,
  showTimer = true,
  portfolio,
  showControls = false
}) => {
  const [isUploadingTop, setIsUploadingTop] = useState(false);
  const [isUploadingBottom, setIsUploadingBottom] = useState(false);
  const updatePortfolio = useUpdateCompanyPortfolio();

  const validateVideoAspectRatio = (file: File, expectedRatio: '9:16' | '16:9'): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        const aspectRatio = video.videoWidth / video.videoHeight;
        const isValidRatio = expectedRatio === '9:16' 
          ? aspectRatio < 1 // Portrait (9:16 is approximately 0.5625)
          : aspectRatio > 1; // Landscape (16:9 is approximately 1.777)
        resolve(isValidRatio);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleTopVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !portfolio) return;

    const validation = isVideoFile(file);
    if (!validation.isValid) {
      toast.error(validation.reason || 'Invalid video file');
      return;
    }

    const hasValidRatio = await validateVideoAspectRatio(file, '9:16');
    if (!hasValidRatio) {
      toast.error('Please upload a video with 9:16 aspect ratio (portrait orientation)');
      return;
    }

    setIsUploadingTop(true);
    try {
      const result = await uploadVideoToStorage(file, 'general', 'portfolio-videos');
      if (result.success && result.url) {
        await updatePortfolio.mutateAsync({
          id: portfolio.id,
          custom_top_video_url: result.url
        });
        toast.success('Top video uploaded successfully');
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploadingTop(false);
      event.target.value = '';
    }
  };

  const handleBottomVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !portfolio) return;

    const validation = isVideoFile(file);
    if (!validation.isValid) {
      toast.error(validation.reason || 'Invalid video file');
      return;
    }

    setIsUploadingBottom(true);
    try {
      const result = await uploadVideoToStorage(file, 'general', 'portfolio-videos');
      if (result.success && result.url) {
        await updatePortfolio.mutateAsync({
          id: portfolio.id,
          custom_video_url: result.url
        });
        toast.success('Video uploaded successfully');
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploadingBottom(false);
      event.target.value = '';
    }
  };

  const handleTopVideoRemove = async () => {
    if (!portfolio) return;
    
    try {
      await updatePortfolio.mutateAsync({
        id: portfolio.id,
        custom_top_video_url: null
      });
      toast.success('Top video removed successfully');
    } catch (error) {
      toast.error('Failed to remove video');
    }
  };

  const handleBottomVideoRemove = async () => {
    if (!portfolio) return;
    
    try {
      await updatePortfolio.mutateAsync({
        id: portfolio.id,
        custom_video_url: null
      });
      toast.success('Video removed successfully');
    } catch (error) {
      toast.error('Failed to remove video');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Video (9:16) */}
      <Card className="relative overflow-hidden group">
        <AspectRatio ratio={9/16}>
          {topVideoSrc ? (
            <video
              src={topVideoSrc}
              poster={posterSrc}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                No top video uploaded<br />
                <span className="text-sm">(9:16 aspect ratio)</span>
              </p>
            </div>
          )}
        </AspectRatio>
        
        {/* Upload/Remove Controls for Top Video */}
        {portfolio && (showControls || true) && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => document.getElementById('top-video-upload')?.click()}
              disabled={isUploadingTop}
            >
              <Upload className="h-4 w-4" />
            </Button>
            {topVideoSrc && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleTopVideoRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        
        <input
          id="top-video-upload"
          type="file"
          accept="video/*"
          onChange={handleTopVideoUpload}
          style={{ display: 'none' }}
        />
      </Card>

      {/* Bottom Video (16:9) */}
      <Card className="relative overflow-hidden group">
        <AspectRatio ratio={16/9}>
          {bottomVideoSrc ? (
            <video
              src={bottomVideoSrc}
              poster={posterSrc}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                No video uploaded<br />
                <span className="text-sm">(16:9 aspect ratio)</span>
              </p>
            </div>
          )}
        </AspectRatio>
        
        {/* Upload/Remove Controls for Bottom Video */}
        {portfolio && (showControls || true) && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => document.getElementById('bottom-video-upload')?.click()}
              disabled={isUploadingBottom}
            >
              <Upload className="h-4 w-4" />
            </Button>
            {bottomVideoSrc && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBottomVideoRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        
        <input
          id="bottom-video-upload"
          type="file"
          accept="video/*"
          onChange={handleBottomVideoUpload}
          style={{ display: 'none' }}
        />
        
        {showTimer && (
          <div className="absolute bottom-4 right-4">
            <TimeOnTaskTimer />
          </div>
        )}
      </Card>
    </div>
  );
};