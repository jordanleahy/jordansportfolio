import { useToast } from '@/hooks/use-toast';

// Common toast patterns used throughout the app
export const createToastHelpers = () => {
  const { toast } = useToast();

  return {
    success: (title: string, description?: string) => {
      toast({
        title,
        description,
      });
    },

    error: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "destructive",
      });
    },

    // Post-specific toasts
    postStatusUpdated: (status: string) => {
      toast({
        title: "Success",
        description: `Post ${status === 'published' ? 'published' : 'updated'} successfully`,
      });
    },

    contentCopied: () => {
      toast({
        title: "Content copied!",
        description: "Post content has been copied to clipboard",
      });
    },

    imageUploaded: () => {
      toast({
        title: "Image uploaded successfully",
        description: "Your image has been uploaded and is being processed",
      });
    },

    imageGenerated: () => {
      toast({
        title: "Image generated successfully",
        description: "Your AI-generated image is ready",
      });
    },

    blogCreated: () => {
      toast({
        title: "Blog post created!",
        description: "Redirecting to your new blog post...",
      });
    },

    // Error toasts
    uploadFailed: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },

    generationFailed: () => {
      toast({
        title: "Generation failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    },

    invalidFileType: () => {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
    },

    fileTooLarge: () => {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
    },

    authRequired: () => {
      toast({
        title: "Error",
        description: "User authentication required",
        variant: "destructive",
      });
    }
  };
};