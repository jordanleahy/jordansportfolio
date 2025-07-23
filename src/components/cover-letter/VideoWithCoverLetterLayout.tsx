
import React from 'react';
import { VideoSection } from './VideoSection';
import { CoverLetterSection } from './CoverLetterSection';
import { CoverLetterContent } from '@/data/coverLetterContent';
import { CompanyPortfolio } from '@/types/companyPortfolio';

interface VideoWithCoverLetterLayoutProps {
  videoSrc: string;
  posterSrc: string;
  coverLetterContent: CoverLetterContent;
  showTimer?: boolean;
  portfolio?: CompanyPortfolio;
}

export const VideoWithCoverLetterLayout: React.FC<VideoWithCoverLetterLayoutProps> = ({
  videoSrc,
  posterSrc,
  coverLetterContent,
  showTimer = true,
  portfolio
}) => {
  // Only show video section if there's a custom video uploaded
  const hasCustomVideo = portfolio?.custom_video_url;
  
  if (!hasCustomVideo) {
    return (
      <div className="mb-12">
        <CoverLetterSection content={coverLetterContent} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-8 mb-12">
      <VideoSection 
        videoSrc={videoSrc}
        posterSrc={posterSrc}
        showTimer={showTimer}
        portfolio={portfolio}
      />
      <CoverLetterSection content={coverLetterContent} />
    </div>
  );
};
