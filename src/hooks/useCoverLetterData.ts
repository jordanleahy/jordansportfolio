import { useMemo } from 'react';
import { CompanyPortfolio, StructuredCoverLetter } from '@/types/companyPortfolio';
import { CoverLetterContent } from '@/data/coverLetterContent';
import { personalInfo, defaultCalendarUrl, defaultRecipients } from '@/config/personalInfo';
import { defaultVideoContent, defaultCoverLetterTemplate } from '@/config/defaultContent';

interface UseCoverLetterDataProps {
  portfolio: CompanyPortfolio & {
    job_applications?: {
      job_description: string;
      job_description_link?: string;
      resume_link?: string;
      cover_letter_link?: string;
      created_at: string;
    };
  };
}

export const useCoverLetterData = ({ portfolio }: UseCoverLetterDataProps) => {
  const coverLetterContent = useMemo((): CoverLetterContent & { structured?: StructuredCoverLetter } => {
    const companySlug = portfolio.company_slug.toLowerCase();
    
    // Determine recipient based on company
    const recipient = (defaultRecipients as any)[companySlug] || 
                     defaultRecipients.getDefault(portfolio.company_name);

    const content: CoverLetterContent & { structured?: StructuredCoverLetter } = {
      recipient,
      paragraphs: [],
      signature: {
        name: personalInfo.name,
        website: personalInfo.website
      }
    };

    // Handle structured vs legacy format
    if (portfolio.generated_content?.cover_letter) {
      if (typeof portfolio.generated_content.cover_letter === 'object') {
        content.structured = portfolio.generated_content.cover_letter;
        content.paragraphs = [];
      } else {
        content.paragraphs = [portfolio.generated_content.cover_letter];
      }
    } else {
      // Generate fallback content
      content.paragraphs = [
        defaultCoverLetterTemplate.opening(portfolio.company_name),
        defaultCoverLetterTemplate.body(portfolio.company_name),
        defaultCoverLetterTemplate.closing(portfolio.company_name)
      ];
    }

    return content;
  }, [portfolio]);

  const videoSrc = useMemo(() => {
    return portfolio.custom_video_url || defaultVideoContent.videoUrl;
  }, [portfolio.custom_video_url]);

  const calendarUrl = useMemo(() => {
    return defaultCalendarUrl;
  }, []);

  return {
    coverLetterContent,
    videoSrc,
    posterSrc: defaultVideoContent.posterUrl,
    calendarUrl,
    personalInfo,
    companyName: portfolio.company_name,
    jobApplication: portfolio.job_applications
  };
};