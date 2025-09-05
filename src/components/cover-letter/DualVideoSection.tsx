import React from 'react';
import { VideoSection } from './VideoSection';
import { CompanyPortfolio } from '@/types/companyPortfolio';

interface DualVideoSectionProps {
  topVideoSrc: string;
  topPosterSrc: string;
  bottomVideoSrc: string;
  bottomPosterSrc: string;
  showTimer?: boolean;
  portfolio?: CompanyPortfolio;
}

export const DualVideoSection: React.FC<DualVideoSectionProps> = ({
  topVideoSrc,
  topPosterSrc,
  bottomVideoSrc,
  bottomPosterSrc,
  showTimer = true,
  portfolio
}) => {
  return (
    <div className="space-y-4">
      <VideoSection 
        videoSrc={topVideoSrc}
        posterSrc=""
        showTimer={false}
        portfolio={portfolio}
      />
      <VideoSection 
        videoSrc={bottomVideoSrc}
        posterSrc={bottomPosterSrc}
        showTimer={showTimer}
        portfolio={portfolio}
      />
    </div>
  );
};