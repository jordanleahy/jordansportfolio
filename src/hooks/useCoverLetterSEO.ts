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
    
    // Generate dynamic title and description based on company
    const title = `Cover Letter for ${companyName} - Jordan Leahy`;
    const description = `Personalized cover letter and portfolio for ${companyName}. Healthcare technology leadership, product development expertise, and proven track record in digital health solutions.`;
    
    // Use portfolio-specific OG image or fallback to default
    const ogImage = portfolio.custom_video_url 
      ? `${SEO_DEFAULTS.siteUrl}/og-portfolio.png` // Use portfolio-specific template
      : SEO_DEFAULTS.defaultImage;
    
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