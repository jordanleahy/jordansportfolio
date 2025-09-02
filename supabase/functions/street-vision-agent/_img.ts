import { decode, Image, GIF } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

/**
 * Fit w×h inside maxDim (preserve aspect). Returns [newW, newH].
 */
function fitWithin(w: number, h: number, maxDim: number): [number, number] {
  if (w <= maxDim && h <= maxDim) return [w, h];
  const scale = w >= h ? maxDim / w : maxDim / h;
  return [Math.max(1, Math.floor(w * scale)), Math.max(1, Math.floor(h * scale))];
}

/**
 * Convert arbitrary input into an RGBA PNG and ensure it stays under `targetMaxBytes`
 * by resizing (preserving aspect). Uses max PNG compression (level 9).
 *
 * Strategy:
 *  1) decode → RGBA
 *  2) initial clamp to `initialMaxDim`
 *  3) encode PNG
 *  4) if > target, iteratively scale by `stepScale` until under limit or `minDim`
 */
export async function toRgbaPngUnderSize(
  inputBytes: Uint8Array,
  {
    initialMaxDim = 1024,
    targetMaxBytes = 3_500_000, // ~3.5MB buffer under the 4MB API limit
    stepScale = 0.85,
    minDim = 512,
    maxIterations = 6,
    log = (msg: string, extra?: unknown) => {},
  }: {
    initialMaxDim?: number;
    targetMaxBytes?: number;
    stepScale?: number;
    minDim?: number;
    maxIterations?: number;
    log?: (msg: string, extra?: unknown) => void;
  } = {},
): Promise<{ png: Uint8Array; width: number; height: number; iterations: number }> {
  const decoded = await decode(inputBytes); // Image | GIF
  const base: Image =
    decoded instanceof Image ? decoded : (decoded as GIF).frames[0].image;

  let work = base.clone();
  log("img_opt:start", { w: work.width, h: work.height, bytes: inputBytes.byteLength });

  // Step 1: initial clamp to initialMaxDim
  if (work.width > initialMaxDim || work.height > initialMaxDim) {
    const [nw, nh] = fitWithin(work.width, work.height, initialMaxDim);
    work = work.resize(nw, nh);
    log("img_opt:initial_resize", { w: nw, h: nh });
  }

  // Step 2: encode & size check
  let png = await work.encode(9); // PNG compression level 0..9
  if (png.byteLength <= targetMaxBytes) {
    log("img_opt:done_initial_ok", { w: work.width, h: work.height, bytes: png.byteLength });
    return { png, width: work.width, height: work.height, iterations: 0 };
  }

  // Step 3: iterative shrink
  let iterations = 0;
  while (png.byteLength > targetMaxBytes && iterations < maxIterations) {
    const nextW = Math.max(Math.floor(work.width * stepScale), minDim);
    const nextH = Math.max(Math.floor(work.height * stepScale), minDim);

    if (nextW >= work.width && nextH >= work.height) break; // no change possible

    work = work.resize(nextW, nextH);
    png = await work.encode(9);
    iterations++;

    log("img_opt:shrink_iter", { iter: iterations, w: work.width, h: work.height, bytes: png.byteLength });
  }

  log("img_opt:final", { w: work.width, h: work.height, bytes: png.byteLength, iterations });

  return { png, width: work.width, height: work.height, iterations };
}

/**
 * Normalize a PNG mask to the exact dimensions of the final image.
 * The mask must already have transparent pixels (alpha=0) where edits apply.
 */
export async function normalizeMaskToPngForSize(
  maskBytes: Uint8Array,
  requiredWidth: number,
  requiredHeight: number,
): Promise<Uint8Array> {
  const decoded = await decode(maskBytes);
  const mask: Image =
    decoded instanceof Image ? decoded : (decoded as GIF).frames[0].image;

  // Resize mask to match required dimensions if needed
  if (mask.width !== requiredWidth || mask.height !== requiredHeight) {
    const resizedMask = mask.resize(requiredWidth, requiredHeight);
    return await resizedMask.encode(9);
  }

  return await mask.encode(9);
}

/**
 * Legacy function for backward compatibility - will be removed
 * @deprecated Use toRgbaPngUnderSize instead
 */
export async function ensureRgbaPng(inputBytes: Uint8Array): Promise<Uint8Array> {
  const result = await toRgbaPngUnderSize(inputBytes);
  return result.png;
}