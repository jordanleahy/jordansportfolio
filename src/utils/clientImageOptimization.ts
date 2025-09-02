/**
 * CLIENT-SIDE IMAGE OPTIMIZATION UTILITIES
 * 
 * Provides Canvas API-based image processing to resize and compress images
 * before upload, eliminating server-side processing complexity and stack overflow issues.
 */

export interface OptimizationOptions {
  maxDimension?: number;
  quality?: number;
  maxSizeBytes?: number;
  format?: 'jpeg' | 'png';
}

export interface OptimizationResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

/**
 * Optimizes an image file using Canvas API for client-side processing
 * Resizes to max dimension and compresses to target quality/size
 */
export async function optimizeImage(
  file: File, 
  options: OptimizationOptions = {}
): Promise<OptimizationResult> {
  const {
    maxDimension = 1024,
    quality = 0.85,
    maxSizeBytes = 3 * 1024 * 1024, // 3MB default
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions while preserving aspect ratio
        let { width, height } = calculateOptimalDimensions(
          img.naturalWidth, 
          img.naturalHeight, 
          maxDimension
        );

        // Create canvas for processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw resized image with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create optimized image blob'));
              return;
            }

            // If still too large, try with lower quality
            if (blob.size > maxSizeBytes && format === 'jpeg') {
              const lowerQuality = Math.max(0.5, quality - 0.2);
              canvas.toBlob(
                (retryBlob) => {
                  if (!retryBlob) {
                    reject(new Error('Failed to create compressed image blob'));
                    return;
                  }
                  
                  resolve({
                    blob: retryBlob,
                    width,
                    height,
                    originalSize: file.size,
                    optimizedSize: retryBlob.size,
                    compressionRatio: file.size / retryBlob.size
                  });
                },
                mimeType,
                lowerQuality
              );
            } else {
              resolve({
                blob,
                width,
                height,
                originalSize: file.size,
                optimizedSize: blob.size,
                compressionRatio: file.size / blob.size
              });
            }
          },
          mimeType,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for optimization'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate optimal dimensions while preserving aspect ratio
 */
function calculateOptimalDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxDimension: number
): { width: number; height: number } {
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (originalWidth > originalHeight) {
    // Landscape orientation
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio)
    };
  } else {
    // Portrait orientation
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension
    };
  }
}

/**
 * Create a File object from a Blob with the original filename
 */
export function blobToFile(blob: Blob, originalFilename: string): File {
  // Preserve original extension if compatible, otherwise use appropriate extension
  const originalExt = originalFilename.split('.').pop()?.toLowerCase();
  const blobType = blob.type;
  
  let finalFilename = originalFilename;
  
  // Ensure filename extension matches the blob type
  if (blobType === 'image/jpeg' && originalExt !== 'jpg' && originalExt !== 'jpeg') {
    finalFilename = originalFilename.replace(/\.[^.]+$/, '.jpg');
  } else if (blobType === 'image/png' && originalExt !== 'png') {
    finalFilename = originalFilename.replace(/\.[^.]+$/, '.png');
  }
  
  return new File([blob], finalFilename, { 
    type: blob.type,
    lastModified: Date.now()
  });
}