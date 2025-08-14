import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { SocialMediaPost } from '@/types/socialMedia';

export const generatePostPDF = async (post: SocialMediaPost): Promise<void> => {
  try {
    // Create a temporary container for the PDF content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.padding = '20mm';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Get the main image (prefer 1:1, then 4:3, then 16:9)
    const imageOrder = ['1_1', '4_3', '16_9'] as const;
    let mainImageUrl = '';
    
    for (const aspectKey of imageOrder) {
      const imageUrl = post[`image_${aspectKey}_url` as keyof SocialMediaPost] as string;
      if (imageUrl) {
        mainImageUrl = imageUrl;
        break;
      }
    }
    
    // Create PDF content HTML
    tempContainer.innerHTML = `
      <div style="max-width: 170mm; margin: 0 auto;">
        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #1a1a1a;">
          ${post.title}
        </h1>
        
        ${post.description ? `
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #4a4a4a;">
            ${post.description}
          </p>
        ` : ''}
        
        ${mainImageUrl ? `
          <div style="text-align: center; margin: 24px 0;">
            <img src="${mainImageUrl}" 
                 style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" 
                 alt="${post.title}" />
          </div>
        ` : ''}
        
        ${post.day ? `
          <div style="margin-top: 24px;">
            <span style="background: #f3f4f6; padding: 4px 12px; border-radius: 12px; font-size: 14px; color: #6b7280;">
              Day ${post.day}
            </span>
          </div>
        ` : ''}
        
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
          Generated from Social Media Post
        </div>
      </div>
    `;
    
    document.body.appendChild(tempContainer);
    
    // Wait for images to load
    const images = tempContainer.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      return new Promise((resolve, reject) => {
        if (img.complete) {
          resolve(img);
        } else {
          img.onload = () => resolve(img);
          img.onerror = reject;
        }
      });
    }));
    
    // Generate canvas from the container
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Clean up
    document.body.removeChild(tempContainer);
    
    // Download the PDF
    const fileName = `${post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

export const generateMultiplePostsPDF = async (posts: SocialMediaPost[]): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let isFirstPage = true;

    for (const post of posts) {
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      // Create a temporary container for each post
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.padding = '20mm';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Get the main image (prefer 1:1, then 4:3, then 16:9)
      const imageOrder = ['1_1', '4_3', '16_9'] as const;
      let mainImageUrl = '';
      
      for (const aspectKey of imageOrder) {
        const imageUrl = post[`image_${aspectKey}_url` as keyof SocialMediaPost] as string;
        if (imageUrl) {
          mainImageUrl = imageUrl;
          break;
        }
      }
      
      // Create PDF content HTML for this post
      tempContainer.innerHTML = `
        <div style="max-width: 170mm; margin: 0 auto;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #1a1a1a;">
            ${post.title}
          </h1>
          
          ${post.description ? `
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #4a4a4a;">
              ${post.description}
            </p>
          ` : ''}
          
          ${mainImageUrl ? `
            <div style="text-align: center; margin: 24px 0;">
              <img src="${mainImageUrl}" 
                   style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" 
                   alt="${post.title}" />
            </div>
          ` : ''}
          
          ${post.day ? `
            <div style="margin-top: 24px;">
              <span style="background: #f3f4f6; padding: 4px 12px; border-radius: 12px; font-size: 14px; color: #6b7280;">
                Day ${post.day}
              </span>
            </div>
          ` : ''}
        </div>
      `;
      
      document.body.appendChild(tempContainer);
      
      // Wait for images to load
      const images = tempContainer.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        return new Promise((resolve, reject) => {
          if (img.complete) {
            resolve(img);
          } else {
            img.onload = () => resolve(img);
            img.onerror = reject;
          }
        });
      }));
      
      // Generate canvas from the container
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Add to PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // If the content is too tall for one page, we might need to scale it down
      const maxHeight = 277; // A4 height minus margins
      const finalHeight = Math.min(imgHeight, maxHeight);
      const finalWidth = finalHeight === maxHeight ? (canvas.width * maxHeight) / canvas.height : imgWidth;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, finalWidth, finalHeight);
      
      // Clean up
      document.body.removeChild(tempContainer);
    }
    
    // Download the PDF
    const fileName = `social_media_posts_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating multiple posts PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};