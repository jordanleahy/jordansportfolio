import gifshot from 'gifshot';
import { uploadVideoToStorage } from './videoUpload';

export interface GifOptions {
  width?: number;
  height?: number;
  numFrames?: number;
  frameDuration?: number;
  sampleInterval?: number;
}

const DEFAULT_GIF_OPTIONS: GifOptions = {
  width: 320,
  height: 240,
  numFrames: 25,
  frameDuration: 0.2,
  sampleInterval: 0.2,
};

export const generateGifFromVideo = (
  videoUrl: string,
  options: GifOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const finalOptions = { ...DEFAULT_GIF_OPTIONS, ...options };
    
    gifshot.createGIF({
      video: [videoUrl],
      gifWidth: finalOptions.width,
      gifHeight: finalOptions.height,
      numFrames: finalOptions.numFrames,
      frameDuration: finalOptions.frameDuration,
      sampleInterval: finalOptions.sampleInterval,
    }, (obj) => {
      if (obj.error) {
        reject(new Error(obj.errorMsg || 'Failed to generate GIF'));
      } else {
        resolve(obj.image);
      }
    });
  });
};

export const generateAndUploadGif = async (
  videoUrl: string,
  options: GifOptions = {}
): Promise<string> => {
  try {
    // Generate GIF as base64 data URL
    const gifDataUrl = await generateGifFromVideo(videoUrl, options);
    
    // Convert data URL to blob
    const response = await fetch(gifDataUrl);
    const blob = await response.blob();
    
    // Create file from blob
    const timestamp = Date.now();
    const file = new File([blob], `gif_${timestamp}.gif`, { type: 'image/gif' });
    
    // Upload to storage
    const result = await uploadVideoToStorage(file);
    if (result.success && result.url) {
      return result.url;
    } else {
      throw new Error(result.error || 'Failed to upload GIF');
    }
  } catch (error) {
    console.error('Error generating and uploading GIF:', error);
    throw error;
  }
};