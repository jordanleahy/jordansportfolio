import React, { useCallback, useRef, useState } from 'react';
import { Upload, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadAreaProps {
  onImageUpload: (imagePath: string, filename: string) => void;
  uploadedImageUrl?: string;
  onRemoveImage: () => void;
  isUploading?: boolean;
}

export const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({
  onImageUpload,
  uploadedImageUrl,
  onRemoveImage,
  isUploading = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToStorage = useCallback(async (file: File): Promise<{ path: string; filename: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const filename = `${user.id}/originals/${timestamp}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('street-vision')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image to storage');
    }

    return { path: filename, filename: file.name };
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const { path, filename } = await uploadToStorage(file);
      onImageUpload(path, filename);
      
      toast({
        title: "Image uploaded",
        description: "Your street photo has been uploaded successfully."
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload the image. Please try again.",
        variant: "destructive",
      });
    }
  }, [onImageUpload, uploadToStorage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
          break;
        }
      }
    }
  }, [handleFile]);

  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (uploadedImageUrl) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-border bg-card group">
        <img 
          src={uploadedImageUrl}
          alt="Uploaded street"
          className="w-full h-48 object-cover"
        />
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemoveImage}
          disabled={isUploading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver 
            ? 'border-accent bg-accent/5 scale-[1.02]' 
            : isHovering
            ? 'border-accent/60 bg-accent/5 shadow-lg'
            : 'border-border bg-muted/30 hover:bg-muted/50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={triggerFileInput}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            triggerFileInput();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 rounded-full bg-accent/10">
            <Image className="h-8 w-8 text-accent" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Upload Street Photo</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop, click to browse, or paste from clipboard
            </p>
            {isHovering && (
              <p className="text-xs text-accent font-medium animate-pulse">
                ✨ Paste an image with Ctrl+V
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG (max 10MB)
            </p>
          </div>
          
          <Button variant="outline" className="mt-4" disabled={isUploading}>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Choose File'}
          </Button>
        </div>
      </div>
    </div>
  );
};