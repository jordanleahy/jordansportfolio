import { supabase } from "@/integrations/supabase/client";
import { BlogPost, BlogPostInput, VisualSection } from "@/types/simplifiedBlog";

// Unified data mapper to eliminate duplication
const mapBlogData = (data: any): BlogPost => ({
  ...data,
  visual_sections: data.visual_sections as VisualSection[],
  tldr_bullets: data.tldr_bullets as string[],
  meta_keywords: data.meta_keywords as string[] | undefined,
  tags: data.tags as string[] | undefined
});

// Single data access class with simplified methods
export class UnifiedBlogService {
  // Base query builder for reusability
  private static baseQuery() {
    return supabase.from('blog_posts').select('*');
  }

  // Published posts query with common filters
  private static publishedQuery() {
    return this.baseQuery().eq('status', 'published').order('published_at', { ascending: false });
  }

  // Get all published posts
  static async getPublishedPosts(): Promise<BlogPost[]> {
    const { data, error } = await this.publishedQuery();
    if (error) throw new Error(`Failed to fetch posts: ${error.message}`);
    return (data || []).map(mapBlogData);
  }

  // Get single post by slug or ID
  static async getPost(identifier: string, includeUnpublished = false): Promise<BlogPost | null> {
    let query = this.baseQuery();
    
    // Determine if identifier is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    query = isUUID ? query.eq('id', identifier) : query.eq('slug', identifier);
    
    if (!includeUnpublished) {
      query = query.eq('status', 'published');
    }
    
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`Failed to fetch post: ${error.message}`);
    return data ? mapBlogData(data) : null;
  }

  // Get posts by category
  static async getPostsByCategory(category: string): Promise<BlogPost[]> {
    const { data, error } = await this.publishedQuery().eq('category', category);
    if (error) throw new Error(`Failed to fetch posts: ${error.message}`);
    return (data || []).map(mapBlogData);
  }

  // Create or update post
  static async savePost(postInput: BlogPostInput, id?: string): Promise<BlogPost> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Authentication required');

    // Calculate computed fields
    const totalContent = [
      postInput.intro_content || '',
      ...(postInput.visual_sections || []).map(s => s.content || ''),
      postInput.deep_dive_content || ''
    ].join(' ');
    
    const wordCount = totalContent.split(/\s+/).filter(w => w.length > 0).length;
    const readTime = Math.ceil(wordCount / 200);
    const slug = postInput.hero_headline ? 
      postInput.hero_headline.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : 
      'untitled-post';

    const postData: any = {
      user_id: user.id,
      slug,
      word_count: wordCount,
      read_time: readTime,
      published_at: postInput.status === 'published' ? new Date().toISOString() : null,
      // Core required fields
      hero_headline: postInput.hero_headline || 'Untitled Post',
      hero_subhead: postInput.hero_subhead || 'Blog post description',
      hero_badge: postInput.hero_badge || undefined,
      intro_content: postInput.intro_content || 'Introduction content',
      visual_sections: postInput.visual_sections || [],
      tldr_title: 'TL;DR',
      tldr_bullets: postInput.tldr_bullets || [],
      cta_text: postInput.cta_text || 'Learn more',
      cta_url: postInput.cta_url || null,
      meta_title: postInput.meta_title || postInput.hero_headline || 'Untitled Post',
      meta_description: postInput.meta_description || postInput.hero_subhead || 'Blog post description',
      category: postInput.category || 'healthcare',
      tags: postInput.tags || undefined,
      theme: postInput.theme || undefined,
      status: postInput.status || 'draft',
      // Database compatibility fields
      share_enabled: true,
      featured: false,
      deep_dive_title: postInput.deep_dive_title || undefined,
      deep_dive_content: postInput.deep_dive_content || undefined,
      day: postInput.day || undefined,
      social_media_post_id: postInput.social_media_post_id || undefined,
    };

    const { data, error } = id ? 
      await supabase.from('blog_posts').update(postData).eq('id', id).select().single() :
      await supabase.from('blog_posts').insert(postData).select().single();

    if (error) throw new Error(`Failed to save post: ${error.message}`);
    return mapBlogData(data);
  }

  // Delete post
  static async deletePost(id: string): Promise<void> {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete post: ${error.message}`);
  }

  // Generate blog from social media post
  static async generateFromSocialPost(socialMediaPost: any): Promise<{
    success: boolean;
    blog_post?: BlogPost;
    redirect_url?: string;
    message: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { socialMediaPost }
      });

      if (error) throw new Error(`Generation failed: ${error.message}`);
      return data;
    } catch (error: any) {
      console.error('Blog generation error:', error);
      throw new Error(`Failed to generate blog: ${error.message}`);
    }
  }
}

export const unifiedBlogService = UnifiedBlogService;