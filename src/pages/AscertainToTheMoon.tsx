
import React from "react";
import { Helmet } from "react-helmet-async";
import { PageLayout } from "@/components/layout/PageLayout";
import { CoverLetterPageLayout } from "@/components/cover-letter/CoverLetterPageLayout";
import { VideoWithCoverLetterLayout } from "@/components/cover-letter/VideoWithCoverLetterLayout";
import { SchedulingSection } from "@/components/cover-letter/SchedulingSection";
import { HealthcareProjectsSection } from "@/components/cover-letter/HealthcareProjectsSection";
import { ascertainCoverLetterContent } from "@/data/coverLetterContent";

const AscertainToTheMoon = () => {
  return (
    <>
      <Helmet>
        <title>Cover Letter - Ascertain to the Moon</title>
        <meta name="description" content="A personal cover letter and introduction" />
      </Helmet>
      <PageLayout>
        <CoverLetterPageLayout>
          <VideoWithCoverLetterLayout
            videoSrc="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//667F0B04-8D3D-429C-992C-1D8FB2883E9E%20(1)%20(1)%202.mov"
            posterSrc="/lovable-uploads/6ad28481-a75a-4096-a9f1-74822cefe882.png"
            coverLetterContent={ascertainCoverLetterContent}
          />

          <SchedulingSection
            calendarSrc="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0HtVBzITEmJVDw6wxuGBdLLnH99oOFJpzPZysiE0Tr70J6k5kzzrqp6WLR8SVCmH72f8EyuUBE?gv=true"
            companyName="Ascertain"
          />

          <HealthcareProjectsSection />
        </CoverLetterPageLayout>
      </PageLayout>
    </>
  );
};

export default AscertainToTheMoon;
