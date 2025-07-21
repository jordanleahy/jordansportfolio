
import React from 'react';
import { SectionContainer } from './SectionContainer';

interface CoverLetterPageLayoutProps {
  children: React.ReactNode;
  showHeroSection?: boolean;
  heroContent?: React.ReactNode;
}

export const CoverLetterPageLayout: React.FC<CoverLetterPageLayoutProps> = ({
  children,
  showHeroSection = false,
  heroContent
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/90 py-8">
      <SectionContainer>
        {showHeroSection && (
          <div className="text-center mb-12">
            {heroContent}
          </div>
        )}
        {children}
      </SectionContainer>
    </div>
  );
};
