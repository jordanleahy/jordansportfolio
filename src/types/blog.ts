import { z } from "zod";
import { Json } from "@/integrations/supabase/types";

// Database types
export interface BlogPost {
  id: string;
  user_id: string;
  slug: string;
  status: string; // Will be cast from database
  
  // Hero Section
  hero_headline: string;
  hero_subhead: string;
  hero_image_url?: string;
  hero_image_16_9_url?: string;
  hero_video_url?: string;
  hero_badge?: string;
  
  // Intro Section
  intro_content: string;
  
  // Visual Sections
  visual_sections: Json; // Will be cast to VisualSection[]
  
  // TL;DR Section
  tldr_title: string;
  tldr_bullets: Json; // Will be cast to string[]
  
  // Optional Deep Dive
  deep_dive_title?: string;
  deep_dive_content?: string;
  
  // CTA & Share Section
  cta_text: string;
  cta_url?: string;
  share_enabled: boolean;
  
  // SEO Metadata
  meta_title: string;
  meta_description: string;
  meta_keywords?: Json; // Will be cast to string[]
  og_image_url?: string;
  
  // Technical fields
  word_count?: number;
  read_time?: number;
  featured: boolean;
  category: string;
  tags?: Json; // Will be cast to string[]
  theme?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface VisualSection {
  headline: string;
  content: string;
  image_url?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
}

// Zod validation schemas
export const VisualSectionSchema = z.object({
  headline: z.string().optional(),
  content: z.string().optional(),
  image_url: z.string().nullable().optional(),
  cta_text: z.string().nullable().optional(),
  cta_url: z.string().nullable().optional(),
});

export const BlogPostSchema = z.object({
  // Hero Section - Minimal validation
  hero_headline: z.string().optional(),
  hero_subhead: z.string().optional(),
  hero_image_url: z.string().nullable().optional(),
  hero_video_url: z.string().nullable().optional(),
  hero_badge: z.string().optional(),
  
  // Intro Section
  intro_content: z.string().optional(),
  
  // Visual Sections - Optional
  visual_sections: z.array(VisualSectionSchema).optional(),
  
  // TL;DR Section
  tldr_title: z.string().default("TL;DR"),
  tldr_bullets: z.array(z.string()).optional(),
  
  // Optional Deep Dive
  deep_dive_title: z.string().optional(),
  deep_dive_content: z.string().optional(),
  
  // CTA & Share Section
  cta_text: z.string().optional(),
  cta_url: z.string().nullable().optional(),
  share_enabled: z.boolean().default(true),
  
  // SEO Metadata
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.array(z.string()).optional(),
  og_image_url: z.string().optional(),
  
  // Technical fields
  featured: z.boolean().default(false),
  category: z.string().default("general"),
  tags: z.array(z.string()).optional(),
  theme: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

// Form types for creation/editing
export type BlogPostInput = z.infer<typeof BlogPostSchema>;
export type VisualSectionInput = z.infer<typeof VisualSectionSchema>;

// Utility functions
export function calculateWordCount(content: string): number {
  return content.split(/\s+/).filter(word => word.length > 0).length;
}

export function calculateReadTime(wordCount: number): number {
  // Average reading speed: 200 words per minute
  return Math.ceil(wordCount / 200);
}

export function extractPlainText(content: string): string {
  // Remove HTML tags and markdown
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/[#*_`]/g, '')
    .trim();
}

// Word count validation helpers
export function validateWordCount(content: string, min: number, max: number): boolean {
  const words = calculateWordCount(extractPlainText(content));
  return words >= min && words <= max;
}

// SEO helpers
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateBlogPost(post: Partial<BlogPostInput>): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    BlogPostSchema.parse(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      result.isValid = false;
      result.errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
    }
  }

  // Additional custom validations
  if (post.intro_content) {
    const introWords = calculateWordCount(extractPlainText(post.intro_content));
    if (introWords < 50) {
      result.warnings.push("Intro section should be 50-75 words for optimal readability");
    }
  }

  if (post.visual_sections) {
    post.visual_sections.forEach((section, index) => {
      if (section.content) {
        const sectionWords = calculateWordCount(extractPlainText(section.content));
        if (sectionWords < 60 || sectionWords > 80) {
          result.warnings.push(`Visual section ${index + 1}: Should be 60-80 words for optimal readability`);
        }
      }
    });
  }

  return result;
}