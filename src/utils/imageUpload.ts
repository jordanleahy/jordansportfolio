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

export const getImageUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};