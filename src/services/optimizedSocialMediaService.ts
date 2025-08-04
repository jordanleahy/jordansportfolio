
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

  async getAllPosts(category?: string): Promise<SocialMediaPost[]> {
    const cacheKey = this.getCacheKey(category);
    
    // Return cached data if valid
    if (this.isValidCache(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    let query = supabase
      .from('social_media_posts')
      .select('*')
      // Stable ordering: first by day (if exists), then by created_at, finally by id as tiebreaker
      .order('day', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    const posts = (data || []) as SocialMediaPost[];
    this.setCache(cacheKey, posts);
    return posts;
  }

  // Add new method for getting posts by category
  async getPostsByCategory(category: string): Promise<SocialMediaPost[]> {
    return this.getAllPosts(category);
  }

  // Add method for getting posts by theme
  async getPostsByTheme(theme: string): Promise<SocialMediaPost[]> {
    const cacheKey = `theme-posts:${theme}`;
    
    // Return cached data if valid
    if (this.isValidCache(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('theme', theme)
      .order('day', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true });

    if (error) throw error;
    
    const posts = (data || []) as SocialMediaPost[];
    this.setCache(cacheKey, posts);
    return posts;
  }

  // Add method for getting a single post by ID
  async getPostById(id: string): Promise<SocialMediaPost | null> {
    const cacheKey = `post:${id}`;
    
    // Return cached data if valid
    if (this.isValidCache(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    
    const post = data as SocialMediaPost | null;
    if (post) {
      this.setCache(cacheKey, post);
    }
    return post;
  }

  async createPost(post: CreateSocialMediaPost): Promise<SocialMediaPost> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // If no color theme is provided, use the default
    let colorThemeId = post.color_theme_id;
    if (!colorThemeId) {
      const { data: defaultTheme } = await supabase
        .from('color_themes')
        .select('id')
        .eq('is_default', true)
        .eq('is_system', true)
        .single();
      
      colorThemeId = defaultTheme?.id || null;
    }

    const { data, error } = await supabase
      .from('social_media_posts')
      .insert({
        ...post,
        category: post.category || 'cdi',
        user_id: user.id,
        color_theme_id: colorThemeId,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Invalidate relevant caches
    this.invalidateCache(post.category, data.theme);
    
    return data as SocialMediaPost;
  }

  async updatePost(id: string, updates: Partial<CreateSocialMediaPost>): Promise<SocialMediaPost> {
    console.log('🖼️ IMAGE_UPLOAD: Database update started', { postId: id, updates });
    
    const { data, error } = await supabase
      .from('social_media_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('🖼️ IMAGE_UPLOAD: Database update failed', { error, postId: id, updates });
      throw error;
    }
    if (!data) {
      console.error('🖼️ IMAGE_UPLOAD: No data returned from update', { postId: id, updates });
      throw new Error(`Post with id ${id} not found`);
    }
    
    console.log('🖼️ IMAGE_UPLOAD: Database update successful', { postId: id, updatedPost: data });
    
    // Invalidate relevant caches
    this.invalidateCache(updates.category, data.theme);
    
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

  async getAvailableThemes(): Promise<Array<{
    theme: string;
    theme_description: string | null;
    category: string;
    post_count: number;
    first_post: {
      id: string;
      title: string;
      description: string;
      image_url?: string;
    } | null;
  }>> {
    const cacheKey = this.getCacheKey(undefined, 'themes');
    
    if (this.isValidCache(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    // Check authentication first
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔐 SERVICE: getAvailableThemes - User authentication:', { 
      isAuthenticated: !!user, 
      userId: user?.id 
    });
    
    if (!user) {
      console.error('❌ SERVICE: No authenticated user for getAvailableThemes');
      return [];
    }

    // Get all posts grouped by theme with post counts and first post data
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('id, category, theme, theme_description, title, description, created_at, theme_image_4_3_url, image_16_9_url, image_4_3_url, image_9_16_url, image_3_4_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Group by theme (use theme_description as fallback, then category)
    const themeGroups = new Map<string, {
      theme: string;
      theme_description: string | null;
      category: string;
      posts: any[];
      latest_created_at: string;
    }>();
    
    (data || []).forEach((post: any) => {
      const themeKey = post.theme || post.theme_description || post.category;
      
      if (!themeGroups.has(themeKey)) {
        themeGroups.set(themeKey, {
          theme: themeKey,
          theme_description: post.theme_description,
          category: post.category,
          posts: [],
          latest_created_at: post.created_at
        });
      }
      
      const group = themeGroups.get(themeKey)!;
      group.posts.push(post);
      
      // Update latest date if this post is newer
      if (post.created_at > group.latest_created_at) {
        group.latest_created_at = post.created_at;
      }
    });
    
    // Convert to result format, sorted by latest creation date
    const themes = Array.from(themeGroups.values())
      .sort((a, b) => b.latest_created_at.localeCompare(a.latest_created_at))
      .map(group => {
        const firstPost = group.posts[0];
        const imageUrl = firstPost?.theme_image_4_3_url ||
                        firstPost?.image_16_9_url || 
                        firstPost?.image_4_3_url ||
                        firstPost?.image_9_16_url ||
                        firstPost?.image_3_4_url;
        
        return {
          theme: group.theme,
          theme_description: group.theme_description,
          category: group.category,
          post_count: group.posts.length,
          first_post: firstPost ? {
            id: firstPost.id,
            title: firstPost.title,
            description: firstPost.description,
            image_url: imageUrl
          } : null
        };
      });
    
    this.setCache(cacheKey, themes, 10 * 60 * 1000); // 10 minutes
    return themes;
  }

  // Keep the old method for backward compatibility
  async getAvailableCategories(): Promise<string[]> {
    const themes = await this.getAvailableThemes();
    return [...new Set(themes.map(t => t.category))];
  }

  async deleteTheme(themeOrCategory: string): Promise<void> {
    // Try to delete by theme first, then by category for backward compatibility
    const { error: themeError } = await supabase
      .from('social_media_posts')
      .delete()
      .eq('theme', themeOrCategory);

    if (themeError) {
      // If theme deletion fails, try category
      const { error: categoryError } = await supabase
        .from('social_media_posts')
        .delete()
        .eq('category', themeOrCategory);

      if (categoryError) throw categoryError;
    }

    // Clear relevant caches
    this.cache.delete(this.getCacheKey(themeOrCategory));
    this.cache.delete(`theme-posts:${themeOrCategory}`);
    this.cache.delete(this.getCacheKey(undefined, 'themes'));
    this.cache.delete(this.getCacheKey(undefined, 'categories'));
  }

  private invalidateCache(category?: string, theme?: string) {
    if (category) {
      this.cache.delete(this.getCacheKey(category));
    }
    if (theme) {
      this.cache.delete(`theme-posts:${theme}`);
    }
    this.cache.delete(this.getCacheKey()); // all posts cache
    this.cache.delete(this.getCacheKey(undefined, 'themes')); // themes cache
  }

  private invalidateAllCaches() {
    this.cache.clear();
  }
}

export const optimizedSocialMediaService = new OptimizedSocialMediaService();
