import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, Wand2 } from 'lucide-react';
import { uploadVideoToStorage, isVideoFile, getSupportedVideoFormats } from '@/utils/videoUpload';
import { generateAndUploadGif } from '@/utils/gifGeneration';
import { useToast } from '@/hooks/use-toast';

interface VideoUploadCardProps {
  title: string;
  aspectRatio: string;
  videoUrl?: string;
  gifUrl?: string;
  onVideoUpload: (url: string) => void;
  onVideoRemove: () => void;
  onGifGenerated?: (url: string) => void;
}

const VideoUploadCard: React.FC<VideoUploadCardProps> = ({
  title,
  aspectRatio,
  videoUrl,
  gifUrl,
  onVideoUpload,
  onVideoRemove,
  onGifGenerated,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      extension: file.name.split('.').pop()
    });

    const validation = isVideoFile(file);
    if (!validation.isValid) {
      console.log('File validation failed:', validation.reason);
      toast({
        title: "Invalid File Type",
        description: validation.reason,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const result = await uploadVideoToStorage(file);
      
      if (result.success && result.url) {
        onVideoUpload(result.url);
        toast({
          title: "Video Uploaded",
          description: `${title} video uploaded successfully.`,
        });
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to upload video.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading the video.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleGenerateGif = async () => {
    if (!videoUrl || !onGifGenerated) return;

    setIsGeneratingGif(true);
    try {
      const gifUrl = await generateAndUploadGif(videoUrl);
      onGifGenerated(gifUrl);
      toast({
        title: "GIF Generated",
        description: "Video converted to GIF successfully.",
      });
    } catch (error) {
      toast({
        title: "GIF Generation Failed",
        description: "Failed to convert video to GIF.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingGif(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {videoUrl ? (
          <div className="space-y-2">
            <div className="relative">
              <video
                src={videoUrl}
                controls
                className="w-full h-32 object-cover rounded-md bg-muted"
                style={{ aspectRatio }}
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={onVideoRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {onGifGenerated && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateGif}
                  disabled={isGeneratingGif}
                  className="flex-1"
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  {isGeneratingGif ? 'Generating...' : 'Create GIF'}
                </Button>
              </div>
            )}
            {gifUrl && (
              <div className="text-xs text-muted-foreground">
                ✓ GIF generated
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground/50" />
              <div className="text-xs text-muted-foreground">
                Upload {title} video
              </div>
              <div className="text-xs text-muted-foreground/75">
                Supported: {getSupportedVideoFormats().join(', ')}
              </div>
              <input
                type="file"
                accept="video/*,.mp4,.webm,.mov,.avi,.ogg,.mkv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id={`video-upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
                key={videoUrl ? 'with-video' : 'no-video'}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={isUploading}
                asChild
              >
                <label
                  htmlFor={`video-upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
                  className="cursor-pointer"
                >
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </label>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoUploadCard;