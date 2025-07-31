import { supabase } from "@/integrations/supabase/client";

interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadFileToStorage = async (
  file: File,
  bucket: string = 'social-media-images',
  folder: string = ''
): Promise<FileUploadResult> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};