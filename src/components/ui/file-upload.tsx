import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, File, Image, Video } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  preview?: boolean;
  currentFile?: string;
  label?: string;
  description?: string;
}

export function FileUpload({
  onFileSelect,
  accept = "image/*,video/*",
  maxSize = 50, // 50MB default
  preview = true,
  currentFile,
  label = "Upload File",
  description = "Select a photo or video file"
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Check file type based on accept prop
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(acceptType => {
      if (acceptType.includes('/')) {
        // Exact MIME type match (e.g., "application/pdf")
        return file.type === acceptType;
      } else if (acceptType.endsWith('/*')) {
        // Wildcard match (e.g., "image/*")
        const prefix = acceptType.replace('/*', '');
        return file.type.startsWith(prefix + '/');
      }
      return false;
    });
    
    if (!isValidType) {
      toast.error(`Please select a valid file type. Accepted: ${accept}`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);

    // Create preview URL
    if (preview) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
        handleFileSelect({ target: { files: [file] } } as any);
      }
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const renderPreview = () => {
    if (!selectedFile || !previewUrl) return null;

    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');

    return (
      <div className="mt-4">
        <div className="relative inline-block">
          {isImage && (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-32 rounded-lg object-cover"
            />
          )}
          {isVideo && (
            <video
              src={previewUrl}
              className="max-w-full max-h-32 rounded-lg"
              controls
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemoveFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{description}</p>
            <p>Drag and drop or click to browse</p>
            <p className="text-xs mt-1">Max size: {maxSize}MB</p>
          </div>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {selectedFile && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              {getFileIcon(selectedFile)}
              <span className="text-sm font-medium truncate flex-1">
                {selectedFile.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)}MB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {preview && renderPreview()}

      {currentFile && !selectedFile && (
        <div className="text-xs text-muted-foreground">
          Current file: {currentFile}
        </div>
      )}
    </div>
  );
}