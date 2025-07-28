
import React from 'react';
import { VideoSection } from './VideoSection';
import { DualVideoSection } from './DualVideoSection';
import { DualVideoUploadSection } from '@/components/portfolio/DualVideoUploadSection';
import { CoverLetterSection } from './CoverLetterSection';
import { CoverLetterContent } from '@/data/coverLetterContent';
import { CompanyPortfolio } from '@/types/companyPortfolio';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const hasTopVideo = portfolio?.custom_top_video_url;
  const shouldUseDualVideo = useDualVideo || hasTopVideo;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-8 mb-12">
      {shouldUseDualVideo ? (
        <>
          {/* Show upload interface for authenticated users with portfolio */}
          {user && portfolio ? (
            <DualVideoUploadSection
              topVideoSrc={topVideoSrc}
              bottomVideoSrc={videoSrc}
              posterSrc={posterSrc}
              showTimer={showTimer}
              portfolio={portfolio}
              showControls={true}
            />
          ) : (
            <DualVideoSection 
              topVideoSrc={topVideoSrc || ''}
              topPosterSrc={topPosterSrc || posterSrc}
              bottomVideoSrc={videoSrc}
              bottomPosterSrc={posterSrc}
              showTimer={showTimer}
              portfolio={portfolio}
            />
          )}
        </>
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
