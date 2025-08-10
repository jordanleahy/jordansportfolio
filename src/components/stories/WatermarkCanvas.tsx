import React, { useRef, useEffect } from 'react';
import type { WatermarkCanvasProps } from '@/types/stories/ui';

export const WatermarkCanvas: React.FC<WatermarkCanvasProps> = ({
  file,
  watermarkText,
  onWatermarked,
  onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const addWatermark = async () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        // Create image from file
        const img = new Image();
        const imageUrl = URL.createObjectURL(file);
        
        img.onload = () => {
          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw the original image
          ctx.drawImage(img, 0, 0);

          // Add watermarks
          const centerText = 'JordanLeahy.com';
          const bottomText = 'Free Illustrations at Jordanleahy.com';

          // Center diagonal watermark (subtle)
          const centerFontSize = Math.max(24, Math.min(img.width * 0.05, 64));
          ctx.font = `${centerFontSize}px Arial`;
          const centerMetrics = ctx.measureText(centerText);
          const centerWidth = centerMetrics.width;

          const centerX = img.width / 2;
          const centerY = img.height / 2;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(-15 * Math.PI / 180);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.lineWidth = 1;
          ctx.fillText(centerText, -centerWidth / 2, centerFontSize / 3);
          ctx.strokeText(centerText, -centerWidth / 2, centerFontSize / 3);
          ctx.restore();

          // Bottom center watermark (small, readable)
          const bottomMargin = Math.max(12, img.height * 0.02);
          const bottomFontSize = Math.max(14, Math.min(img.width * 0.025, 28));
          ctx.font = `${bottomFontSize}px Arial`;
          const bottomMetrics = ctx.measureText(bottomText);
          const bottomWidth = bottomMetrics.width;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.lineWidth = 2;
          ctx.strokeText(bottomText, (img.width - bottomWidth) / 2, img.height - bottomMargin);
          ctx.fillText(bottomText, (img.width - bottomWidth) / 2, img.height - bottomMargin);

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const watermarkedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                onWatermarked(watermarkedFile);
              } else {
                onError('Failed to create watermarked image');
              }
            },
            file.type,
            0.9
          );

          // Clean up
          URL.revokeObjectURL(imageUrl);
        };

        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          onError('Failed to load image');
        };

        img.src = imageUrl;
      } catch (error) {
        onError('Failed to process image');
      }
    };

    addWatermark();
  }, [file, watermarkText, onWatermarked, onError]);

  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
};