
import jsPDF from 'jspdf';
import type { SocialMediaPost } from '@/types/socialMedia';

// Helper function to get image dimensions
const getImageDimensions = (imageDataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = imageDataUrl;
  });
};

// Helper function to convert pixels to PDF points (72 DPI)
const pixelsToPdfPoints = (pixels: number): number => {
  return pixels * 0.75; // 1 pixel = 0.75 points at 96 DPI
};

export const generatePostPDF = async (post: SocialMediaPost) => {
  let pdf: jsPDF | null = null;
  
  const images = [
    { url: post.image_1_1_url },
    { url: post.image_16_9_url },
    { url: post.image_9_16_url },
    { url: post.image_4_3_url },
    { url: post.image_3_4_url }
  ].filter(img => img.url);

  if (images.length === 0) {
    throw new Error('No images found to download');
  }

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const imageDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Get actual image dimensions
      const { width, height } = await getImageDimensions(imageDataUrl);
      
      // Convert pixels to PDF points
      const pdfWidth = pixelsToPdfPoints(width);
      const pdfHeight = pixelsToPdfPoints(height);

      // Create PDF with first image dimensions or add new page
      if (i === 0) {
        pdf = new jsPDF({
          unit: 'pt',
          format: [pdfWidth, pdfHeight]
        });
      } else {
        pdf!.addPage([pdfWidth, pdfHeight]);
      }

      // Add image at (0,0) with exact dimensions - no margins, no text
      pdf!.addImage(imageDataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
    } catch (error) {
      console.error(`Failed to add image:`, error);
      // Skip failed images instead of adding error text
      continue;
    }
  }

  if (!pdf) {
    throw new Error('Failed to create PDF');
  }

  // Generate filename with post title and timestamp
  const fileName = `${post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_images_${Date.now()}.pdf`;
  pdf.save(fileName);
};

export const generateMultiplePostsPDF = async (posts: SocialMediaPost[]) => {
  let pdf: jsPDF | null = null;
  let isFirstPage = true;

  for (const post of posts) {
    const images = [
      { url: post.image_1_1_url },
      { url: post.image_16_9_url },
      { url: post.image_9_16_url },
      { url: post.image_4_3_url },
      { url: post.image_3_4_url }
    ].filter(img => img.url);

    if (images.length === 0) continue;

    for (const image of images) {
      try {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const imageDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        // Get actual image dimensions
        const { width, height } = await getImageDimensions(imageDataUrl);
        
        // Convert pixels to PDF points
        const pdfWidth = pixelsToPdfPoints(width);
        const pdfHeight = pixelsToPdfPoints(height);

        // Create PDF with first image dimensions or add new page
        if (isFirstPage) {
          pdf = new jsPDF({
            unit: 'pt',
            format: [pdfWidth, pdfHeight]
          });
          isFirstPage = false;
        } else {
          pdf!.addPage([pdfWidth, pdfHeight]);
        }

        // Add image at (0,0) with exact dimensions - no margins, no text
        pdf!.addImage(imageDataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
      } catch (error) {
        console.error(`Failed to add image for post ${post.title}:`, error);
        // Skip failed images instead of adding error text
        continue;
      }
    }
  }

  if (!pdf) {
    throw new Error('No valid images found to create PDF');
  }

  const fileName = `social_media_images_${posts.length}_posts_${Date.now()}.pdf`;
  pdf.save(fileName);
};
