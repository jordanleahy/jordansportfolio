
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { TimeOnTaskTimer } from "@/components/TimeOnTaskTimer";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Settings, Image, ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyPortfolio } from "@/types/companyPortfolio";
import { useUpdateCompanyPortfolio } from "@/hooks/useCompanyPortfolios";
import { uploadVideoToStorage, isVideoFile } from "@/utils/videoUpload";
import { uploadFileToStorage } from "@/utils/fileUpload";
import { useToast } from "@/hooks/use-toast";

interface VideoSectionProps {
  videoSrc: string;
  posterSrc: string;
  showTimer?: boolean;
  portfolio?: CompanyPortfolio;
  aspectRatio?: 'portrait' | 'landscape';
  uploadType?: 'main' | 'top';
  showUploadPrompt?: boolean;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ 
  videoSrc, 
  posterSrc, 
  showTimer = true,
  portfolio,
  aspectRatio = 'portrait',
  uploadType = 'main',
  showUploadPrompt = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const updatePortfolio = useUpdateCompanyPortfolio();
  const [isUploading, setIsUploading] = useState(false);
  const [showControls, setShowControls] = useState(false);

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

    // Validate aspect ratio - both videos should be 9:16 now
    const hasValidRatio = await validateVideoAspectRatio(file, '9:16');
    if (!hasValidRatio) {
      toast({
        title: "Invalid Aspect Ratio",
        description: "Please upload a video with 9:16 aspect ratio (portrait orientation)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadVideoToStorage(file, 'general', 'portfolio-videos');
      
      if (result.success && result.url) {
        const updateData = uploadType === 'top' 
          ? { id: portfolio.id, custom_top_video_url: result.url }
          : { id: portfolio.id, custom_video_url: result.url };
          
        await updatePortfolio.mutateAsync(updateData);
        
        toast({
          title: "Video Updated",
          description: `Your ${uploadType === 'top' ? 'top' : 'main'} video has been updated successfully.`,
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !portfolio) return;

    // Basic image validation
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (PNG, JPG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadFileToStorage(file, 'images', 'portfolio-covers');
      
      if (result.success && result.url) {
        const updateData = uploadType === 'top' 
          ? { id: portfolio.id, custom_top_poster_url: result.url }
          : { id: portfolio.id, custom_poster_url: result.url };
          
        await updatePortfolio.mutateAsync(updateData);
        
        toast({
          title: "Cover Image Updated",
          description: `Your ${uploadType === 'top' ? 'top video' : 'main video'} cover image has been updated successfully.`,
        });
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to upload cover image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading the cover image.",
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
      const updateData = uploadType === 'top' 
        ? { id: portfolio.id, custom_top_video_url: null }
        : { id: portfolio.id, custom_video_url: null };
        
      await updatePortfolio.mutateAsync(updateData);
      
      toast({
        title: "Video Removed",
        description: `${uploadType === 'top' ? 'Top video' : 'Custom video'} removed successfully.`,
      });
    } catch (error) {
      console.error('Video removal error:', error);
      toast({
        title: "Removal Error",
        description: "Failed to remove video.",
        variant: "destructive",
      });
    }
  };

  const handleCoverRemove = async () => {
    if (!portfolio) return;
    
    try {
      const updateData = uploadType === 'top' 
        ? { id: portfolio.id, custom_top_poster_url: null }
        : { id: portfolio.id, custom_poster_url: null };
        
      await updatePortfolio.mutateAsync(updateData);
      
      toast({
        title: "Cover Image Removed",
        description: `${uploadType === 'top' ? 'Top video' : 'Main video'} cover image removed successfully.`,
      });
    } catch (error) {
      console.error('Cover removal error:', error);
      toast({
        title: "Removal Error",
        description: "Failed to remove cover image.",
        variant: "destructive",
      });
    }
  };

  const ratio = 9/16; // Both videos are now 9:16 aspect ratio
  const hasVideo = videoSrc && videoSrc.trim() !== '';
  const hasCustomVideo = uploadType === 'top' ? portfolio?.custom_top_video_url : portfolio?.custom_video_url;
  const hasCustomCover = uploadType === 'top' ? portfolio?.custom_top_poster_url : portfolio?.custom_poster_url;

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardContent className="p-0 space-y-4">
        <AspectRatio ratio={ratio}>
          <div 
            className="relative w-full h-full group"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            {hasVideo ? (
              <video 
                className="w-full h-full object-cover rounded-lg"
                controls
                loop
                preload="metadata"
              >
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : showUploadPrompt ? (
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Upload portrait video</p>
                  <p className="text-xs">9:16 aspect ratio</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-muted rounded-lg" />
            )}
            
            {user && portfolio && (
              <div className={`absolute top-2 right-2 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex gap-1">
                  {/* Video Upload */}
                  <input
                    type="file"
                    accept="video/*,.mp4,.webm,.mov,.avi,.ogg,.mkv"
                    onChange={handleVideoUpload}
                    disabled={isUploading}
                    className="hidden"
                    id={`video-upload-${uploadType}`}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isUploading}
                    asChild
                    className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0"
                  >
                    <label htmlFor={`video-upload-${uploadType}`} className="cursor-pointer">
                      <Upload className="w-4 h-4 text-white" />
                    </label>
                  </Button>

                  {/* Image/Cover Upload */}
                  <input
                    type="file"
                    accept="image/*,.png,.jpg,.jpeg,.gif,.webp"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                    id={`image-upload-${uploadType}`}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isUploading}
                    asChild
                    className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0"
                  >
                    <label htmlFor={`image-upload-${uploadType}`} className="cursor-pointer">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </label>
                  </Button>
                  
                  {/* Video Remove Button */}
                  {hasCustomVideo && (
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

                  {/* Cover Remove Button */}
                  {hasCustomCover && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCoverRemove}
                      disabled={updatePortfolio.isPending}
                      className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
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
