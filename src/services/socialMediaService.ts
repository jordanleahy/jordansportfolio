import { supabase } from "@/integrations/supabase/client";
import type { SocialMediaPost, CreateSocialMediaPost } from "@/types/socialMedia";

export const socialMediaService = {
  async getAllPosts(): Promise<SocialMediaPost[]> {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createPost(post: CreateSocialMediaPost): Promise<SocialMediaPost> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('social_media_posts')
      .insert({
        ...post,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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
    
    return data;
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('social_media_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};