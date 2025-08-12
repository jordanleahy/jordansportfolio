import { useMemo } from 'react';
import { generateSEOMetadata, SEO_DEFAULTS } from '@/utils/seoHelpers';
import type { Theme } from '@/types/stories/domain';

interface ThemeSEOData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: 'website' | 'article';
  siteName: string;
  ogTitle: string;
  ogDescription: string;
  noIndex: boolean;
}

export const useThemeSEO = (theme: Theme | null | undefined): ThemeSEOData => {
  return useMemo(() => {
    if (!theme) {
      // Fallback for when theme is loading or not found
      return generateSEOMetadata({
        title: 'Stories & Themes - Jordan Leahy',
        description: 'Explore healthcare technology stories, insights, and content themes.',
        url: '/stories',
        type: 'website'
      });
    }

    const themeName = theme.theme_name;
    const themeSlug = encodeURIComponent(themeName);
    
    // Use theme title as OG title
    const title = `${themeName} - Stories & Insights`;
    
    // Use theme description as OG description, with fallback
    const description = theme.description || 
      `Explore content and insights about ${themeName}. Healthcare technology stories, analysis, and expert perspectives.`;
    
    // Generate the SEO metadata using existing utility
    const seoData = generateSEOMetadata({
      title,
      description,
      image: SEO_DEFAULTS.defaultImage, // Could be enhanced later with theme-specific images
      url: `/stories/theme/${themeSlug}`,
      type: 'website'
    });

    return seoData;
  }, [theme]);
};