import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Upload, Trash2, Eye, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { uploadImage, deleteImage } from '@/utils/imageUpload';
import { supabase } from '@/integrations/supabase/client';
import { type Vendor } from '@/types/vendor';

interface VendorImage {
  id: string;
  url: string;
  description?: string;
  uploaded_at: string;
  file_name: string;
}

interface VendorImageGalleryProps {
  vendor: Vendor;
  canEdit: boolean;
  onSave?: () => void;
}

export function VendorImageGallery({ vendor, canEdit, onSave }: VendorImageGalleryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [images, setImages] = useState<VendorImage[]>(
    Array.isArray(vendor.vendor_images) ? vendor.vendor_images : []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [viewImage, setViewImage] = useState<VendorImage | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const { toast } = useToast();

  const startEdit = () => setIsEditing(true);
  const cancelEdit = () => {
    setIsEditing(false);
    // Reset images to original state
    setImages(Array.isArray(vendor.vendor_images) ? vendor.vendor_images : []);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ vendor_images: images as any })
        .eq('id', vendor.id);

      if (error) throw error;

      toast({
        title: "Images updated",
        description: "Vendor images have been saved successfully.",
      });

      setIsEditing(false);
      onSave?.();
    } catch (error) {
      console.error('Error saving images:', error);
      toast({
        title: "Error",
        description: "Failed to save images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, WebP, or GIF image.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (!isEditing) return;

    setIsUploading(true);
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);

    if (validFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const url = await uploadImage(file, {
          folder: `vendor-screenshots/${vendor.slug}`,
          fileName: `${Date.now()}-${file.name}`
        });

        if (url) {
          return {
            id: crypto.randomUUID(),
            url,
            file_name: file.name,
            uploaded_at: new Date().toISOString(),
            description: ''
          };
        }
        return null;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const successfulUploads = uploadedImages.filter(Boolean) as VendorImage[];

      if (successfulUploads.length > 0) {
        setImages(prev => [...prev, ...successfulUploads]);
        toast({
          title: "Images uploaded",
          description: `${successfulUploads.length} image(s) uploaded successfully.`,
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [isEditing]);

  const removeImage = async (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (!imageToRemove) return;

    try {
      // Extract file path from URL for storage deletion
      const urlParts = imageToRemove.url.split('/');
      const pathIndex = urlParts.findIndex(part => part === 'vendor-screenshots');
      if (pathIndex !== -1) {
        const filePath = urlParts.slice(pathIndex).join('/');
        await deleteImage(filePath);
      }

      setImages(prev => prev.filter(img => img.id !== imageId));
      toast({
        title: "Image removed",
        description: "Image has been removed successfully.",
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Error",
        description: "Failed to remove image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateImageDescription = (imageId: string, description: string) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, description } : img
    ));
  };

  const hasChanges = JSON.stringify(images) !== JSON.stringify(vendor.vendor_images || []);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                Images
                <Badge variant="secondary" className="text-xs">
                  {images.length}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Screenshots and images of the vendor's website and services
              </p>
            </div>
            
            {canEdit && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!hasChanges || isSaving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={startEdit}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Logo Upload Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Social Logo (1:1) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Social Logo</h4>
                <Badge variant="outline" className="text-xs">1:1</Badge>
              </div>
              <div className="relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25">
                {vendor.social_logo_url ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={vendor.social_logo_url}
                      alt="Social Logo"
                      className="w-full h-full object-cover"
                    />
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateImageField('social_logo_url', '')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : isEditing ? (
                  <label className="flex items-center justify-center w-full h-full cursor-pointer hover:bg-muted-foreground/5 transition-colors">
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Upload Social Logo</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'social_logo_url')}
                      className="sr-only"
                      disabled={isUploading}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                    <p className="text-xs">No social logo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Landscape Logo (300x75) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Landscape Logo</h4>
                <Badge variant="outline" className="text-xs">300×75</Badge>
              </div>
              <div className="relative w-full h-20 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25">
                {vendor.landscape_logo_url ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={vendor.landscape_logo_url}
                      alt="Landscape Logo"
                      className="w-full h-full object-cover"
                    />
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateImageField('landscape_logo_url', '')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : isEditing ? (
                  <label className="flex items-center justify-center w-full h-full cursor-pointer hover:bg-muted-foreground/5 transition-colors">
                    <div className="text-center">
                      <Upload className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Upload Landscape Logo</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'landscape_logo_url')}
                      className="sr-only"
                      disabled={isUploading}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                    <p className="text-xs">No landscape logo</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">Additional Images</h4>
              <label className="block cursor-pointer">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Drop images here or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WebP, GIF up to 5MB each
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  className="sr-only"
                  disabled={isUploading}
                />
              </label>
              {isUploading && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Uploading images...
                </p>
              )}
            </div>
          )}

          {images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isEditing 
                ? "Upload your first image using the area above"
                : "No images available"
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="group relative">
                  <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.description || image.file_name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setViewImage(image)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isEditing && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeImage(image.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Image info */}
                  <div className="mt-2 space-y-1">
                    {isEditing ? (
                      <Input
                        placeholder="Add description..."
                        value={image.description || ''}
                        onChange={(e) => updateImageDescription(image.id, e.target.value)}
                        className="text-xs"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {image.description || image.file_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(image.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image viewer modal */}
      <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {viewImage?.description || viewImage?.file_name}
            </DialogTitle>
          </DialogHeader>
          {viewImage && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={viewImage.url}
                  alt={viewImage.description || viewImage.file_name}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Uploaded on {new Date(viewImage.uploaded_at).toLocaleDateString()}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(viewImage.url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}