import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CompanyPortfolio } from "@/types/companyPortfolio";
import { TimeOnTaskTimer } from "@/components/TimeOnTaskTimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateCompanyPortfolio } from "@/hooks/useCompanyPortfolios";
import { toast } from "sonner";

interface PublicPortfolioViewProps {
  portfolio: any; // Extended portfolio with job_applications data
}

const PublicPortfolioView = ({ portfolio }: PublicPortfolioViewProps) => {
  const [user, setUser] = useState<any>(null);
  const [editingSections, setEditingSections] = useState<{[key: string]: boolean}>({});
  const [editableContent, setEditableContent] = useState({
    hero_headline: "",
    hero_subheadline: "",
    value_proposition: "",
    cover_letter: "",
    custom_video_url: ""
  });

  const updatePortfolio = useUpdateCompanyPortfolio();
  const content = portfolio.generated_content as any || {};
  const heroSection = content.hero_section || {};

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize editable content
  useEffect(() => {
    if (portfolio) {
      setEditableContent({
        hero_headline: heroSection?.headline || "",
        hero_subheadline: heroSection?.subheadline || "",
        value_proposition: heroSection?.value_proposition || "",
        cover_letter: portfolio.cover_letter || "",
        custom_video_url: portfolio.custom_video_url || ""
      });
    }
  }, [portfolio]);

  const canEdit = user && portfolio && portfolio.user_id === user.id;

  const startEditing = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: true }));
  };

  const cancelEditing = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: false }));
    // Reset to original values
    if (portfolio) {
      setEditableContent({
        hero_headline: heroSection?.headline || "",
        hero_subheadline: heroSection?.subheadline || "",
        value_proposition: heroSection?.value_proposition || "",
        cover_letter: portfolio.cover_letter || "",
        custom_video_url: portfolio.custom_video_url || ""
      });
    }
  };

  const saveSection = async (section: string) => {
    if (!portfolio) return;

    try {
      let updateData: any = {};

      if (section === 'hero') {
        updateData = {
          generated_content: {
            ...content,
            hero_section: {
              headline: editableContent.hero_headline,
              subheadline: editableContent.hero_subheadline,
              value_proposition: editableContent.value_proposition
            }
          }
        };
      } else if (section === 'cover_letter') {
        updateData = { cover_letter: editableContent.cover_letter };
      } else if (section === 'video') {
        updateData = { custom_video_url: editableContent.custom_video_url };
      }

      await updatePortfolio.mutateAsync({
        id: portfolio.id,
        ...updateData
      });

      setEditingSections(prev => ({ ...prev, [section]: false }));
      toast.success("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error("Failed to save changes");
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-background/90 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12 relative group">
            {canEdit && !editingSections.hero && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => startEditing('hero')}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}

            {editingSections.hero ? (
              <div className="space-y-4">
                <Input
                  value={editableContent.hero_headline}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, hero_headline: e.target.value }))}
                  placeholder="Your compelling headline..."
                  className="text-center text-2xl font-bold"
                />
                <Input
                  value={editableContent.hero_subheadline}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                  placeholder="Supporting message..."
                  className="text-center text-lg"
                />
                <Textarea
                  value={editableContent.value_proposition}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, value_proposition: e.target.value }))}
                  placeholder="What unique value do you bring..."
                  rows={3}
                  className="text-center"
                />
                <div className="flex justify-center gap-2">
                  <Button size="sm" onClick={() => saveSection('hero')}>
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => cancelEditing('hero')}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {heroSection?.headline && (
                  <h1 className="text-4xl font-bold mb-4">{heroSection.headline}</h1>
                )}
                {heroSection?.subheadline && (
                  <p className="text-xl text-muted-foreground mb-6">{heroSection.subheadline}</p>
                )}
                {heroSection?.value_proposition && (
                  <p className="text-lg max-w-2xl mx-auto">{heroSection.value_proposition}</p>
                )}
              </>
            )}
          </div>

          {/* Video and Cover Letter Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-8 mb-12">
            {/* Video Section */}
            <Card className="bg-transparent border-none shadow-none relative group">
              {canEdit && !editingSections.video && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => startEditing('video')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}

              <CardContent className="p-0 space-y-4">
                {editingSections.video ? (
                  <div className="space-y-4">
                    <Input
                      value={editableContent.custom_video_url}
                      onChange={(e) => setEditableContent(prev => ({ ...prev, custom_video_url: e.target.value }))}
                      placeholder="Video URL..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveSection('video')}>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => cancelEditing('video')}>
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <AspectRatio ratio={9 / 16}>
                    {portfolio.custom_video_url ? (
                      portfolio.custom_video_url.includes('youtube.com') || portfolio.custom_video_url.includes('youtu.be') ? (
                        <iframe 
                          src={portfolio.custom_video_url.replace('watch?v=', 'embed/')} 
                          className="w-full h-full rounded-lg" 
                          allowFullScreen 
                          title="Introduction Video" 
                        />
                      ) : (
                        <video className="w-full h-full object-cover rounded-lg" controls preload="metadata" muted autoPlay={false}>
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
                )}
                <TimeOnTaskTimer />
              </CardContent>
            </Card>

            {/* Cover Letter Content */}
            {(portfolio.cover_letter || editingSections.cover_letter) && (
              <Card className="relative group">
                {canEdit && !editingSections.cover_letter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => startEditing('cover_letter')}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}

                <CardContent className="p-8">
                  {editingSections.cover_letter ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editableContent.cover_letter}
                        onChange={(e) => setEditableContent(prev => ({ ...prev, cover_letter: e.target.value }))}
                        placeholder="Your personalized cover letter..."
                        rows={12}
                        className="min-h-[300px]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveSection('cover_letter')}>
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => cancelEditing('cover_letter')}>
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
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
                  )}
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

          {/* Google Calendar Scheduling */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Schedule a Conversation</CardTitle>
              <CardDescription>
                Let's discuss how my experience can contribute to {portfolio.company_name}'s mission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <iframe 
                src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0HtVBzITEmJVDw6wxuGBdLLnH99oOFJpzPZysiE0Tr70J6k5kzzrqp6WLR8SVCmH72f8EyuUBE?gv=true" 
                style={{ border: 0 }} 
                width="100%" 
                height="600" 
                frameBorder="0" 
              />
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
              {/* Keep existing healthcare project cards */}
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
                  <button onClick={() => window.open('/cases/case1', '_blank')} className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                    View Case Study
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </CardContent>
              </Card>

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
                  <button onClick={() => window.open('/cases/case4', '_blank')} className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                    View Case Study
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </CardContent>
              </Card>

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
                  <button onClick={() => window.open('/cases/case3', '_blank')} className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
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
