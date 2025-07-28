
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
  
  // Show dual video layout only when there's actually a top video
  // OR when user is authenticated and can upload (to show upload interface)
  const shouldShowDualLayout = hasTopVideo || (user && portfolio);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-8 mb-12">
      {shouldShowDualLayout ? (
        <div className="space-y-4">
          {/* Only show top video section if there's a video or user can upload */}
          {(hasTopVideo || (user && portfolio)) && (
            <VideoSection 
              videoSrc={topVideoSrc || ''}
              posterSrc=""
              showTimer={false}
              portfolio={portfolio}
              aspectRatio="portrait"
              uploadType="top"
              showUploadPrompt={!hasTopVideo && !!(user && portfolio)}
            />
          )}
          
          {/* Always show the main video */}
          <VideoSection 
            videoSrc={videoSrc}
            posterSrc={posterSrc}
            showTimer={showTimer}
            portfolio={portfolio}
            aspectRatio="landscape"
            uploadType="main"
          />
        </div>
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
