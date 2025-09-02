import { decode, Image, GIF } from "https://deno.land/x/imagescript@1.2.16/mod.ts";

/**
 * Ensures the provided bytes are a PNG with an alpha channel (RGBA),
 * preserving dimensions. Works for JPEG/PNG/WEBP/TIFF/GIF inputs.
 */
export async function ensureRgbaPng(inputBytes: Uint8Array): Promise<Uint8Array> {
  const decoded = await decode(inputBytes); // -> Image | GIF
  const base = decoded instanceof Image ? decoded : (decoded as GIF).frames[0].image;

  // At this point `base.bitmap` is RGBA pixel data. Encoding as PNG preserves the alpha channel.
  // If the source had no alpha, this produces a fully opaque alpha=255 layer (still RGBA).
  const pngBytes = await base.encode(9); // compression level 0..9
  return pngBytes;
}

/**
 * Optional: make sure a mask is valid PNG with transparency, same dimensions as the image.
 * If you need to auto-create a full-edit mask (edit everything), return a transparent PNG
 * the same size as the image and let the prompt drive the change.
 */
export async function normalizeMaskToPng(maskBytes: Uint8Array, width?: number, height?: number) {
  const decoded = await decode(maskBytes);
  const mask = decoded instanceof Image ? decoded : (decoded as GIF).frames[0].image;

  // If caller provided required dimensions (e.g., from the image), enforce them.
  if (width && height && (mask.width !== width || mask.height !== height)) {
    throw new Error(`Mask dimensions ${mask.width}x${mask.height} must match image ${width}x${height}.`);
  }
  return await mask.encode(9);
}