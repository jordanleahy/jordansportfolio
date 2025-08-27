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
    
    // Enhanced SEO logic for specific educational content
    let title: string;
    let description: string;
    
    // Special handling for educational/program content
    if (themeName === 'Discover StoryShip' && theme.theme_description?.includes('Scandinavian-inspired')) {
      title = 'Origins and Guiding Philosophy - Scandinavian Educational Approach';
      description = 'Discover our Scandinavian-inspired educational program established in 2010, blending Reggio-Emilia principles with child-led, project-based learning that honors curiosity, play, and children\'s rights.';
    } 
    // Check for other educational content indicators
    else if (theme.theme_description?.includes('Reggio-Emilia') || theme.theme_description?.includes('child-led') || theme.theme_description?.includes('educational')) {
      title = `${themeName} - Educational Philosophy & Approach`;
      description = theme.theme_description.length > 160 
        ? theme.theme_description.substring(0, 157) + '...'
        : theme.theme_description;
    }
    // Check for healthcare/technology content
    else if (theme.theme_description?.includes('healthcare') || theme.theme_description?.includes('technology') || theme.theme_description?.includes('medical')) {
      title = `${themeName} - Healthcare Technology Insights`;
      description = theme.theme_description || `Explore healthcare technology insights and analysis about ${themeName}. Expert perspectives on digital health, medical innovation, and industry trends.`;
    }
    // Default handling for other themes
    else {
      title = `${themeName} - Stories & Insights`;
      description = theme.theme_description || `Explore content and insights about ${themeName}. Stories, analysis, and expert perspectives.`;
    }
    
    // Ensure description is optimized for SEO (max 160 characters)
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }
    
    // Generate the SEO metadata using existing utility
    const seoData = generateSEOMetadata({
      title,
      description,
      image: SEO_DEFAULTS.defaultImage,
      url: `/stories/theme/${theme?.id}`,
      type: 'website'
    });

    return seoData;
  }, [theme]);
};