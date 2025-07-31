export interface ImageSeed {
  id: string;
  user_id: string;
  name: string;
  seed_value: number;
  description?: string;
  category: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateImageSeedRequest {
  name: string;
  seed_value: number;
  description?: string;
  category: string;
  is_default?: boolean;
}

export interface UpdateImageSeedRequest {
  name?: string;
  seed_value?: number;
  description?: string;
  category?: string;
  is_default?: boolean;
}