
import jsPDF from 'jspdf';
import type { SocialMediaPost } from '@/types/socialMedia';

export const generatePostPDF = async (post: SocialMediaPost) => {
  const pdf = new jsPDF();
  let yPosition = 20;
  
  // Only add images, no text content
  const images = [
    { url: post.image_1_1_url, label: '1:1 Square' },
    { url: post.image_16_9_url, label: '16:9 Landscape' },
    { url: post.image_9_16_url, label: '9:16 Portrait' },
    { url: post.image_4_3_url, label: '4:3 Standard' },
    { url: post.image_3_4_url, label: '3:4 Social' }
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

      // Add new page for each image (except the first)
      if (i > 0) {
        pdf.addPage();
        yPosition = 20;
      }

      // Add small label for the aspect ratio
      pdf.setFontSize(10);
      pdf.text(image.label, 20, yPosition);
      yPosition += 10;

      // Calculate image dimensions to fit on page
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxWidth = pageWidth - 40; // 20px margin on each side
      const maxHeight = pageHeight - yPosition - 20; // Leave space at bottom

      let imgWidth = maxWidth;
      let imgHeight = maxWidth * 0.75; // Default aspect ratio

      // If image height exceeds page, scale down
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight / 0.75;
      }

      pdf.addImage(imageDataUrl, 'JPEG', 20, yPosition, imgWidth, imgHeight);
      
    } catch (error) {
      console.error(`Failed to add image ${image.label}:`, error);
      // Add error text instead of image
      pdf.setFontSize(12);
      pdf.text(`Failed to load ${image.label} image`, 20, yPosition + 20);
    }
  }

  // Generate filename with post title and timestamp
  const fileName = `${post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_images_${Date.now()}.pdf`;
  pdf.save(fileName);
};

export const generateMultiplePostsPDF = async (posts: SocialMediaPost[]) => {
  const pdf = new jsPDF();
  let isFirstPage = true;

  for (const post of posts) {
    const images = [
      { url: post.image_1_1_url, label: '1:1 Square' },
      { url: post.image_16_9_url, label: '16:9 Landscape' },
      { url: post.image_9_16_url, label: '9:16 Portrait' },
      { url: post.image_4_3_url, label: '4:3 Standard' },
      { url: post.image_3_4_url, label: '3:4 Social' }
    ].filter(img => img.url);

    if (images.length === 0) continue;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        // Add new page (except for the very first)
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        let yPosition = 20;

        // Add post title and image label
        pdf.setFontSize(14);
        pdf.text(post.title, 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(10);
        pdf.text(image.label, 20, yPosition);
        yPosition += 10;

        const response = await fetch(image.url);
        const blob = await response.blob();
        const imageDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        // Calculate image dimensions
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const maxWidth = pageWidth - 40;
        const maxHeight = pageHeight - yPosition - 20;

        let imgWidth = maxWidth;
        let imgHeight = maxWidth * 0.75;

        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = imgHeight / 0.75;
        }

        pdf.addImage(imageDataUrl, 'JPEG', 20, yPosition, imgWidth, imgHeight);
        
      } catch (error) {
        console.error(`Failed to add image for post ${post.title}:`, error);
      }
    }
  }

  const fileName = `social_media_images_${posts.length}_posts_${Date.now()}.pdf`;
  pdf.save(fileName);
};
