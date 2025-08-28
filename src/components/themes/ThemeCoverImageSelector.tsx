import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Theme } from '@/types/stories/domain';

interface ThemeCoverImageSelectorProps {
  theme: Theme;
  onUpdate: () => void;
  className?: string;
}

export function ThemeCoverImageSelector({ theme, onUpdate, className }: ThemeCoverImageSelectorProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${theme.id}/cover.${fileExt}`;
      const filePath = `theme-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('theme-covers')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('theme-covers')
        .getPublicUrl(filePath);

      // Update theme record
      const { error: updateError } = await supabase
        .from('themes')
        .update({ cover_image_url: publicUrl })
        .eq('id', theme.id);

      if (updateError) throw updateError;

      toast.success('Cover image updated successfully');
      onUpdate();
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Failed to upload cover image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    try {
      setIsUploading(true);

      const { error } = await supabase
        .from('themes')
        .update({ cover_image_url: null })
        .eq('id', theme.id);

      if (error) throw error;

      toast.success('Cover image removed');
      onUpdate();
    } catch (error) {
      console.error('Error removing cover image:', error);
      toast.error('Failed to remove cover image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <ImageIcon className="h-4 w-4" />
        Theme Cover Image
      </div>
      
      {theme.cover_image_url ? (
        <div className="space-y-2">
          <div className="relative inline-block">
            <img 
              src={theme.cover_image_url} 
              alt="Theme cover" 
              className="w-20 h-20 object-cover rounded border"
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemoveCover}
              disabled={isUploading}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This image will appear in the theme list and public collections
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id={`cover-upload-${theme.id}`}
            />
            <Button 
              variant="outline" 
              disabled={isUploading}
              className="w-full"
              asChild
            >
              <label htmlFor={`cover-upload-${theme.id}`} className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Cover Image'}
              </label>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Choose an image to represent this theme
          </p>
        </div>
      )}
    </div>
  );
}