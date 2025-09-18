import { z } from "zod";

// Simplified core blog types
export interface BlogPost {
  id: string;
  user_id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  
  // Core content
  hero_headline: string;
  hero_subhead: string;
  hero_badge?: string;
  intro_content: string;
  visual_sections: VisualSection[];
  tldr_bullets: string[];
  cta_text: string;
  
  // SEO essentials
  meta_title: string;
  meta_description: string;
  
  // Metadata
  category: string;
  tags?: string[];
  word_count?: number;
  read_time?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface VisualSection {
  headline: string;
  content: string;
  image_url?: string;
  cta_text?: string;
  cta_url?: string;
}

// Simplified validation schema with required database fields
export const BlogPostSchema = z.object({
  hero_headline: z.string().min(1, "Headline required"),
  hero_subhead: z.string().min(1, "Subheadline required"),
  hero_badge: z.string().optional(),
  intro_content: z.string().min(1, "Intro content required"),
  visual_sections: z.array(z.object({
    headline: z.string().min(1),
    content: z.string().min(1),
    image_url: z.string().optional(),
    cta_text: z.string().optional(),
    cta_url: z.string().optional(),
  })).length(3, "Must have exactly 3 visual sections"),
  tldr_bullets: z.array(z.string()).min(1, "At least one bullet required"),
  cta_text: z.string().min(1, "CTA text required"),
  meta_title: z.string().min(1, "Meta title required"),
  meta_description: z.string().min(1, "Meta description required"),
  category: z.string().min(1, "Category required"),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  // Database compatibility fields
  tldr_title: z.string().default('TL;DR'),
  share_enabled: z.boolean().default(true),
  featured: z.boolean().default(false),
  deep_dive_title: z.string().optional(),
  deep_dive_content: z.string().optional(),
  // Additional optional fields for compatibility
  day: z.number().optional(),
  theme: z.string().optional(),
  social_media_post_id: z.string().optional(),
  cta_url: z.string().optional(),
});

export type BlogPostInput = z.infer<typeof BlogPostSchema>;

// Utility functions
export function calculateWordCount(content: string): number {
  return content.split(/\s+/).filter(word => word.length > 0).length;
}

export function calculateReadTime(wordCount: number): number {
  return Math.ceil(wordCount / 200);
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function validateBlogPost(post: Partial<BlogPostInput>): {
  isValid: boolean;
  errors: string[];
} {
  try {
    BlogPostSchema.parse(post);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
}