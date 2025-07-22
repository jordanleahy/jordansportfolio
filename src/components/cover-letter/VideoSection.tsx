
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { TimeOnTaskTimer } from "@/components/TimeOnTaskTimer";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyPortfolio } from "@/types/companyPortfolio";
import { useUpdateCompanyPortfolio } from "@/hooks/useCompanyPortfolios";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useToast } from "@/hooks/use-toast";

interface VideoSectionProps {
  videoSrc: string;
  posterSrc: string;
  showTimer?: boolean;
  portfolio?: CompanyPortfolio;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ 
  videoSrc, 
  posterSrc, 
  showTimer = true,
  portfolio 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const updatePortfolio = useUpdateCompanyPortfolio();
  const { uploadFile } = useFileUpload({ bucket: 'general', folder: 'portfolio-media' });
  const [isUploading, setIsUploading] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !portfolio) return;

    // Validate file type
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video or image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB for videos, 10MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `File size must be less than ${isVideo ? '50MB' : '10MB'}`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrl = await uploadFile(file);
      
      if (uploadedUrl) {
        // Update portfolio with new media URL
        const updateData = isVideo 
          ? { id: portfolio.id, custom_video_url: uploadedUrl }
          : { id: portfolio.id, custom_image_url: uploadedUrl };
        
        await updatePortfolio.mutateAsync(updateData);
        
        toast({
          title: `${isVideo ? 'Video' : 'Photo'} Updated`,
          description: `Your portfolio ${isVideo ? 'video' : 'photo'} has been updated successfully.`,
        });
      } else {
        toast({
          title: "Upload Failed",
          description: "Failed to upload file. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Media upload error:', error);
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading the file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleMediaRemove = async () => {
    if (!portfolio) return;
    
    const hasCustomImage = !!portfolio.custom_image_url;
    const hasCustomVideo = !!portfolio.custom_video_url;
    
    try {
      const updateData: any = { id: portfolio.id };
      
      if (hasCustomImage) {
        updateData.custom_image_url = null;
      }
      if (hasCustomVideo) {
        updateData.custom_video_url = null;
      }
      
      await updatePortfolio.mutateAsync(updateData);
      
      toast({
        title: "Media Removed",
        description: "Custom media removed. Default content will be used.",
      });
    } catch (error) {
      console.error('Media removal error:', error);
      toast({
        title: "Removal Error",
        description: "Failed to remove custom media.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardContent className="p-0 space-y-4">
        <AspectRatio ratio={9/16}>
          <div 
            className="relative w-full h-full group"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            {portfolio?.custom_image_url ? (
              <img 
                src={portfolio.custom_image_url}
                alt="Custom portfolio image"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <video 
                className="w-full h-full object-cover rounded-lg"
                controls
                preload="metadata"
                muted
                autoPlay={false}
                poster={posterSrc}
              >
                <source src={videoSrc} type="video/mp4" />
                <source src={videoSrc} type="video/quicktime" />
                Your browser does not support the video tag.
              </video>
            )}
            
            {user && portfolio && (
              <div className={`absolute top-2 right-2 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex gap-1">
                  <input
                    type="file"
                    accept="video/*,.mp4,.webm,.mov,.avi,.ogg,.mkv,image/*,.jpg,.jpeg,.png,.webp,.gif"
                    onChange={handleMediaUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="media-upload"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isUploading}
                    asChild
                    className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0"
                  >
                    <label htmlFor="media-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 text-white" />
                    </label>
                  </Button>
                  
                  {(portfolio.custom_video_url || portfolio.custom_image_url) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleMediaRemove}
                      disabled={updatePortfolio.isPending}
                      className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </AspectRatio>
        {showTimer && <TimeOnTaskTimer />}
      </CardContent>
    </Card>
  );
};
