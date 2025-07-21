
import React from "react";
import { CompanyPortfolio } from "@/types/companyPortfolio";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";
import { CoverLetterPageLayout } from "@/components/cover-letter/CoverLetterPageLayout";
import { VideoWithCoverLetterLayout } from "@/components/cover-letter/VideoWithCoverLetterLayout";
import { SchedulingSection } from "@/components/cover-letter/SchedulingSection";
import { HealthcareProjectsSection } from "@/components/cover-letter/HealthcareProjectsSection";
import { CoverLetterContent } from "@/data/coverLetterContent";
import { PortfolioVideoUploadSection } from "./PortfolioVideoUploadSection";
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
  const { user } = useAuth();
  const jobApplication = portfolio.job_applications;

  // Use custom video if available, otherwise fall back to default
  const videoSrc = portfolio.custom_video_url || 
    "https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//667F0B04-8D3D-429C-992C-1D8FB2883E9E%20(1)%20(1)%202.mov";

  // Create cover letter content using the generated cover letter or fallback
  const coverLetterContent: CoverLetterContent = {
    recipient: `Dear ${portfolio.company_name} Team,`,
    paragraphs: portfolio.generated_content?.cover_letter 
      ? [portfolio.generated_content.cover_letter]
      : [
          `I'm writing to express my strong interest in joining ${portfolio.company_name}. With over 10 years of experience in healthcare technology and AI applications, I'm excited about the opportunity to contribute to your team's mission.`,
          `My background in clinical documentation integrity, revenue cycle management, and healthcare data analytics aligns perfectly with your needs. I've successfully implemented technology solutions that improve patient outcomes and operational efficiency across multiple healthcare organizations.`,
          `I would love to discuss how my experience can contribute to ${portfolio.company_name}'s continued success and growth. Thank you for considering my application.`
        ],
    signature: {
      name: "Jordan Leahy",
      website: "jordanwilliamleahy.com"
    }
  };

  return (
    <CoverLetterPageLayout>
      <VideoWithCoverLetterLayout
        videoSrc={videoSrc}
        posterSrc="/lovable-uploads/6ad28481-a75a-4096-a9f1-74822cefe882.png"
        coverLetterContent={coverLetterContent}
      />

      {user && <PortfolioVideoUploadSection portfolio={portfolio} />}

      <SchedulingSection
        calendarSrc="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0HtVBzITEmJVDw6wxuGBdLLnH99oOFJpzPZysiE0Tr70J6k5kzzrqp6WLR8SVCmH72f8EyuUBE?gv=true"
        companyName={portfolio.company_name}
      />

      <HealthcareProjectsSection />

      {jobApplication && (jobApplication.resume_link || jobApplication.job_description_link) && (
        <div className="mt-12 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {jobApplication.resume_link && (
              <Button asChild size="lg">
                <a href={jobApplication.resume_link} target="_blank" rel="noopener noreferrer">
                  <FileText className="w-5 h-5 mr-2" />
                  View Resume
                </a>
              </Button>
            )}
            {jobApplication.job_description_link && (
              <Button asChild variant="outline" size="lg">
                <a href={jobApplication.job_description_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View Job Posting
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </CoverLetterPageLayout>
  );
};

export default CoverLetterPortfolioView;
