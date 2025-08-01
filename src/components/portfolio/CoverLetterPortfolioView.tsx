
import React from "react";
import { Helmet } from "react-helmet-async";
import { CompanyPortfolio } from "@/types/companyPortfolio";
import { CoverLetterPageLayout } from "@/components/cover-letter/CoverLetterPageLayout";
import { VideoWithCoverLetterLayout } from "@/components/cover-letter/VideoWithCoverLetterLayout";
import { SchedulingSection } from "@/components/cover-letter/SchedulingSection";
import { HealthcareProjectsSection } from "@/components/cover-letter/HealthcareProjectsSection";
import { CoverLetterEditor } from "./CoverLetterEditor";
import { PortfolioActions } from "./PortfolioActions";

import { useCoverLetterData } from "@/hooks/useCoverLetterData";
import { useCoverLetterSEO } from "@/hooks/useCoverLetterSEO";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";

interface CoverLetterPortfolioViewProps {
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

const CoverLetterPortfolioView = ({ portfolio }: CoverLetterPortfolioViewProps) => {
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const { 
    coverLetterContent, 
    videoSrc, 
    topVideoSrc,
    posterSrc, 
    calendarUrl, 
    companyName,
    jobApplication 
  } = useCoverLetterData({ portfolio });

  // Generate SEO metadata for this specific cover letter
  const seoData = useCoverLetterSEO(portfolio);

  return (
    <>
      <Helmet>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content={seoData.type} />
        <meta property="og:url" content={seoData.url} />
        <meta property="og:title" content={seoData.ogTitle} />
        <meta property="og:description" content={seoData.ogDescription} />
        <meta property="og:image" content={seoData.image} />
        <meta property="og:site_name" content={seoData.siteName} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={seoData.url} />
        <meta name="twitter:title" content={seoData.ogTitle} />
        <meta name="twitter:description" content={seoData.ogDescription} />
        <meta name="twitter:image" content={seoData.image} />
        
        {/* LinkedIn optimization */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={seoData.url} />
      </Helmet>
      
      <CoverLetterPageLayout>
      {isAdmin && (
        <div className="mb-8">
          <CoverLetterEditor portfolio={portfolio} />
        </div>
      )}


      <VideoWithCoverLetterLayout
        videoSrc={videoSrc}
        topVideoSrc={topVideoSrc}
        posterSrc={posterSrc}
        coverLetterContent={coverLetterContent}
        portfolio={portfolio}
      />

      <HealthcareProjectsSection />

      <SchedulingSection
        calendarSrc={calendarUrl}
        companyName={companyName}
      />

      <PortfolioActions jobApplication={jobApplication} />
    </CoverLetterPageLayout>
    </>
  );
};

export default CoverLetterPortfolioView;
