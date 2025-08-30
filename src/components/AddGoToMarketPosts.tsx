import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import type { CreateSocialMediaPost } from '@/types/socialMedia';

export const AddGoToMarketPosts: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddPosts = async () => {
    setLoading(true);
    try {
      const THEME_ID = 'f49d5042-e1a4-4f9e-b30c-fe73aa545bd8';
      
      const goToMarketPosts: CreateSocialMediaPost[] = [
        {
          title: 'Storytelling',
          description: 'We focus our efforts on helping our early adopters become visual story tellers.',
          category: 'go to market',
          theme_id: THEME_ID,
          day: 16,
          status: 'draft'
        },
        {
          title: 'Gamification',
          description: 'We create an experience they have never experienced before and our conversation AI will tuned to keep them on edge but keeping momentum.',
          category: 'go to market',
          theme_id: THEME_ID,
          day: 17,
          status: 'draft'
        },
        {
          title: 'Virality & Distribution',
          description: 'Not sharing will feel like a crime to our early adopters.',
          category: 'go to market',
          theme_id: THEME_ID,
          day: 18,
          status: 'draft'
        },
        {
          title: 'DOT & Consultants',
          description: 'We take a organic to agent approach to identifying and target our primary target users.',
          category: 'go to market',
          theme_id: THEME_ID,
          day: 19,
          status: 'draft'
        }
      ];

      console.log('Starting to add Go to Market posts...');
      
      for (const post of goToMarketPosts) {
        console.log(`Creating post: ${post.title}`);
        const createdPost = await optimizedSocialMediaService.createPost(post);
        console.log(`✅ Created post ${createdPost.title} (ID: ${createdPost.id})`);
      }
      
      toast({
        title: "Posts Added",
        description: "Successfully added 4 Go to Market posts to the theme.",
      });
      
      // Refresh the page to show new posts
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error adding posts:', error);
      toast({
        title: "Error",
        description: "An error occurred while adding posts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-2">Add Go to Market Posts</h3>
      <p className="text-sm text-muted-foreground mb-4">
        This will add 4 posts (Storytelling, Gamification, Virality & Distribution, DOT & Consultants) to theme f49d5042-e1a4-4f9e-b30c-fe73aa545bd8
      </p>
      <Button onClick={handleAddPosts} disabled={loading}>
        {loading ? 'Adding Posts...' : 'Add Go to Market Posts'}
      </Button>
    </div>
  );
};