export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface SocialMediaPost {
  id: string;
  user_id: string;
  title: string;
  description: string;
  day?: number | null;
  image_16_9_url?: string | null;
  image_9_16_url?: string | null;
  image_3_4_url?: string | null;
  status: PostStatus;
  scheduled_date?: string | null;
  platform_tags?: any;
  generated_image_prompt?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSocialMediaPost {
  title: string;
  description: string;
  day?: number;
  image_16_9_url?: string;
  image_9_16_url?: string;
  image_3_4_url?: string;
  status?: PostStatus;
  scheduled_date?: string;
  platform_tags?: string[];
  generated_image_prompt?: string;
}