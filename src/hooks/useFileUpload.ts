import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseFileUploadOptions {
  bucket?: string;
  folder?: string;
}

export function useFileUpload({ bucket = 'general', folder = 'job-applications' }: UseFileUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file) return null;

    setUploading(true);
    setProgress(0);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload files');
        return null;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${cleanFileName}`;
      
      // For job-applications bucket, use user ID as the folder structure expected by RLS policies
      let filePath: string;
      if (bucket === 'job-applications') {
        filePath = `${user.id}/${fileName}`;
      } else {
        filePath = folder ? `${folder}/${fileName}` : fileName;
      }

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error(`Upload failed: ${error.message}`);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress(100);
      toast.success('File uploaded successfully');
      return urlData.publicUrl;

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
      // Extract path from URL if needed
      const pathToDelete = filePath.includes('supabase.co') 
        ? filePath.split('/').slice(-2).join('/')
        : filePath;

      const { error } = await supabase.storage
        .from(bucket)
        .remove([pathToDelete]);

      if (error) {
        console.error('Delete error:', error);
        toast.error(`Delete failed: ${error.message}`);
        return false;
      }

      toast.success('File deleted successfully');
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed. Please try again.');
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress
  };
}