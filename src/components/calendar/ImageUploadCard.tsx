import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { uploadFileToStorage } from '@/utils/fileUpload';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadCardProps {
  title: string;
  aspectRatio: string;
  displayAspectRatio?: string;
  imageUrl?: string;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
}

export const ImageUploadCard = ({ 
  title, 
  aspectRatio, 
  displayAspectRatio = "16/9",
  imageUrl, 
  onImageUpload, 
  onImageRemove 
}: ImageUploadCardProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFileToStorage(file);
      if (result.success && result.url) {
        onImageUpload(result.url);
        toast({
          title: "Image uploaded successfully",
          description: `${title} has been uploaded.`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {imageUrl ? (
          <div className="relative">
            <OptimizedImage
              src={imageUrl}
              alt={title}
              size="preview"
              aspectRatio={aspectRatio}
              className="w-full rounded-md border"
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={onImageRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className={`border-2 border-dashed border-muted-foreground/25 rounded-md p-8 text-center`} style={{ aspectRatio: displayAspectRatio }}>
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">Upload {title}</p>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id={`upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
            />
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={isUploading}
            >
              <label htmlFor={`upload-${title.replace(/\s+/g, '-').toLowerCase()}`} className="cursor-pointer">
                {isUploading ? 'Uploading...' : 'Choose File'}
              </label>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};