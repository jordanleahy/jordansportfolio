import { supabase } from "@/integrations/supabase/client";

interface VideoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadVideoToStorage = async (
  file: File,
  bucket: string = 'general',
  folder: string = 'social-media-videos'
): Promise<VideoUploadResult> => {
  try {
    // Validate file type using enhanced detection
    if (!isVideoFile(file)) {
      console.log('Upload validation failed for file:', file.name, 'type:', file.type);
      return { success: false, error: 'Please select a video file' };
    }

    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { success: false, error: 'Video file size must be less than 50MB' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

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

export const isVideoFile = (file: File): boolean => {
  console.log('Checking file type:', file.type, 'for file:', file.name);
  
  // Check MIME type first
  if (file.type.startsWith('video/')) {
    return true;
  }
  
  // Fallback: check file extension if MIME type is not detected
  const extension = file.name.toLowerCase().split('.').pop();
  const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'flv', 'wmv'];
  
  const isVideo = videoExtensions.includes(extension || '');
  console.log('File extension check:', extension, 'is video:', isVideo);
  
  return isVideo;
};

export const getSupportedVideoFormats = (): string[] => {
  return ['.mp4', '.webm', '.ogg', '.avi', '.mov'];
};