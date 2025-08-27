
export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface SocialMediaPost {
  id: string;
  user_id: string;
  title: string;
  description: string; // Changed from story_description to description
  day?: number | null;
  image_16_9_url?: string | null;
  image_9_16_url?: string | null;
  image_3_4_url?: string | null;
  image_4_3_url?: string | null;
  image_1_1_url?: string | null;
  image_16_9_video_url?: string | null;
  image_3_4_video_url?: string | null;
  general_video_url?: string | null;
  
  // Image processing status fields
  image_16_9_status?: 'none' | 'uploading' | 'processing' | 'complete' | 'failed';
  image_9_16_status?: 'none' | 'uploading' | 'processing' | 'complete' | 'failed';
  image_3_4_status?: 'none' | 'uploading' | 'processing' | 'complete' | 'failed';
  image_4_3_status?: 'none' | 'uploading' | 'processing' | 'complete' | 'failed';
  image_1_1_status?: 'none' | 'uploading' | 'processing' | 'complete' | 'failed';
  
  // Watermarked image URLs
  image_16_9_watermark_url?: string | null;
  image_9_16_watermark_url?: string | null;
  image_3_4_watermark_url?: string | null;
  image_4_3_watermark_url?: string | null;
  image_1_1_watermark_url?: string | null;
  
  // Watermark processing status fields
  image_16_9_watermark_status?: 'none' | 'processing' | 'complete' | 'failed';
  image_9_16_watermark_status?: 'none' | 'processing' | 'complete' | 'failed';
  image_3_4_watermark_status?: 'none' | 'processing' | 'complete' | 'failed';
  image_4_3_watermark_status?: 'none' | 'processing' | 'complete' | 'failed';
  image_1_1_watermark_status?: 'none' | 'processing' | 'complete' | 'failed';
  
  // Seed management
  seed_value?: number | null;
  
  // Color theme
  color_theme_id?: string | null;
  
  // Theme relationship
  theme_id?: string | null;
  
  status: PostStatus;
  scheduled_date?: string | null;
  platform_tags?: any;
  generated_image_prompt?: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSocialMediaPost {
  title: string;
  description: string; // Changed from story_description to description
  day?: number;
  image_16_9_url?: string;
  image_9_16_url?: string;
  image_3_4_url?: string;
  image_4_3_url?: string;
  image_16_9_video_url?: string;
  image_3_4_video_url?: string;
  general_video_url?: string;
  
  // Color theme
  color_theme_id?: string;
  
  // Theme relationship
  theme_id?: string;
  
  status?: PostStatus;
  scheduled_date?: string;
  platform_tags?: string[];
  generated_image_prompt?: string;
  category?: string;
}
