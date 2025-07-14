import { uploadImageToStorage, getStorageImageUrl } from './storageImageUpload';

interface ImageMigrationResult {
  originalPath: string;
  newUrl: string;
  success: boolean;
  error?: string;
}

// List of all images to migrate from /lovable-uploads/ to Supabase storage
const imagesToMigrate = [
  // Company logos
  '873ce045-f694-4990-8de2-acc4f4137e86.png',
  'd16887ac-0992-4a5a-84f5-043c66a1acd3.png', 
  '2cc42ee2-452d-41c2-a353-4d948c656a4a.png',
  '9e1e9048-62fc-4392-91bd-a5a82b8d5e42.png',
  
  // Case study hero images
  '4be80a48-e90b-4b76-af9c-259fe703976d.png', // Case 1 hero
  'ed730bb1-ba72-46ce-bfa8-1a7aa1f8e60d.png', // Case 3 hero
  '4c976661-d94f-48e5-ab44-e69c629f2f91.png', // Case 4 hero
  
  // Case 1 process images
  '8babb6cd-acf6-42ee-83c8-f2bad75762bc.png',
  '1301a9f1-c906-4800-a572-38f921f717bf.png',
  'e9e1093f-623d-4331-a500-749e8c9108c3.png',
  '865c082a-34b7-47d5-b45a-2385c872ed49.png',
  
  // Case 3 process images
  'f8bdf34c-98f3-483b-9033-2c28bda929cd.png',
  '3e1c498e-aaa3-49a7-a2ee-5c4b772223fb.png',
  'dfaaf33d-9dd1-4c76-8be2-bba0c4b46d98.png',
  '8558410b-841e-412e-a8ce-ef6084e9a684.png',
  
  // Case 4 process images
  '50dcd2f1-ee08-4212-8913-c8fbe7df89af.png',
  '6178eef1-7329-431e-a756-8d62bd36e0e5.png',
  
  // Recently uploaded images
  '9cd522b8-f130-45f8-8ddb-4e1e6d592f3a.png',
  '9ab2951c-a9db-42c3-8615-dc9f27c9603f.png'
];

export const migrateAllImages = async (): Promise<ImageMigrationResult[]> => {
  const results: ImageMigrationResult[] = [];
  
  console.log(`🚀 Starting migration of ${imagesToMigrate.length} images to Supabase storage...`);
  
  for (const fileName of imagesToMigrate) {
    const originalPath = `/lovable-uploads/${fileName}`;
    
    try {
      console.log(`📤 Migrating: ${fileName}`);
      
      const uploadResult = await uploadImageToStorage(
        originalPath,
        fileName,
        'case-studies' // Use a dedicated folder for case study images
      );
      
      if (uploadResult.success && uploadResult.url) {
        results.push({
          originalPath,
          newUrl: uploadResult.url,
          success: true
        });
        console.log(`✅ Successfully migrated: ${fileName}`);
      } else {
        results.push({
          originalPath,
          newUrl: '',
          success: false,
          error: uploadResult.error || 'Unknown error'
        });
        console.error(`❌ Failed to migrate ${fileName}:`, uploadResult.error);
      }
    } catch (error) {
      results.push({
        originalPath,
        newUrl: '',
        success: false,
        error: (error as Error).message
      });
      console.error(`❌ Error migrating ${fileName}:`, error);
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`🎉 Migration complete! ${successful} successful, ${failed} failed`);
  
  return results;
};

// Helper function to get the new Supabase URL for a given filename
export const getNewImageUrl = (fileName: string): string => {
  return getStorageImageUrl(fileName, 'case-studies');
};

// Helper function to extract filename from /lovable-uploads/ path
export const extractFileName = (path: string): string => {
  return path.replace('/lovable-uploads/', '');
};