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

          // Add subtle center watermark
          const fontSize = Math.max(14, Math.min(img.width * 0.025, 28));
          ctx.font = `${fontSize}px Arial`;
          
          // Measure text to center it
          const textMetrics = ctx.measureText(watermarkText);
          const textWidth = textMetrics.width;
          
          // Position at center
          const centerX = img.width / 2;
          const centerY = img.height / 2;

          // Save context for rotation
          ctx.save();
          
          // Rotate 15 degrees for diagonal effect
          ctx.translate(centerX, centerY);
          ctx.rotate(-15 * Math.PI / 180);
          
          // Set very subtle styling
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.lineWidth = 0.5;
          
          // Draw watermark text at origin (now rotated center)
          ctx.fillText(watermarkText, -textWidth / 2, fontSize / 3);
          ctx.strokeText(watermarkText, -textWidth / 2, fontSize / 3);
          
          // Restore context
          ctx.restore();

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