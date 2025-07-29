import { supabase } from "@/integrations/supabase/client";

export interface ImageUploadOptions {
  folder?: string;
  fileName?: string;
}

export const uploadImage = async (
  file: File,
  options: ImageUploadOptions = {}
): Promise<string | null> => {
  try {
    const { folder = 'general', fileName } = options;
    
    // Generate unique filename if not provided
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const finalFileName = fileName || `${timestamp}.${fileExt}`;
    
    // Construct the full path with folder
    const filePath = `${folder}/${finalFileName}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return null;
  }
};

export const deleteImage = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return false;
  }
};

export type ImageSize = 'thumbnail' | 'preview' | 'full';

export const getImageUrl = (filePath: string, size: ImageSize = 'full', quality?: number): string => {
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);
  
  if (size === 'full' && !quality) {
    return data.publicUrl;
  }
  
  // Add transformation parameters for optimized loading
  const params = new URLSearchParams();
  
  switch (size) {
    case 'thumbnail':
      params.set('width', '100');
      params.set('height', '100');
      params.set('quality', String(quality || 60));
      break;
    case 'preview':
      params.set('width', '400');
      params.set('height', '400');
      params.set('quality', String(quality || 75));
      break;
    case 'full':
      if (quality && quality < 90) {
        params.set('quality', String(quality));
      }
      break;
  }
  
  if (size !== 'full' || quality) {
    params.set('format', 'webp');
  }
  
  const transformParams = params.toString();
  return transformParams ? `${data.publicUrl}?${transformParams}` : data.publicUrl;
};