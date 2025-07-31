import { useMemo } from 'react';
import { CompanyPortfolio } from '@/types/companyPortfolio';
import { generateSEOMetadata, SEO_DEFAULTS } from '@/utils/seoHelpers';

interface CoverLetterSEOData {
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

export const useCoverLetterSEO = (portfolio: CompanyPortfolio): CoverLetterSEOData => {
  return useMemo(() => {
    const companyName = portfolio.company_name;
    const companySlug = portfolio.company_slug;
    
    // Use custom OG fields if available, otherwise generate dynamic defaults
    const title = portfolio.og_title || `Cover Letter for ${companyName} - Jordan Leahy`;
    const description = portfolio.og_description || `Personalized cover letter and portfolio for ${companyName}. Healthcare technology leadership, product development expertise, and proven track record in digital health solutions.`;
    
    // Priority: custom OG image > portfolio-specific template > default
    const ogImage = portfolio.og_image_url || 
      (portfolio.custom_video_url ? `${SEO_DEFAULTS.siteUrl}/og-portfolio.png` : SEO_DEFAULTS.defaultImage);
    
    // Generate the SEO metadata using existing utility
    const seoData = generateSEOMetadata({
      title,
      description,
      image: ogImage,
      url: `/portfolio/${companySlug}`,
      type: 'website'
    });

    return seoData;
  }, [portfolio]);
};