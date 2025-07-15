import React, { useRef, useEffect } from 'react';

interface WatermarkCanvasProps {
  file: File;
  watermarkText: string;
  onWatermarked: (watermarkedFile: File) => void;
  onError: (error: string) => void;
}

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

          // Add watermark
          const fontSize = Math.max(16, Math.min(img.width * 0.03, 32));
          ctx.font = `${fontSize}px Arial`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.lineWidth = 1;

          // Measure text to center it
          const textMetrics = ctx.measureText(watermarkText);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;

          // Position at bottom center
          const x = (img.width - textWidth) / 2;
          const y = img.height - 20;

          // Add background rectangle
          const padding = 8;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(
            x - padding,
            y - textHeight - padding / 2,
            textWidth + padding * 2,
            textHeight + padding
          );

          // Add watermark text
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(watermarkText, x, y);
          ctx.strokeText(watermarkText, x, y);

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