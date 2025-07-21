
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Upload, Trash2 } from 'lucide-react';
import { CompanyPortfolio } from '@/types/companyPortfolio';
import { useUpdateCompanyPortfolio } from '@/hooks/useCompanyPortfolios';
import { uploadVideoToStorage, isVideoFile } from '@/utils/videoUpload';
import { useToast } from '@/hooks/use-toast';

interface PortfolioVideoUploadSectionProps {
  portfolio: CompanyPortfolio;
}

export const PortfolioVideoUploadSection: React.FC<PortfolioVideoUploadSectionProps> = ({
  portfolio
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const updatePortfolio = useUpdateCompanyPortfolio();

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Portfolio video upload - File selected:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const validation = isVideoFile(file);
    if (!validation.isValid) {
      console.log('Portfolio video validation failed:', validation.reason);
      toast({
        title: "Invalid File Type",
        description: validation.reason,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadVideoToStorage(file, 'general', 'portfolio-videos');
      
      if (result.success && result.url) {
        await updatePortfolio.mutateAsync({
          id: portfolio.id,
          custom_video_url: result.url
        });
        
        toast({
          title: "Video Uploaded",
          description: "Your custom portfolio video has been uploaded successfully.",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to upload video.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Portfolio video upload error:', error);
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading the video.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleVideoRemove = async () => {
    try {
      await updatePortfolio.mutateAsync({
        id: portfolio.id,
        custom_video_url: null
      });
      
      toast({
        title: "Video Removed",
        description: "Custom video has been removed. Default video will be used.",
      });
    } catch (error) {
      console.error('Portfolio video removal error:', error);
      toast({
        title: "Removal Error",
        description: "Failed to remove custom video.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Custom Portfolio Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          {portfolio.custom_video_url ? (
            <div className="space-y-4">
              <div className="relative">
                <video
                  src={portfolio.custom_video_url}
                  controls
                  className="w-full max-w-md h-40 object-cover rounded-md bg-muted mx-auto"
                />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Custom video uploaded for {portfolio.company_name}
                </p>
                
                <div className="flex gap-2 justify-center">
                  <input
                    type="file"
                    accept="video/*,.mp4,.webm,.mov,.avi,.ogg,.mkv"
                    onChange={handleVideoUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="portfolio-video-replace"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    asChild
                  >
                    <label htmlFor="portfolio-video-replace" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-1" />
                      {isUploading ? 'Uploading...' : 'Replace Video'}
                    </label>
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleVideoRemove}
                    disabled={updatePortfolio.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove Video
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <Upload className="h-10 w-10 text-muted-foreground/50" />
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Upload Custom Video</h3>
                  <p className="text-xs text-muted-foreground">
                    Add a personalized video for {portfolio.company_name}
                  </p>
                  <p className="text-xs text-muted-foreground/75">
                    Supported: MP4, WebM, MOV, AVI, MKV (Max 50MB)
                  </p>
                </div>
                
                <input
                  type="file"
                  accept="video/*,.mp4,.webm,.mov,.avi,.ogg,.mkv"
                  onChange={handleVideoUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="portfolio-video-upload"
                />
                <Button
                  variant="outline"
                  disabled={isUploading}
                  asChild
                >
                  <label htmlFor="portfolio-video-upload" className="cursor-pointer">
                    {isUploading ? 'Uploading...' : 'Choose Video File'}
                  </label>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
