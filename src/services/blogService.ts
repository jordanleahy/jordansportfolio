import { supabase } from "@/integrations/supabase/client";
import { BlogPost, BlogPostInput, BlogPostSchema, calculateWordCount, calculateReadTime, generateSlug, VisualSection } from "@/types/blog";

export class BlogService {
  
  static async getAllPublishedPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch blog posts: ${error.message}`);
    }

    return (data || []).map(post => ({
      ...post,
      visual_sections: post.visual_sections as unknown as VisualSection[],
      tldr_bullets: post.tldr_bullets as unknown as string[],
      meta_keywords: post.meta_keywords as unknown as string[] | undefined,
      tags: post.tags as unknown as string[] | undefined
    })) as unknown as BlogPost[];
  }

  static async getPostBySlug(slug: string, includeUnpublished = false): Promise<BlogPost | null> {
    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug);
    
    if (!includeUnpublished) {
      query = query.eq('status', 'published');
    }
    
    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch blog post: ${error.message}`);
    }

    return data ? {
      ...data,
      visual_sections: data.visual_sections as unknown as VisualSection[],
      tldr_bullets: data.tldr_bullets as unknown as string[],
      meta_keywords: data.meta_keywords as unknown as string[] | undefined,
      tags: data.tags as unknown as string[] | undefined
    } as unknown as BlogPost : null;
  }

  static async getFeaturedPost(): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .eq('featured', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch featured post: ${error.message}`);
    }

    return data ? {
      ...data,
      visual_sections: data.visual_sections as unknown as VisualSection[],
      tldr_bullets: data.tldr_bullets as unknown as string[],
      meta_keywords: data.meta_keywords as unknown as string[] | undefined,
      tags: data.tags as unknown as string[] | undefined
    } as unknown as BlogPost : null;
  }

  static async getPostsByCategory(category: string): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .eq('category', category)
      .order('published_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts by category: ${error.message}`);
    }

    return (data || []).map(post => ({
      ...post,
      visual_sections: post.visual_sections as unknown as VisualSection[],
      tldr_bullets: post.tldr_bullets as unknown as string[],
      meta_keywords: post.meta_keywords as unknown as string[] | undefined,
      tags: post.tags as unknown as string[] | undefined
    })) as unknown as BlogPost[];
  }

  static async getPostById(id: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch blog post: ${error.message}`);
    }

    return data ? {
      ...data,
      visual_sections: data.visual_sections as unknown as VisualSection[],
      tldr_bullets: data.tldr_bullets as unknown as string[],
      meta_keywords: data.meta_keywords as unknown as string[] | undefined,
      tags: data.tags as unknown as string[] | undefined
    } as unknown as BlogPost : null;
  }

  static async getNextBlogPost(currentSlug: string): Promise<BlogPost | null> {
    // First get the current post's published_at date
    const { data: currentPost, error: currentError } = await supabase
      .from('blog_posts')
      .select('published_at')
      .eq('slug', currentSlug)
      .eq('status', 'published')
      .maybeSingle();

    if (currentError || !currentPost) {
      return null;
    }

    // Find the next published post after this one
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .gt('published_at', currentPost.published_at)
      .order('published_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch next blog post:', error.message);
      return null;
    }

    // If no next post found, get the first (oldest) published post
    if (!data) {
      const { data: firstPost, error: firstError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstError || !firstPost) {
        return null;
      }

      return {
        ...firstPost,
        visual_sections: firstPost.visual_sections as unknown as VisualSection[],
        tldr_bullets: firstPost.tldr_bullets as unknown as string[],
        meta_keywords: firstPost.meta_keywords as unknown as string[] | undefined,
        tags: firstPost.tags as unknown as string[] | undefined
      } as unknown as BlogPost;
    }

    return {
      ...data,
      visual_sections: data.visual_sections as unknown as VisualSection[],
      tldr_bullets: data.tldr_bullets as unknown as string[],
      meta_keywords: data.meta_keywords as unknown as string[] | undefined,
      tags: data.tags as unknown as string[] | undefined
    } as unknown as BlogPost;
  }

  static async createPost(postInput: BlogPostInput): Promise<BlogPost> {
    // Optional validation - allow empty posts
    const validatedPost = postInput;
    
    // Calculate computed fields with fallbacks
    const totalContent = [
      validatedPost.intro_content || '',
      ...(validatedPost.visual_sections || []).map(s => s.content || ''),
      validatedPost.deep_dive_content || ''
    ].join(' ');
    
    const wordCount = calculateWordCount(totalContent);
    const readTime = calculateReadTime(wordCount);
    
    // Generate slug with fallback
    const slug = generateSlug(validatedPost.hero_headline || 'untitled-post');

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User must be authenticated to create posts');
    }

    const postData = {
      ...validatedPost,
      user_id: user.id,
      slug,
      word_count: wordCount,
      read_time: readTime,
      published_at: validatedPost.status === 'published' ? new Date().toISOString() : null,
      hero_headline: validatedPost.hero_headline || '',
      hero_subhead: validatedPost.hero_subhead || '',
      intro_content: validatedPost.intro_content || '',
      cta_text: validatedPost.cta_text || '',
      meta_title: validatedPost.meta_title || '',
      meta_description: validatedPost.meta_description || '',
      tldr_bullets: validatedPost.tldr_bullets || [],
      visual_sections: validatedPost.visual_sections || []
    };

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(postData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create blog post: ${error.message}`);
    }

    return {
      ...data,
      visual_sections: data.visual_sections as unknown as VisualSection[],
      tldr_bullets: data.tldr_bullets as unknown as string[],
      meta_keywords: data.meta_keywords as unknown as string[] | undefined,
      tags: data.tags as unknown as string[] | undefined
    } as unknown as BlogPost;
  }

  static async updatePost(id: string, postInput: Partial<BlogPostInput>): Promise<BlogPost> {
    // Clean URL fields before validation
    const cleanedInput = { ...postInput };
    
    // Handle empty string URLs by converting to null
    if (cleanedInput.hero_video_url === "") cleanedInput.hero_video_url = null;
    if (cleanedInput.cta_url === "") cleanedInput.cta_url = null;
    
    // Handle visual sections URL fields
    if (cleanedInput.visual_sections) {
      cleanedInput.visual_sections = cleanedInput.visual_sections.map(section => ({
        ...section,
        image_url: section.image_url === "" ? null : section.image_url,
        cta_url: section.cta_url === "" ? null : section.cta_url,
        cta_text: section.cta_text === "" ? null : section.cta_text,
      }));
    }

    // Optional validation - allow partial updates
    const validatedPost = cleanedInput;
    
    // Recalculate computed fields if content changed
    let updateData: any = { ...validatedPost };
    
    if (validatedPost.intro_content || validatedPost.visual_sections || validatedPost.deep_dive_content) {
      const totalContent = [
        validatedPost.intro_content || '',
        ...(validatedPost.visual_sections?.map(s => s.content) || []),
        validatedPost.deep_dive_content || ''
      ].join(' ');
      
      updateData.word_count = calculateWordCount(totalContent);
      updateData.read_time = calculateReadTime(updateData.word_count);
    }

    // Update published_at if status changed to published
    if (validatedPost.status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update blog post: ${error.message}`);
    }

    return {
      ...data,
      visual_sections: data.visual_sections as unknown as VisualSection[],
      tldr_bullets: data.tldr_bullets as unknown as string[],
      meta_keywords: data.meta_keywords as unknown as string[] | undefined,
      tags: data.tags as unknown as string[] | undefined
    } as unknown as BlogPost;
  }

  static async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete blog post: ${error.message}`);
    }
  }

  static async uploadBlogImage(file: File, path?: string): Promise<string> {
    const fileName = path || `${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  static async deleteBlogImage(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('blog-images')
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  // Validation helpers for the frontend
  static validateStructure(post: Partial<BlogPostInput>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const result = { isValid: true, errors: [], warnings: [] };

    try {
      BlogPostSchema.parse(post);
    } catch (error: any) {
      result.isValid = false;
      result.errors = error.issues?.map((e: any) => `${e.path.join('.')}: ${e.message}`) || ['Validation failed'];
    }

    // Custom warnings for content quality
    if (post.hero_headline && post.hero_headline.split(' ').length > 8) {
      result.warnings.push('Hero headline should be max 8 words for impact');
    }

    if (post.visual_sections) {
      post.visual_sections.forEach((section, index) => {
        const words = calculateWordCount(section.content);
        if (words < 60 || words > 80) {
          result.warnings.push(`Visual section ${index + 1}: Should be 60-80 words (currently ${words})`);
        }
      });
    }

    return result;
  }
}

// Export singleton instance
export const blogService = BlogService;