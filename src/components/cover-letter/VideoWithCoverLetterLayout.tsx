
import React from 'react';
import { VideoSection } from './VideoSection';
import { CoverLetterSection } from './CoverLetterSection';
import { CoverLetterContent } from '@/data/coverLetterContent';

interface VideoWithCoverLetterLayoutProps {
  videoSrc: string;
  posterSrc: string;
  coverLetterContent: CoverLetterContent;
  showTimer?: boolean;
}

export const VideoWithCoverLetterLayout: React.FC<VideoWithCoverLetterLayoutProps> = ({
  videoSrc,
  posterSrc,
  coverLetterContent,
  showTimer = true
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-8 mb-12">
      <VideoSection 
        videoSrc={videoSrc}
        posterSrc={posterSrc}
        showTimer={showTimer}
      />
      <CoverLetterSection content={coverLetterContent} />
    </div>
  );
};
