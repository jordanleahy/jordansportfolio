import React from "react";
import { CompanyPortfolio } from "@/types/companyPortfolio";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { TimeOnTaskTimer } from "@/components/TimeOnTaskTimer";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/90 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Can add hero content here if needed */}
        </div>

        {/* Video and Cover Letter Section - Side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-8 mb-12">
          {/* Video Section */}
          <Card className="bg-transparent border-none shadow-none">
            <CardContent className="p-0 space-y-4">
              <AspectRatio ratio={9/16}>
                <video 
                  className="w-full h-full object-cover rounded-lg"
                  controls
                  preload="metadata"
                  muted
                  autoPlay={false}
                  poster="/lovable-uploads/6ad28481-a75a-4096-a9f1-74822cefe882.png"
                >
                  <source src="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//667F0B04-8D3D-429C-992C-1D8FB2883E9E%20(1)%20(1)%202.mov" type="video/mp4" />
                  <source src="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//667F0B04-8D3D-429C-992C-1D8FB2883E9E%20(1)%20(1)%202.mov" type="video/quicktime" />
                  Your browser does not support the video tag.
                </video>
              </AspectRatio>
              <TimeOnTaskTimer />
            </CardContent>
          </Card>

          {/* Cover Letter Content */}
          <Card>
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-semibold mb-6">
                  {generatedContent?.hero_section?.headline || `Dear ${portfolio.company_name} Team,`}
                </h2>
                
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  {generatedContent?.cover_letter ? (
                    <div className="whitespace-pre-wrap">
                      {generatedContent.cover_letter}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {generatedContent?.hero_section?.value_proposition && (
                        <p>{generatedContent.hero_section.value_proposition}</p>
                      )}
                      
                      {generatedContent?.company_analysis && (
                        <p>
                          I'm particularly drawn to {portfolio.company_name} because of our shared values. 
                          {generatedContent.company_analysis.mission_alignment && ` ${generatedContent.company_analysis.mission_alignment}`}
                        </p>
                      )}

                      {generatedContent?.skills_alignment && generatedContent.skills_alignment.length > 0 && (
                        <p>
                          My experience directly aligns with your needs. {generatedContent.skills_alignment[0]?.relevance}
                        </p>
                      )}

                      <p>
                        I would love to discuss how my experience can contribute to {portfolio.company_name}'s continued success and growth.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t">
                  <p className="text-lg font-medium">
                    Best regards,<br />
                    Jordan Leahy
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    jordanwilliamleahy.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Google Calendar Scheduling */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Schedule a Conversation</CardTitle>
            <CardDescription>
              Let's discuss how my experience can contribute to {portfolio.company_name}'s mission
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google Calendar Appointment Scheduling begin */}
            <iframe 
              src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0HtVBzITEmJVDw6wxuGBdLLnH99oOFJpzPZysiE0Tr70J6k5kzzrqp6WLR8SVCmH72f8EyuUBE?gv=true" 
              style={{ border: 0 }} 
              width="100%" 
              height="600" 
              frameBorder="0" 
            />
            {/* end Google Calendar Appointment Scheduling */}
          </CardContent>
        </Card>

        {/* Relevant Projects Section */}
        {generatedContent?.relevant_projects && generatedContent.relevant_projects.length > 0 && (
          <div className="mt-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Related Experience</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Projects that demonstrate my experience relevant to {portfolio.company_name}'s needs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {generatedContent.relevant_projects.slice(0, 3).map((project, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <CardTitle className="text-xl mb-2">Relevant Project {index + 1}</CardTitle>
                    <CardDescription className="text-sm">
                      {project.customized_description.slice(0, 150)}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">
                        {Math.round(project.relevance_score * 100)}% match
                      </span>
                      <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#Project</span>
                    </div>
                    <div className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                      View Details
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Skills Alignment as Additional Cards */}
              {generatedContent?.skills_alignment && generatedContent.skills_alignment.slice(0, 3 - (generatedContent.relevant_projects?.length || 0)).map((skill, index) => (
                <Card key={`skill-${index}`} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader>
                    <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-cyan-600 rounded-lg flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-sm"></div>
                      </div>
                    </div>
                    <CardTitle className="text-xl mb-2">{skill.skill}</CardTitle>
                    <CardDescription className="text-sm">
                      {skill.relevance.slice(0, 150)}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#Skill</span>
                      <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#Experience</span>
                    </div>
                    <div className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                      Learn More
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Application Links */}
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
      </div>
    </div>
  );
};

export default CoverLetterPortfolioView;