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
  
  // Technical fields
  word_count?: number;
  read_time?: number;
  featured: boolean;
  category: string;
  tags?: Json; // Will be cast to string[]
  
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
  headline: z.string()
    .min(3, "Headline too short")
    .max(40, "Headline must be max 6 words (~40 chars)"),
  content: z.string()
    .min(300, "Content must be 60-80 words (min 300 chars)")
    .max(480, "Content must be 60-80 words (max 480 chars)"),
  image_url: z.string().url("Must be a valid image URL").nullable().optional(),
  cta_text: z.string().nullable().optional(),
  cta_url: z.union([z.string().url(), z.literal("")]).nullable().optional(),
});

export const BlogPostSchema = z.object({
  // Hero Section - Strict validation
  hero_headline: z.string()
    .min(5, "Headline too short")
    .max(60, "Headline must be max 8 words (~60 chars)"),
  hero_subhead: z.string()
    .min(80, "Subhead must be 15-25 words (min 80 chars)")
    .max(150, "Subhead must be 15-25 words (max 150 chars)"),
  hero_image_url: z.union([z.string().url(), z.literal("")]).nullable().optional(),
  hero_video_url: z.union([z.string().url(), z.literal("")]).nullable().optional(),
  hero_badge: z.string().max(20).optional(),
  
  // Intro Section
  intro_content: z.string()
    .min(250, "Intro must be 50-75 words (min 250 chars)")
    .max(450, "Intro must be 50-75 words (max 450 chars)"),
  
  // Visual Sections - Exactly 3 required
  visual_sections: z.array(VisualSectionSchema)
    .length(3, "Must have exactly 3 visual sections"),
  
  // TL;DR Section
  tldr_title: z.string().default("TL;DR"),
  tldr_bullets: z.array(z.string().min(10).max(100))
    .min(3, "Must have at least 3 bullets")
    .max(5, "Must have at most 5 bullets"),
  
  // Optional Deep Dive
  deep_dive_title: z.string().optional(),
  deep_dive_content: z.string()
    .max(1500, "Deep dive must be max 250 words (~1500 chars)")
    .optional(),
  
  // CTA & Share Section
  cta_text: z.string().min(1, "CTA text is required"),
  cta_url: z.union([z.string().url(), z.literal("")]).nullable().optional(),
  share_enabled: z.boolean().default(true),
  
  // SEO Metadata
  meta_title: z.string()
    .min(10, "Meta title too short")
    .max(60, "Meta title must be max 60 characters"),
  meta_description: z.string()
    .min(50, "Meta description too short")
    .max(155, "Meta description must be max 155 characters"),
  meta_keywords: z.array(z.string()).optional(),
  
  // Technical fields
  featured: z.boolean().default(false),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
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