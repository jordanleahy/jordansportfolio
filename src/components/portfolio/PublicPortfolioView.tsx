
import { CompanyPortfolio } from "@/types/companyPortfolio";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, Calendar, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicPortfolioViewProps {
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

const PublicPortfolioView = ({ portfolio }: PublicPortfolioViewProps) => {
  const generatedContent = portfolio.generated_content;
  const jobApplication = portfolio.job_applications;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <Badge variant="secondary" className="mb-4">
              <Building2 className="w-4 h-4 mr-2" />
              Portfolio for {portfolio.company_name}
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            {generatedContent?.hero_section?.headline || `Why I'm Perfect for ${portfolio.company_name}`}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {generatedContent?.hero_section?.subheadline || `Discover how my skills and experience align perfectly with your team's needs`}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {jobApplication?.resume_link && (
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <a href={jobApplication.resume_link} target="_blank" rel="noopener noreferrer">
                  <FileText className="w-5 h-5 mr-2" />
                  View Resume
                </a>
              </Button>
            )}
            {jobApplication?.job_description_link && (
              <Button asChild variant="outline" size="lg">
                <a href={jobApplication.job_description_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View Job Posting
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      {generatedContent?.hero_section?.value_proposition && (
        <section className="py-16 px-4 bg-white/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">My Value Proposition</h2>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {generatedContent.hero_section.value_proposition}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Skills Alignment Section */}
      {generatedContent?.skills_alignment && generatedContent.skills_alignment.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Skills Alignment</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {generatedContent.skills_alignment.map((skill, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-3 text-blue-600">{skill.skill}</h3>
                    <p className="text-muted-foreground mb-4">{skill.relevance}</p>
                    {skill.examples && skill.examples.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Examples:</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {skill.examples.map((example, exampleIndex) => (
                            <li key={exampleIndex}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Company Analysis Section */}
      {generatedContent?.company_analysis && (
        <section className="py-16 px-4 bg-white/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why {portfolio.company_name}?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-purple-600">Mission Alignment</h3>
                  <p className="text-muted-foreground">
                    {generatedContent.company_analysis.mission_alignment}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-green-600">Culture Fit</h3>
                  <p className="text-muted-foreground">
                    {generatedContent.company_analysis.culture_fit}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-orange-600">Growth Opportunities</h3>
                  <p className="text-muted-foreground">
                    {generatedContent.company_analysis.growth_opportunities}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Relevant Projects Section */}
      {generatedContent?.relevant_projects && generatedContent.relevant_projects.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Relevant Experience</h2>
            <div className="space-y-6">
              {generatedContent.relevant_projects.map((project, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold">Project {index + 1}</h3>
                      <Badge variant="outline">
                        {Math.round(project.relevance_score * 100)}% relevant
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {project.customized_description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cover Letter Section */}
      {portfolio.cover_letter && (
        <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">Personal Message</h2>
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="prose prose-lg max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {portfolio.cover_letter}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Application Details Section */}
      {jobApplication && (
        <section className="py-16 px-4 bg-white/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Application Details</h2>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                      Application Date
                    </h3>
                    <p className="text-muted-foreground">
                      {new Date(jobApplication.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-purple-600" />
                      Position
                    </h3>
                    <p className="text-muted-foreground">
                      {jobApplication.job_description.slice(0, 200)}...
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-xl font-semibold mb-4">Additional Resources</h3>
                  <div className="flex flex-wrap gap-4">
                    {jobApplication.resume_link && (
                      <Button asChild variant="outline">
                        <a href={jobApplication.resume_link} target="_blank" rel="noopener noreferrer">
                          <FileText className="w-4 h-4 mr-2" />
                          Resume
                        </a>
                      </Button>
                    )}
                    {jobApplication.cover_letter_link && (
                      <Button asChild variant="outline">
                        <a href={jobApplication.cover_letter_link} target="_blank" rel="noopener noreferrer">
                          <Mail className="w-4 h-4 mr-2" />
                          Cover Letter
                        </a>
                      </Button>
                    )}
                    {jobApplication.job_description_link && (
                      <Button asChild variant="outline">
                        <a href={jobApplication.job_description_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Job Posting
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400">
            This personalized portfolio was generated for {portfolio.company_name}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Created on {new Date(portfolio.created_at).toLocaleDateString()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicPortfolioView;
