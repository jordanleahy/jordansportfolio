
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CompanyPortfolio } from "@/types/companyPortfolio";
import { TimeOnTaskTimer } from "@/components/TimeOnTaskTimer";

interface PublicPortfolioViewProps {
  portfolio: any; // Extended portfolio with job_applications data
}

const PublicPortfolioView = ({ portfolio }: PublicPortfolioViewProps) => {
  const content = portfolio.generated_content as any || {};
  const heroSection = content.hero_section || {};

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-background/90 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            
          </div>

          {/* Video and Cover Letter Section - Side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-8 mb-12">
            {/* Video Section */}
            <Card className="bg-transparent border-none shadow-none">
              <CardContent className="p-0 space-y-4">
                <AspectRatio ratio={9/16}>
                  {portfolio.custom_video_url ? (
                    portfolio.custom_video_url.includes('youtube.com') || portfolio.custom_video_url.includes('youtu.be') ? (
                      <iframe
                        src={portfolio.custom_video_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                        title="Introduction Video"
                      />
                    ) : (
                      <video
                        className="w-full h-full object-cover rounded-lg"
                        controls
                        preload="metadata"
                        muted
                        autoPlay={false}
                      >
                        <source src={portfolio.custom_video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )
                  ) : (
                    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <div className="w-16 h-16 bg-muted-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <div className="w-6 h-6 bg-muted-foreground/40 rounded-full"></div>
                        </div>
                        <p className="text-sm">Introduction Video</p>
                        <p className="text-xs">Coming Soon</p>
                      </div>
                    </div>
                  )}
                </AspectRatio>
                <TimeOnTaskTimer />
              </CardContent>
            </Card>

            {/* Cover Letter Content */}
            {portfolio.cover_letter && (
              <Card>
                <CardContent className="p-8">
                  <div className="prose prose-lg max-w-none">
                    <h2 className="text-2xl font-semibold mb-6">Dear {portfolio.company_name} Team,</h2>
                    
                    <div className="space-y-6 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {portfolio.cover_letter}
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
            )}
          </div>

          {/* Skills & Experience Highlights */}
          {content.skills_alignment && content.skills_alignment.length > 0 && (
            <div className="mt-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Relevant Skills & Experience</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Skills and experience that align with {portfolio.company_name}'s needs
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {content.skills_alignment.map((skill: any, index: number) => (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <CardTitle className="text-xl mb-2">{skill.skill}</CardTitle>
                      <CardDescription className="text-sm">
                        {skill.relevance}
                      </CardDescription>
                    </CardHeader>
                    {skill.examples && skill.examples.length > 0 && (
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {skill.examples.slice(0, 3).map((example: string, exIndex: number) => (
                            <span key={exIndex} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                              {example.substring(0, 20)}...
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Company Analysis Section */}
          {content.company_analysis && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Why {portfolio.company_name}?</CardTitle>
                <CardDescription>
                  Understanding the mission and values that drive alignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {content.company_analysis.mission_alignment && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Mission Alignment</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {content.company_analysis.mission_alignment}
                      </p>
                    </div>
                  )}
                  {content.company_analysis.culture_fit && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Cultural Fit</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {content.company_analysis.culture_fit}
                      </p>
                    </div>
                  )}
                  {content.company_analysis.growth_opportunities && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Growth Vision</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {content.company_analysis.growth_opportunities}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Description Reference (if available) */}
          {portfolio.job_applications?.job_description && (
            <Card className="border-dashed mt-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
                  Job Description Reference
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                    {portfolio.job_applications.job_description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
              <iframe src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0HtVBzITEmJVDw6wxuGBdLLnH99oOFJpzPZysiE0Tr70J6k5kzzrqp6WLR8SVCmH72f8EyuUBE?gv=true" style={{
                border: 0
              }} width="100%" height="600" frameBorder="0" />
              {/* end Google Calendar Appointment Scheduling */}
            </CardContent>
          </Card>

          {/* Healthcare Project Showcase */}
          <div className="mt-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Related Healthcare AI Experience</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Healthcare AI projects that demonstrate my experience with workflow automation and clinical decision support systems
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Inpatient Revenue Cycle Management */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">Inpatient Revenue Cycle Management</CardTitle>
                  <CardDescription className="text-sm">
                    Designed an AI-powered CDI dashboard to help CDS specialists review and validate pre-bill diagnoses.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#RCM</span>
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#LLM</span>
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#ICD-10</span>
                  </div>
                  <button 
                    onClick={() => window.open('/cases/case1', '_blank')}
                    className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all"
                  >
                    View Case Study
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </CardContent>
              </Card>

              {/* Drug Prior Auth and Validation */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-cyan-600 rounded-lg flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">Drug Prior Auth and Validation</CardTitle>
                  <CardDescription className="text-sm">
                    Designed an AI drug prior authorization workflow tool that identifies formulary rules, medical requirements, step therapy, reauthorization dates, drafts the letter, and sends to the appropriate insurance company.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#PriorAuth</span>
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#ML</span>
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#Workflow</span>
                  </div>
                  <button 
                    onClick={() => window.open('/cases/case4', '_blank')}
                    className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all"
                  >
                    View Case Study
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </CardContent>
              </Card>

              {/* Denial and Appeal Resolution */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center">
                      <div className="w-3 h-3 border border-white"></div>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">Denial and Appeal Resolution</CardTitle>
                  <CardDescription className="text-sm">
                    Designed a denial and appeal resolution application for managing denials, including the drafting of templates and sending to payer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#Appeals</span>
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#Research</span>
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#UX</span>
                  </div>
                  <button 
                    onClick={() => window.open('/cases/case3', '_blank')}
                    className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all"
                  >
                    View Case Study
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PublicPortfolioView;
