import { supabase } from "@/integrations/supabase/client";
import type { SocialMediaPost, CreateSocialMediaPost } from "@/types/socialMedia";

export const socialMediaService = {
  async getAllPosts(category?: 'cdi' | 'contracts' | 'forms'): Promise<SocialMediaPost[]> {
    let query = supabase
      .from('social_media_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as SocialMediaPost[];
  },

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
    return data as SocialMediaPost;
  },

  async updatePost(id: string, updates: Partial<CreateSocialMediaPost>): Promise<SocialMediaPost> {
    console.log('Updating post:', { id, updates });
    
    const { data, error } = await supabase
      .from('social_media_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Update error:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error(`Post with id ${id} not found`);
    }
    
    return data as SocialMediaPost;
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('social_media_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

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
    return data || 0;
  },

  async getAvailableCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('category');

    if (error) throw error;
    
    const categories = [...new Set((data || []).map((item: any) => item.category as string))];
    return categories.filter(Boolean);
  },

};