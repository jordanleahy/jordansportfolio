export async function createWatermarkedImageFile(blob: Blob, originalFileName: string, mimeType: string = 'image/jpeg'): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          return reject(new Error('Canvas not supported'));
        }
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original
        ctx.drawImage(img, 0, 0);

        // Watermarks
        const centerText = 'JordanLeahy.com';
        const bottomText = 'Free Illustrations at Jordanleahy.com';

        // Center watermark
        const centerFontSize = Math.max(24, Math.min(img.width * 0.05, 64));
        ctx.font = `${centerFontSize}px Arial`;
        const centerWidth = ctx.measureText(centerText).width;
        ctx.save();
        ctx.translate(img.width / 2, img.height / 2);
        ctx.rotate(-15 * Math.PI / 180);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.fillText(centerText, -centerWidth / 2, centerFontSize / 3);
        ctx.strokeText(centerText, -centerWidth / 2, centerFontSize / 3);
        ctx.restore();

        // Bottom watermark
        const bottomMargin = Math.max(12, img.height * 0.02);
        const bottomFontSize = Math.max(14, Math.min(img.width * 0.025, 28));
        ctx.font = `${bottomFontSize}px Arial`;
        const bottomWidth = ctx.measureText(bottomText).width;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeText(bottomText, (img.width - bottomWidth) / 2, img.height - bottomMargin);
        ctx.fillText(bottomText, (img.width - bottomWidth) / 2, img.height - bottomMargin);

        canvas.toBlob((out) => {
          URL.revokeObjectURL(url);
          if (!out) return reject(new Error('Failed to create watermarked blob'));
          const ext = originalFileName.split('.').pop() || 'jpg';
          const name = originalFileName.replace(`.${ext}`, `__wm.${ext}`);
          resolve(new File([out], name, { type: mimeType }));
        }, mimeType, 0.9);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}
