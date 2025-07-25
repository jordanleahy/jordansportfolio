
import React from 'react';
import { VideoSection } from './VideoSection';
import { DualVideoSection } from './DualVideoSection';
import { CoverLetterSection } from './CoverLetterSection';
import { CoverLetterContent } from '@/data/coverLetterContent';
import { CompanyPortfolio } from '@/types/companyPortfolio';

interface VideoWithCoverLetterLayoutProps {
  videoSrc: string;
  posterSrc: string;
  topVideoSrc?: string;
  topPosterSrc?: string;
  coverLetterContent: CoverLetterContent;
  showTimer?: boolean;
  portfolio?: CompanyPortfolio;
  useDualVideo?: boolean;
}

export const VideoWithCoverLetterLayout: React.FC<VideoWithCoverLetterLayoutProps> = ({
  videoSrc,
  posterSrc,
  topVideoSrc,
  topPosterSrc,
  coverLetterContent,
  showTimer = true,
  portfolio,
  useDualVideo = false
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-8 mb-12">
      {useDualVideo && topVideoSrc && topPosterSrc ? (
        <DualVideoSection 
          topVideoSrc={topVideoSrc}
          topPosterSrc={topPosterSrc}
          bottomVideoSrc={videoSrc}
          bottomPosterSrc={posterSrc}
          showTimer={showTimer}
          portfolio={portfolio}
        />
      ) : (
        <VideoSection 
          videoSrc={videoSrc}
          posterSrc={posterSrc}
          showTimer={showTimer}
          portfolio={portfolio}
        />
      )}
      <CoverLetterSection content={coverLetterContent} />
    </div>
  );
};
