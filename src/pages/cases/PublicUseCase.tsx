import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Helmet } from "react-helmet-async";
import NotFound from "@/pages/NotFound";

export default function PublicUseCase() {
  const { slug } = useParams<{ slug: string }>();

  const { data: useCase, isLoading, error } = useQuery({
    queryKey: ['public-use-case', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('use_cases')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded w-2/3 mx-auto"></div>
            <div className="h-6 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !useCase) {
    return <NotFound />;
  }

  // Transform JSON fields similar to useUseCases hook
  const transformedUseCase = {
    ...useCase,
    challenges: (Array.isArray(useCase.challenges) ? useCase.challenges : []) as any[],
    team_members: (Array.isArray(useCase.team_members) ? useCase.team_members : []) as any[],
    process_steps: (Array.isArray(useCase.process_steps) ? useCase.process_steps : []) as any[],
    features: (Array.isArray(useCase.features) ? useCase.features : []) as any[],
    reflections: (Array.isArray(useCase.reflections) ? useCase.reflections : []) as any[],
    visual_artifacts: useCase.visual_artifacts && typeof useCase.visual_artifacts === 'object' 
      ? useCase.visual_artifacts as { designArtifacts: string[]; processDocumentation: string[] }
      : { designArtifacts: [], processDocumentation: [] },
    user_feedback: useCase.user_feedback && typeof useCase.user_feedback === 'object'
      ? useCase.user_feedback as { quote: string; author: string }
      : undefined,
    technical_requirements: Array.isArray(useCase.technical_requirements) ? useCase.technical_requirements : [],
    tags: Array.isArray(useCase.tags) ? useCase.tags : [],
  };

  return (
    <>
      <Helmet>
        <title>{transformedUseCase.title}</title>
        <meta name="description" content={transformedUseCase.description} />
        <meta property="og:title" content={transformedUseCase.title} />
        <meta property="og:description" content={transformedUseCase.description} />
        {transformedUseCase.hero_image && (
          <meta property="og:image" content={transformedUseCase.hero_image} />
        )}
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {transformedUseCase.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">{transformedUseCase.title}</h1>
              <p className="text-xl text-muted-foreground mb-8">{transformedUseCase.description}</p>
              
              {transformedUseCase.hero_image && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-8">
                  <img 
                    src={transformedUseCase.hero_image} 
                    alt={transformedUseCase.hero_image_alt || transformedUseCase.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div>
                  <h3 className="font-semibold mb-2">My Role</h3>
                  <p className="text-muted-foreground">{transformedUseCase.role}</p>
                  {transformedUseCase.role_details && (
                    <p className="text-sm text-muted-foreground mt-2">{transformedUseCase.role_details}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Timeline</h3>
                  <p className="text-muted-foreground">{transformedUseCase.timeline_value}</p>
                  {transformedUseCase.timeline_details && (
                    <p className="text-sm text-muted-foreground mt-2">{transformedUseCase.timeline_details}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto space-y-16">
            
            {/* Problem Section */}
            {transformedUseCase.problem_title && (
              <section>
                <h2 className="text-3xl font-bold mb-8">{transformedUseCase.problem_title}</h2>
                <div className="prose prose-lg max-w-none mb-8">
                  <p>{transformedUseCase.problem_description}</p>
                </div>
                
                {transformedUseCase.challenges && transformedUseCase.challenges.length > 0 && (
                  <div className="grid gap-6">
                    {transformedUseCase.challenges.map((challenge: any, index: number) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">
                              {challenge.type === 'problem' ? '🚨' : '🎯'}
                            </span>
                            {challenge.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {challenge.items.map((item: string, itemIndex: number) => (
                              <li key={itemIndex} className="flex items-start gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Solution Section */}
            {transformedUseCase.solution_title && (
              <section>
                <h2 className="text-3xl font-bold mb-8">{transformedUseCase.solution_title}</h2>
                {transformedUseCase.features && transformedUseCase.features.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {transformedUseCase.features.map((feature: any, index: number) => (
                      <Card key={index} className="h-full">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="text-3xl">{feature.icon}</div>
                            <div>
                              <h3 className="font-semibold mb-2">{feature.title}</h3>
                              <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Process Section */}
            {transformedUseCase.process_steps && transformedUseCase.process_steps.length > 0 && (
              <section>
                <h2 className="text-3xl font-bold mb-8">{transformedUseCase.process_title || 'Process'}</h2>
                <div className="space-y-8">
                  {transformedUseCase.process_steps.map((step: any, index: number) => (
                    <div key={index} className="flex gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground mb-4">{step.description}</p>
                        {step.items && step.items.length > 0 && (
                          <ul className="space-y-1 mb-4">
                            {step.items.map((item: string, itemIndex: number) => (
                              <li key={itemIndex} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                <span className="text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {step.quote && (
                          <blockquote className="border-l-4 border-primary pl-4 italic">
                            "{step.quote.text}"
                            <cite className="block text-sm text-muted-foreground mt-2">— {step.quote.author}</cite>
                          </blockquote>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Team Section */}
            {transformedUseCase.team_members && transformedUseCase.team_members.length > 0 && (
              <section>
                <h2 className="text-3xl font-bold mb-8">Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {transformedUseCase.team_members.map((member: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">{member.icon}</span>
                          {member.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{member.description}</p>
                        <ul className="space-y-1">
                          {member.items.map((item: string, itemIndex: number) => (
                            <li key={itemIndex} className="text-sm">{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Outcomes */}
            {(transformedUseCase.user_feedback || transformedUseCase.outcomes_title) && (
              <section>
                <h2 className="text-3xl font-bold mb-8">{transformedUseCase.outcomes_title || 'Outcomes'}</h2>
                {transformedUseCase.user_feedback && (
                  <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
                    <CardContent className="p-8 text-center">
                      <blockquote className="text-xl italic mb-4">
                        "{transformedUseCase.user_feedback.quote}"
                      </blockquote>
                      <cite className="text-muted-foreground">— {transformedUseCase.user_feedback.author}</cite>
                    </CardContent>
                  </Card>
                )}
              </section>
            )}

            {/* Links & Resources */}
            {(transformedUseCase.prototype_url || transformedUseCase.figma_presentation_url) && (
              <section>
                <h2 className="text-3xl font-bold mb-8">View the Work</h2>
                <div className="flex flex-wrap gap-4">
                  {transformedUseCase.prototype_url && (
                    <Button asChild>
                      <a href={transformedUseCase.prototype_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Prototype
                      </a>
                    </Button>
                  )}
                  {transformedUseCase.figma_presentation_url && (
                    <Button variant="outline" asChild>
                      <a href={transformedUseCase.figma_presentation_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {transformedUseCase.figma_presentation_title || 'View Design'}
                      </a>
                    </Button>
                  )}
                </div>
              </section>
            )}

            {/* CTA */}
            <section className="text-center py-16">
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
                <CardContent className="p-12">
                  <h2 className="text-3xl font-bold mb-4">
                    {transformedUseCase.cta_title || 'Interested in working together?'}
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Let's discuss how I can help bring your ideas to life.
                  </p>
                  <Button size="lg" asChild>
                    <a href="/about#contact">Get in Touch</a>
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}