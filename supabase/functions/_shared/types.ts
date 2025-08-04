// Shared types for image generation edge functions

export interface ImageRequest {
  theme: string;
  category: string;
  userId: string;
  firstPostTitle?: string;
  firstPostDescription?: string;
}

export interface UserIdeaRequest {
  description: string;
  stream?: boolean;
}

export interface StreamingEvent {
  type: string;
  progress: number;
  data?: any;
  error?: string;
}

export interface ThemeData {
  category: string;
  theme: string;
  theme_description: string;
  posts: ThemePost[];
}

export interface ThemePost {
  day: number;
  title: string;
  description: string;
}

export interface SupabaseClient {
  from: (table: string) => any;
  storage: any;
  functions: any;
  auth: any;
}