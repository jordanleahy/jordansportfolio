
import React from "react";
import { CompanyPortfolio } from "@/types/companyPortfolio";
import { CoverLetterPageLayout } from "@/components/cover-letter/CoverLetterPageLayout";
import { VideoWithCoverLetterLayout } from "@/components/cover-letter/VideoWithCoverLetterLayout";
import { SchedulingSection } from "@/components/cover-letter/SchedulingSection";
import { HealthcareProjectsSection } from "@/components/cover-letter/HealthcareProjectsSection";
import { CoverLetterEditor } from "./CoverLetterEditor";
import { PortfolioActions } from "./PortfolioActions";
import { useCoverLetterData } from "@/hooks/useCoverLetterData";
import { useUserRole } from "@/hooks/useUserRole";

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
  const { 
    coverLetterContent, 
    videoSrc, 
    posterSrc, 
    calendarUrl, 
    companyName,
    jobApplication 
  } = useCoverLetterData({ portfolio });

  return (
    <CoverLetterPageLayout>
      {isAdmin && (
        <div className="mb-8">
          <CoverLetterEditor portfolio={portfolio} />
        </div>
      )}

      <VideoWithCoverLetterLayout
        videoSrc={videoSrc}
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
  );
};

export default CoverLetterPortfolioView;
