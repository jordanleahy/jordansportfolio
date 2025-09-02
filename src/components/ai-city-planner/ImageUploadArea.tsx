/**
 * IMAGE UPLOAD AREA COMPONENT - Multi-Method File Upload with Validation
 * 
 * PURPOSE:
 * This component provides a comprehensive image upload interface supporting multiple input
 * methods (drag & drop, file browser, clipboard paste) with validation, error handling,
 * and seamless integration with Supabase storage for the Street Vision feature.
 * 
 * UPLOAD METHODS SUPPORTED:
 * 1. Drag & Drop: Users can drag images directly onto the upload area
 * 2. File Browser: Click to open system file selection dialog
 * 3. Clipboard Paste: Ctrl+V to paste images from clipboard (global listener)
 * 4. Keyboard Navigation: Enter/Space key support for accessibility
 * 
 * VALIDATION FEATURES:
 * - File type validation (images only: JPG, PNG, etc.)
 * - File size validation (10MB maximum)
 * - User-friendly error messages via toast notifications
 * - Visual feedback for different interaction states
 * 
 * SUPABASE INTEGRATION:
 * - Authenticated uploads to street-vision storage bucket
 * - Organized file structure: {userId}/originals/{timestamp}_{filename}
 * - Automatic public URL generation for immediate display
 * - Error handling for storage failures
 * 
 * UX ENHANCEMENTS:
 * - Visual drag-over feedback with scaling animation
 * - Hover states with enhanced styling and hints
 * - Loading states during upload process
 * - Preview of uploaded image with remove functionality
 * - Responsive design for mobile and desktop
 * 
 * STATE MANAGEMENT:
 * - isDragOver: Visual feedback during drag operations
 * - isHovering: Enhanced styling on mouse hover
 * - isUploading: Loading state during upload process (from parent)
 * 
 * ACCESSIBILITY:
 * - Keyboard navigation support
 * - ARIA labels and roles for screen readers
 * - Focus management for file input
 */

import React, { useCallback, useRef, useState } from 'react';
import { Upload, Image, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { optimizeImage, blobToFile } from '@/utils/clientImageOptimization';

/**
 * Component props interface for image upload functionality
 */
interface ImageUploadAreaProps {
  onImageUpload: (imagePath: string, filename: string) => void; // Callback when upload completes successfully
  uploadedImageUrl?: string;                                    // URL of uploaded image for preview
  onRemoveImage: () => void;                                   // Callback to remove current image
  isUploading?: boolean;                                       // Loading state flag during upload
}

/**
 * Image Upload Area component with multi-method upload support
 * Handles drag & drop, file selection, and clipboard paste
 */
export const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({
  onImageUpload,    // Callback for successful uploads
  uploadedImageUrl, // Current image URL for preview mode
  onRemoveImage,    // Callback for image removal
  isUploading = false, // Loading state
}) => {
  // Visual state for interactive feedback
  const [isDragOver, setIsDragOver] = useState(false);    // Drag & drop feedback
  const [isHovering, setIsHovering] = useState(false);    // Hover state styling
  const [isProcessing, setIsProcessing] = useState(false); // Client-side image processing
  const fileInputRef = useRef<HTMLInputElement>(null);    // Hidden file input reference

  /**
   * Uploads file to Supabase storage with user-specific organization
   * Creates structured path: {userId}/originals/{timestamp}_{filename}
   * 
   * @param file - File object to upload to storage
   * @returns Object with storage path and original filename
   */
  const uploadToStorage = useCallback(async (file: File): Promise<{ path: string; filename: string }> => {
    // Verify user authentication before upload
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Generate organized storage path with timestamp for uniqueness
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const filename = `${user.id}/originals/${timestamp}_${file.name}`;

    // Upload to Supabase storage with caching and error handling
    const { error: uploadError } = await supabase.storage
      .from('street-vision')      // Storage bucket for street photos
      .upload(filename, file, {
        cacheControl: '3600',     // 1 hour cache for performance
        upsert: false            // Prevent overwriting existing files
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image to storage');
    }

    return { path: filename, filename: file.name };
  }, []);

  /**
   * Validates and processes uploaded files with client-side optimization
   * Performs type validation, client-side resizing/compression, then uploads optimized file
   * 
   * @param file - File object to validate, optimize, and upload
   */
  const handleFile = useCallback(async (file: File) => {
    // Validate file type - only allow image files
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size - limit to 50MB for client processing
    if (file.size > 50 * 1024 * 1024) { // 50MB limit for client-side processing
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Client-side image optimization
      console.log('Starting client-side image optimization...');
      const optimizationResult = await optimizeImage(file, {
        maxDimension: 1024,
        quality: 0.85,
        maxSizeBytes: 3 * 1024 * 1024, // 3MB target
        format: file.type.includes('png') ? 'png' : 'jpeg'
      });

      console.log(`Image optimized: ${optimizationResult.originalSize} → ${optimizationResult.optimizedSize} bytes`);
      
      // Convert optimized blob back to File object
      const optimizedFile = blobToFile(optimizationResult.blob, file.name);

      // Upload optimized file to storage
      const { path, filename } = await uploadToStorage(optimizedFile);
      onImageUpload(path, filename);
      
      // Show success notification with optimization details
      toast({
        title: "Image uploaded",
        description: `Your street photo has been optimized and uploaded successfully. Size reduced by ${Math.round((1 - 1/optimizationResult.compressionRatio) * 100)}%.`
      });
    } catch (error) {
      // Handle upload errors with user-friendly messages
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
            disabled={isUploading || isProcessing}
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
          
          <Button variant="outline" className="mt-4" disabled={isUploading || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Choose File'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};