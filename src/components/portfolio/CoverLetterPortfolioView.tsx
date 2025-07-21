
import React from "react";
import { CompanyPortfolio } from "@/types/companyPortfolio";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";
import { CoverLetterPageLayout } from "@/components/cover-letter/CoverLetterPageLayout";
import { VideoWithCoverLetterLayout } from "@/components/cover-letter/VideoWithCoverLetterLayout";
import { SchedulingSection } from "@/components/cover-letter/SchedulingSection";
import { ProjectShowcase } from "@/components/cover-letter/ProjectShowcase";
import { CoverLetterContent, ProjectData } from "@/data/coverLetterContent";

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
  const generatedContent = portfolio.generated_content;
  const jobApplication = portfolio.job_applications;

  // Create cover letter content from generated content
  const coverLetterContent: CoverLetterContent = {
    recipient: generatedContent?.hero_section?.headline || `Dear ${portfolio.company_name} Team,`,
    paragraphs: generatedContent?.cover_letter 
      ? [generatedContent.cover_letter]
      : [
          generatedContent?.hero_section?.value_proposition || `I'm particularly drawn to ${portfolio.company_name} because of our shared values.`,
          generatedContent?.company_analysis?.mission_alignment || "My experience directly aligns with your needs.",
          `I would love to discuss how my experience can contribute to ${portfolio.company_name}'s continued success and growth.`
        ],
    signature: {
      name: "Jordan Leahy",
      website: "jordanwilliamleahy.com"
    }
  };

  // Convert relevant projects to ProjectData format
  const portfolioProjects: ProjectData[] = generatedContent?.relevant_projects?.slice(0, 3).map((project, index) => ({
    title: `Relevant Project ${index + 1}`,
    description: project.customized_description.slice(0, 150) + "...",
    tags: [`${Math.round(project.relevance_score * 100)}% match`, "#Project"],
    link: "#",
    iconColor: "bg-blue-600",
    iconBg: "bg-blue-100"
  })) || [];

  // Add skills as projects if we have space
  const skillsAsProjects: ProjectData[] = generatedContent?.skills_alignment?.slice(0, 3 - portfolioProjects.length).map((skill, index) => ({
    title: skill.skill,
    description: skill.relevance.slice(0, 150) + "...",
    tags: ["#Skill", "#Experience"],
    link: "#",
    iconColor: "bg-cyan-600",
    iconBg: "bg-cyan-100"
  })) || [];

  const allProjects = [...portfolioProjects, ...skillsAsProjects];

  return (
    <CoverLetterPageLayout>
      <VideoWithCoverLetterLayout
        videoSrc="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//667F0B04-8D3D-429C-992C-1D8FB2883E9E%20(1)%20(1)%202.mov"
        posterSrc="/lovable-uploads/6ad28481-a75a-4096-a9f1-74822cefe882.png"
        coverLetterContent={coverLetterContent}
      />

      <SchedulingSection
        calendarSrc="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0HtVBzITEmJVDw6wxuGBdLLnH99oOFJpzPZysiE0Tr70J6k5kzzrqp6WLR8SVCmH72f8EyuUBE?gv=true"
        companyName={portfolio.company_name}
      />

      {allProjects.length > 0 && (
        <ProjectShowcase
          title="Related Experience"
          description={`Projects that demonstrate my experience relevant to ${portfolio.company_name}'s needs`}
          projects={allProjects}
        />
      )}

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
