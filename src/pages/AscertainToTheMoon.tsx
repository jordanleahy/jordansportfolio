
import React from "react";
import { Helmet } from "react-helmet-async";
import { PageLayout } from "@/components/layout/PageLayout";
import { generateSEOMetadata } from "@/utils/seoHelpers";
import { CoverLetterPageLayout } from "@/components/cover-letter/CoverLetterPageLayout";
import { VideoWithCoverLetterLayout } from "@/components/cover-letter/VideoWithCoverLetterLayout";
import { SchedulingSection } from "@/components/cover-letter/SchedulingSection";
import { HealthcareProjectsSection } from "@/components/cover-letter/HealthcareProjectsSection";
import { ascertainCoverLetterContent } from "@/data/coverLetterContent";

const AscertainToTheMoon = () => {
  // Generate SEO metadata for cover letter page
  const coverLetterSEO = generateSEOMetadata({
    title: "Cover Letter - Ascertain to the Moon",
    description: "A personal cover letter and introduction from Jordan Leahy for Ascertain. Healthcare technology leadership and product development expertise.",
    image: "/og-default.png",
    url: "/ascertain-to-the-moon",
    type: "article"
  });

  return (
    <>
      <Helmet>
        <title>{coverLetterSEO.title}</title>
        <meta name="description" content={coverLetterSEO.description} />
        <meta property="og:title" content={coverLetterSEO.ogTitle} />
        <meta property="og:description" content={coverLetterSEO.ogDescription} />
        <meta property="og:image" content={coverLetterSEO.image} />
        <meta property="og:url" content={coverLetterSEO.url} />
        <meta property="og:type" content={coverLetterSEO.type} />
        <meta property="og:site_name" content={coverLetterSEO.siteName} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={coverLetterSEO.ogTitle} />
        <meta name="twitter:description" content={coverLetterSEO.ogDescription} />
        <meta name="twitter:image" content={coverLetterSEO.image} />
      </Helmet>
      <PageLayout>
        <CoverLetterPageLayout>
          <VideoWithCoverLetterLayout
            useDualVideo={true}
            topVideoSrc="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//667F0B04-8D3D-429C-992C-1D8FB2883E9E%20(1)%20(1)%202.mov"
            topPosterSrc="/lovable-uploads/6ad28481-a75a-4096-a9f1-74822cefe882.png"
            videoSrc="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//ascertian.mov"
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
