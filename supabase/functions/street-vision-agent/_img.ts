/**
 * Ensures the provided bytes are a PNG with an alpha channel (RGBA) using Canvas API.
 * This approach works reliably in Supabase edge functions without external dependencies.
 */
export async function ensureRgbaPng(inputBytes: Uint8Array): Promise<Uint8Array> {
  try {
    // Try ImageScript first
    const { decode, Image, GIF } = await import("https://deno.land/x/imagescript@1.3.0/mod.ts");
    const decoded = await decode(inputBytes);
    const base = decoded instanceof Image ? decoded : (decoded as GIF).frames[0].image;
    return await base.encode(9);
  } catch (error) {
    console.log('ImageScript failed, falling back to Canvas API:', error.message);
    
    // Fallback to Canvas API approach
    const canvas = new OffscreenCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Create image from bytes
    const blob = new Blob([inputBytes]);
    const imageBitmap = await createImageBitmap(blob);
    
    // Set canvas size to match image
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    
    // Draw image to canvas (this automatically adds alpha channel)
    ctx.drawImage(imageBitmap, 0, 0);
    
    // Convert to PNG with alpha channel
    const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
    const arrayBuffer = await pngBlob.arrayBuffer();
    
    return new Uint8Array(arrayBuffer);
  }
}

/**
 * Optional: make sure a mask is valid PNG with transparency, same dimensions as the image.
 * This function is currently not used but kept for potential future mask functionality.
 */
export async function normalizeMaskToPng(maskBytes: Uint8Array, width?: number, height?: number): Promise<Uint8Array> {
  // For now, just return the input bytes as this function isn't currently used
  // In the future, this could be enhanced with proper mask processing
  return maskBytes;
}