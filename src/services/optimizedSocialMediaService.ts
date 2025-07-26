
import { supabase } from "@/integrations/supabase/client";
import type { SocialMediaPost, CreateSocialMediaPost } from "@/types/socialMedia";

// Enhanced service with caching and optimization
export class OptimizedSocialMediaService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private getCacheKey(category?: string, prefix = 'posts') {
    return `${prefix}:${category || 'all'}`;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < cached.ttl;
  }

  private setCache(key: string, data: any, ttl = 5 * 60 * 1000) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private getFromCache(key: string) {
    const cached = this.cache.get(key);
    return cached?.data;
  }

  async getAllPosts(category?: 'cdi' | 'contracts' | 'coding ai' | 'ai agents'): Promise<SocialMediaPost[]> {
    const cacheKey = this.getCacheKey(category);
    
    // Return cached data if valid
    if (this.isValidCache(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    let query = supabase
      .from('social_media_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    const posts = (data || []) as SocialMediaPost[];
    this.setCache(cacheKey, posts);
    return posts;
  }

  async createPost(post: CreateSocialMediaPost): Promise<SocialMediaPost> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('social_media_posts')
      .insert({
        ...post,
        category: post.category || 'cdi',
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Invalidate relevant caches
    this.invalidateCache(post.category);
    
    return data as SocialMediaPost;
  }

  async updatePost(id: string, updates: Partial<CreateSocialMediaPost>): Promise<SocialMediaPost> {
    const { data, error } = await supabase
      .from('social_media_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error(`Post with id ${id} not found`);
    
    // Invalidate relevant caches
    this.invalidateCache(updates.category);
    
    return data as SocialMediaPost;
  }

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('social_media_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Invalidate all caches since we don't know the category
    this.invalidateAllCaches();
  }

  async bulkImportPosts(category: string, posts: Array<{
    day?: number;
    title: string;
    description: string;
    theme?: string;
    status?: 'draft' | 'scheduled' | 'published';
  }>): Promise<number> {
    const { data, error } = await supabase
      .rpc('insert_category_content', {
        category_name: category,
        posts_data: posts
      });

    if (error) throw error;
    
    // Invalidate relevant caches
    this.invalidateCache(category);
    
    return data || 0;
  }

  async getAvailableCategories(): Promise<string[]> {
    const cacheKey = this.getCacheKey(undefined, 'categories');
    
    if (this.isValidCache(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    const { data, error } = await supabase
      .from('social_media_posts')
      .select('category');

    if (error) throw error;
    
    const categories = [...new Set((data || []).map((item: any) => item.category as string))];
    const filteredCategories = categories.filter(Boolean);
    
    this.setCache(cacheKey, filteredCategories, 10 * 60 * 1000); // 10 minutes
    return filteredCategories;
  }

  private invalidateCache(category?: string) {
    if (category) {
      this.cache.delete(this.getCacheKey(category));
    }
    this.cache.delete(this.getCacheKey()); // all posts cache
  }

  private invalidateAllCaches() {
    this.cache.clear();
  }
}

export const optimizedSocialMediaService = new OptimizedSocialMediaService();
