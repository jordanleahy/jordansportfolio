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
    const validation = isVideoFile(file);
    if (!validation.isValid) {
      console.log('Upload validation failed:', validation.reason);
      return { success: false, error: validation.reason || 'Invalid video file' };
    }

    // File size already validated in isVideoFile, but keep as backup
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { success: false, error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 50MB limit` };
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

interface VideoValidationResult {
  isValid: boolean;
  reason?: string;
}

export const isVideoFile = (file: File): VideoValidationResult => {
  console.log('Validating file:', {
    name: file.name,
    type: file.type,
    size: file.size,
    sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
  });
  
  // Get file extension (primary validation for Chrome compatibility)
  const extension = file.name.toLowerCase().split('.').pop();
  const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'm4v', '3gp'];
  
  // Primary check: file extension (most reliable in Chrome)
  const hasValidExtension = videoExtensions.includes(extension || '');
  
  // Secondary check: MIME type (when available)
  const hasValidMimeType = file.type.startsWith('video/');
  
  // Chrome-specific handling: some .mp4 files have empty MIME type
  const isChromeCompatible = hasValidExtension && (hasValidMimeType || file.type === '');
  
  console.log('Validation results:', {
    extension,
    hasValidExtension,
    hasValidMimeType,
    isChromeCompatible,
    mimeType: file.type || 'empty'
  });
  
  if (!hasValidExtension) {
    return {
      isValid: false,
      reason: `Unsupported file type "${extension}". Please select a video file (${videoExtensions.slice(0, 5).join(', ')}, etc.)`
    };
  }
  
  // File size validation (50MB limit)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      reason: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 50MB limit`
    };
  }
  
  if (file.size === 0) {
    return {
      isValid: false,
      reason: 'File appears to be empty'
    };
  }
  
  return { isValid: true };
};

export const getSupportedVideoFormats = (): string[] => {
  return ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
};