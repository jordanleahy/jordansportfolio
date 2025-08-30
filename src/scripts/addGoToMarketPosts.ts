import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import type { CreateSocialMediaPost } from '@/types/socialMedia';

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

export async function addGoToMarketPosts() {
  try {
    console.log('Starting to add Go to Market posts...');
    
    for (const post of goToMarketPosts) {
      console.log(`Creating post: ${post.title}`);
      const createdPost = await optimizedSocialMediaService.createPost(post);
      console.log(`✅ Created post ${createdPost.title} (ID: ${createdPost.id})`);
    }
    
    console.log('✅ All Go to Market posts added successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error adding posts:', error);
    return false;
  }
}