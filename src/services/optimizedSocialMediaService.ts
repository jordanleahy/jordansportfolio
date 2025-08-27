
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
      .select(`
        id,
        user_id,
        title,
        description,
        day,
        image_16_9_url,
        image_9_16_url,
        image_3_4_url,
        image_4_3_url,
        image_1_1_url,
        image_16_9_video_url,
        image_3_4_video_url,
        general_video_url,
        image_16_9_status,
        image_9_16_status,
        image_3_4_status,
        image_4_3_status,
        image_1_1_status,
        image_16_9_watermark_url,
        image_9_16_watermark_url,
        image_3_4_watermark_url,
        image_4_3_watermark_url,
        image_1_1_watermark_url,
        image_16_9_watermark_status,
        image_9_16_watermark_status,
        image_3_4_watermark_status,
        image_4_3_watermark_status,
        image_1_1_watermark_status,
        seed_value,
        color_theme_id,
        theme_id,
        status,
        scheduled_date,
        platform_tags,
        generated_image_prompt,
        category,
        created_at,
        updated_at
      `)
      // Stable ordering: first by day (if exists), then by created_at, finally by id as tiebreaker
      .order('day', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true });

    if (category) {
      // DEPRECATED: category filtering - use getPostsByThemeId instead for theme-specific queries
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    const posts = (data || []) as SocialMediaPost[];
    this.setCache(cacheKey, posts);
    return posts;
  }

  // DEPRECATED: Use getPostsByThemeId instead for theme-based queries
  async getPostsByCategory(category: string): Promise<SocialMediaPost[]> {
    console.warn('getPostsByCategory is deprecated. Use getPostsByThemeId for theme-based queries.');
    return this.getAllPosts(category);
  }

  // Add method for getting posts by theme ID
  async getPostsByThemeId(themeId: string): Promise<SocialMediaPost[]> {
    const cacheKey = `theme-posts:${themeId}`;
    
    // Return cached data if valid
    if (this.isValidCache(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    const { data, error } = await supabase
      .from('social_media_posts')
      .select(`
        id,
        user_id,
        title,
        description,
        day,
        image_16_9_url,
        image_9_16_url,
        image_3_4_url,
        image_4_3_url,
        image_1_1_url,
        image_16_9_video_url,
        image_3_4_video_url,
        general_video_url,
        image_16_9_status,
        image_9_16_status,
        image_3_4_status,
        image_4_3_status,
        image_1_1_status,
        image_16_9_watermark_url,
        image_9_16_watermark_url,
        image_3_4_watermark_url,
        image_4_3_watermark_url,
        image_1_1_watermark_url,
        image_16_9_watermark_status,
        image_9_16_watermark_status,
        image_3_4_watermark_status,
        image_4_3_watermark_status,
        image_1_1_watermark_status,
        seed_value,
        color_theme_id,
        theme_id,
        status,
        scheduled_date,
        platform_tags,
        generated_image_prompt,
        category,
        created_at,
        updated_at,
        themes!inner(*)
      `)
      .eq('theme_id', themeId)
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
      .select(`
        id,
        user_id,
        title,
        description,
        day,
        image_16_9_url,
        image_9_16_url,
        image_3_4_url,
        image_4_3_url,
        image_1_1_url,
        image_16_9_video_url,
        image_3_4_video_url,
        general_video_url,
        image_16_9_status,
        image_9_16_status,
        image_3_4_status,
        image_4_3_status,
        image_1_1_status,
        image_16_9_watermark_url,
        image_9_16_watermark_url,
        image_3_4_watermark_url,
        image_4_3_watermark_url,
        image_1_1_watermark_url,
        image_16_9_watermark_status,
        image_9_16_watermark_status,
        image_3_4_watermark_status,
        image_4_3_watermark_status,
        image_1_1_watermark_status,
        seed_value,
        color_theme_id,
        theme_id,
        status,
        scheduled_date,
        platform_tags,
        generated_image_prompt,
        category,
        created_at,
        updated_at
      `)
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
    console.log('🔐 CREATE_POST: Starting authentication check', { 
      timestamp: new Date().toISOString(),
      postData: { category: post.category, theme_id: post.theme_id }
    });

    // Get current session first for debugging
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔐 CREATE_POST: Session state', { 
      hasSession: !!session,
      sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      accessToken: session?.access_token ? 'present' : 'missing'
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔐 CREATE_POST: Auth result', { 
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
      timestamp: new Date().toISOString()
    });

    if (!user) {
      console.error('🔐 CREATE_POST: Authentication failed', { 
        authError,
        sessionExists: !!session,
        timestamp: new Date().toISOString()
      });
      throw new Error('User not authenticated');
    }

    console.log('🔐 CREATE_POST: Authentication successful, proceeding with post creation', { 
      userId: user.id,
      timestamp: new Date().toISOString()
    });

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
    this.invalidateCache(post.category);
    
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
        posts_data: posts,
        theme_id_param: null // Bulk import doesn't use theme relationships
      });

    if (error) throw error;
    
    // Invalidate relevant caches
    this.invalidateCache(category);
    
    // Handle the new JSON response format
    const result = data as { inserted_count: number } | null;
    return result?.inserted_count || 0;
  }

  async getAvailableThemes(): Promise<Array<{
    id: string;
    theme_name: string;
    theme_description: string | null;
    category: string;
    post_count: number;
    prompt_generation_status?: 'not_started' | 'in_progress' | 'completed';
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

    // Check authentication first with timeout
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔐 SERVICE: getAvailableThemes - User authentication:', { 
      isAuthenticated: !!user, 
      userId: user?.id 
    });
    
    console.log('📊 [BULK_CREATE] Checking for bulk image prompt creation opportunity');
    
    if (!user) {
      console.error('❌ SERVICE: No authenticated user for getAvailableThemes');
      return [];
    }

    // Get all themes including those in progress
    const { data: themes, error: themesError } = await supabase
      .from('themes')
      .select('id, theme_name, theme_description, category, created_at, prompt_generation_status, prompt_completion_count, total_posts_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (themesError) throw themesError;

    if (!themes || themes.length === 0) {
      this.setCache(cacheKey, [], 1 * 60 * 1000); // 1 minute cache for empty results
      return [];
    }

    // Get post counts efficiently using indexed columns with day and status info
    const themeIds = (themes as any[]).map(t => t.id);
    const { data: postData, error: postError } = await supabase
      .from('social_media_posts')
      .select(`
        theme_id,
        id,
        title,
        description,
        day,
        image_16_9_url,
        image_4_3_url,
        image_9_16_url,
        image_3_4_url,
        image_1_1_url,
        image_16_9_status,
        image_4_3_status,
        image_9_16_status,
        image_3_4_status,
        image_1_1_status,
        created_at
      `)
      .in('theme_id', themeIds)
      .eq('user_id', user.id)
      .neq('status', 'deleted')
      .order('day', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (postError) throw postError;

    // Group posts by theme_id for efficient processing
    const postsByTheme = (postData || []).reduce((acc, post) => {
      if (!acc[post.theme_id]) {
        acc[post.theme_id] = [];
      }
      acc[post.theme_id].push(post);
      return acc;
    }, {} as Record<string, any[]>);

    // Filter out incomplete themes (only show themes where all prompts are completed)
    const completedThemes = (themes as any[]).filter((theme: any) => 
      theme.prompt_generation_status === 'completed' &&
      theme.prompt_completion_count === theme.total_posts_count
    );
    
    const processedThemes = completedThemes.map((theme: any) => {
      const posts = postsByTheme[theme.id] || [];
      
      // Find Day 1 post first, then fall back to earliest post with image
      const day1Post = posts.find(p => p.day === 1);
      const postWithImage = posts.find(p => 
        p.image_16_9_url || p.image_4_3_url || p.image_9_16_url || p.image_3_4_url || p.image_1_1_url
      );
      const firstPost = day1Post || postWithImage || posts[0];
      
      const imageUrl = firstPost?.image_16_9_url ||
                      firstPost?.image_4_3_url ||
                      firstPost?.image_9_16_url ||
                      firstPost?.image_3_4_url ||
                      firstPost?.image_1_1_url;
      
      return {
        id: theme.id,
        theme_name: theme.theme_name,
        theme_description: theme.theme_description,
        category: theme.category,
        post_count: posts.length,
        prompt_generation_status: theme.prompt_generation_status,
        prompt_completion_count: theme.prompt_completion_count || 0,
        total_posts_count: theme.total_posts_count || 0,
        first_post: firstPost ? {
          id: firstPost.id,
          title: firstPost.title,
          description: firstPost.description,
          day: firstPost.day,
          image_url: imageUrl,
          image_16_9_url: firstPost.image_16_9_url,
          image_4_3_url: firstPost.image_4_3_url,
          image_9_16_url: firstPost.image_9_16_url,
          image_3_4_url: firstPost.image_3_4_url,
          image_1_1_url: firstPost.image_1_1_url,
          image_16_9_status: firstPost.image_16_9_status,
          image_4_3_status: firstPost.image_4_3_status,
          image_9_16_status: firstPost.image_9_16_status,
          image_3_4_status: firstPost.image_3_4_status,
          image_1_1_status: firstPost.image_1_1_status
        } : null
      };
    });
    
    this.setCache(cacheKey, processedThemes, 1 * 60 * 1000); // 1 minute cache for faster updates during theme creation
    return processedThemes;
  }

  // Keep the old method for backward compatibility
  async getAvailableCategories(): Promise<string[]> {
    const themes = await this.getAvailableThemes();
    return [...new Set(themes.map(t => t.category))];
  }

  async deleteTheme(themeId: string): Promise<void> {
    // Delete all posts associated with this theme
    const { error: postsError } = await supabase
      .from('social_media_posts')
      .delete()
      .eq('theme_id', themeId);

    if (postsError) throw postsError;

    // Delete the theme itself
    const { error: themeError } = await supabase
      .from('themes')
      .delete()
      .eq('id', themeId);

    if (themeError) throw themeError;

    // Clear relevant caches
    this.cache.delete(`theme-posts:${themeId}`);
    this.cache.delete(this.getCacheKey(undefined, 'themes'));
    this.invalidateAllCaches();
  }

  private invalidateCache(category?: string) {
    if (category) {
      this.cache.delete(this.getCacheKey(category));
    }
    this.cache.delete(this.getCacheKey()); // all posts cache
    this.cache.delete(this.getCacheKey(undefined, 'themes')); // themes cache
  }

  // Public helpers to handle stale or ghost UI entries
  public clearThemesCache() {
    this.cache.delete(this.getCacheKey(undefined, 'themes'));
  }

  public async refreshAvailableThemes() {
    this.clearThemesCache();
    return this.getAvailableThemes();
  }

  private invalidateAllCaches() {
    this.cache.clear();
  }
}
export const optimizedSocialMediaService = new OptimizedSocialMediaService();
