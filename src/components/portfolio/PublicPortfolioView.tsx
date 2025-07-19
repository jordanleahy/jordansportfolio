
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyPortfolio } from "@/types/companyPortfolio";

interface PublicPortfolioViewProps {
  portfolio: any; // Extended portfolio with job_applications data
}

const PublicPortfolioView = ({ portfolio }: PublicPortfolioViewProps) => {
  const content = portfolio.generated_content as any || {};
  const heroSection = content.hero_section || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="space-y-2">
              <Badge variant="secondary" className="mb-4">
                Portfolio for {portfolio.company_name}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                {heroSection.headline || "Professional Portfolio"}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                {heroSection.subheadline || "Crafted specifically for this opportunity"}
              </p>
            </div>
            {heroSection.value_proposition && (
              <div className="bg-card border rounded-lg p-6 mt-8">
                <p className="text-lg leading-relaxed">
                  {heroSection.value_proposition}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Video Section */}
          {portfolio.custom_video_url && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Introduction Video</h2>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  {portfolio.custom_video_url.includes('youtube.com') || portfolio.custom_video_url.includes('youtu.be') ? (
                    <iframe
                      src={portfolio.custom_video_url.replace('watch?v=', 'embed/')}
                      className="w-full h-full"
                      allowFullScreen
                      title="Introduction Video"
                    />
                  ) : (
                    <video
                      src={portfolio.custom_video_url}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cover Letter Section */}
          {portfolio.cover_letter && (
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Cover Letter</h2>
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {portfolio.cover_letter}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills & Experience Highlights */}
          {content.skills_alignment && content.skills_alignment.length > 0 && (
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Relevant Skills & Experience</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {content.skills_alignment.map((skill: any, index: number) => (
                    <div key={index} className="space-y-3">
                      <h3 className="font-semibold text-lg">{skill.skill}</h3>
                      <p className="text-muted-foreground">{skill.relevance}</p>
                      {skill.examples && skill.examples.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {skill.examples.map((example: string, exIndex: number) => (
                            <li key={exIndex}>{example}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company Analysis Section */}
          {content.company_analysis && (
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Why {portfolio.company_name}?</h2>
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
            <Card className="border-dashed">
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
        </div>
      </div>
    </div>
  );
};

export default PublicPortfolioView;
