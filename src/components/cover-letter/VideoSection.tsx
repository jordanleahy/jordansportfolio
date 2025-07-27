
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { TimeOnTaskTimer } from "@/components/TimeOnTaskTimer";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Image } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyPortfolio } from "@/types/companyPortfolio";
import { useUpdateCompanyPortfolio } from "@/hooks/useCompanyPortfolios";
import { uploadVideoToStorage, isVideoFile } from "@/utils/videoUpload";
import { uploadImage } from "@/utils/imageUpload";
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
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !portfolio) return;

    const validation = isVideoFile(file);
    if (!validation.isValid) {
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
          title: "Video Updated",
          description: "Your portfolio video has been updated successfully.",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to upload video.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Video upload error:', error);
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
    if (!portfolio) return;
    
    try {
      await updatePortfolio.mutateAsync({
        id: portfolio.id,
        custom_video_url: null
      });
      
      toast({
        title: "Video Removed",
        description: "Custom video removed. Default video will be used.",
      });
    } catch (error) {
      console.error('Video removal error:', error);
      toast({
        title: "Removal Error",
        description: "Failed to remove custom video.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !portfolio) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      const imageUrl = await uploadImage(file, { folder: 'portfolio-covers' });
      
      if (imageUrl) {
        await updatePortfolio.mutateAsync({
          id: portfolio.id,
          custom_cover_image_url: imageUrl
        });
        
        toast({
          title: "Cover Image Updated",
          description: "Your cover image has been updated successfully.",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: "Failed to upload cover image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading the image.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleImageRemove = async () => {
    if (!portfolio) return;
    
    try {
      await updatePortfolio.mutateAsync({
        id: portfolio.id,
        custom_cover_image_url: null
      });
      
      toast({
        title: "Cover Image Removed",
        description: "Cover image removed. Default poster will be used.",
      });
    } catch (error) {
      console.error('Image removal error:', error);
      toast({
        title: "Removal Error",
        description: "Failed to remove cover image.",
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
            {videoSrc ? (
              <video 
                className="w-full h-full object-cover rounded-lg"
                controls
                loop
                preload="metadata"
                poster={portfolio?.custom_cover_image_url || posterSrc}
              >
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full bg-muted rounded-lg" />
            )}
            
            {user && portfolio && (
              <div className={`absolute top-2 right-2 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex gap-1">
                  <input
                    type="file"
                    accept="video/*,.mp4,.webm,.mov,.avi,.ogg,.mkv"
                    onChange={handleVideoUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="video-upload"
                  />
                  <input
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.webp"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isUploadingImage}
                    asChild
                    className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0"
                  >
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Image className="w-4 h-4 text-white" />
                    </label>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isUploading}
                    asChild
                    className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0"
                  >
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 text-white" />
                    </label>
                  </Button>
                  
                  {portfolio.custom_video_url && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleVideoRemove}
                      disabled={updatePortfolio.isPending}
                      className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </Button>
                  )}
                  
                  {portfolio.custom_cover_image_url && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleImageRemove}
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
