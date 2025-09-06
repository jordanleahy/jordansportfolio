import { supabase } from "@/integrations/supabase/client";

interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadImageToStorage = async (
  sourceUrl: string,
  fileName: string,
  folder: string = 'hero-parallax'
): Promise<ImageUploadResult> => {
  try {
    // Download the image from the source URL
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      return { success: false, error: `Failed to fetch image: ${response.statusText}` };
    }
    
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: blob.type });
    
    // Upload to Supabase storage
    const filePath = `${folder}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        upsert: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

export const getStorageImageUrl = (fileName: string, folder: string = 'hero-parallax'): string => {
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(`${folder}/${fileName}`);
  
  return data.publicUrl;
};

// Migration function to upload all hero parallax images
export const migrateHeroParallaxImages = async () => {
  const imagesToMigrate = [
    'f8bdf34c-98f3-483b-9033-2c28bda929cd.png',
    '4be80a48-e90b-4b76-af9c-259fe703976d.png',
    '3e1c498e-aaa3-49a7-a2ee-5c4b772223fb.png',
    'dfaaf33d-9dd1-4c76-8be2-bba0c4b46d98.png',
    '8558410b-841e-412e-a8ce-ef6084e9a684.png',
    '873ce045-f694-4990-8de2-acc4f4137e86.png',
    '9e1e9048-62fc-4392-91bd-a5a82b8d5e42.png',
    'Day%201%20What%20Is%20Clinical%20Documentation%20Integrity%20%20169.png',
    'd16887ac-0992-4a5a-84f5-043c66a1acd3.png',
    'ed730bb1-ba72-46ce-bfa8-1a7aa1f8e60d.png',
    '8c1110c1-02c2-4041-987c-a9d030ffef3b.png',
    '4c976661-d94f-48e5-ab44-e69c629f2f91.png',
    '762c3624-2485-4556-b7c7-63709fc409aa.png'
  ];

  const results = [];
  
  for (const fileName of imagesToMigrate) {
    const sourceUrl = `/lovable-uploads/${fileName}`;
    const result = await uploadImageToStorage(sourceUrl, fileName);
    results.push({ fileName, ...result });
    
    if (result.success) {
      console.log(`✅ Successfully uploaded: ${fileName}`);
    } else {
      console.error(`❌ Failed to upload ${fileName}:`, result.error);
    }
  }
  
  return results;
};