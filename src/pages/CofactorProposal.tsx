import { PageLayout } from '@/components/layout/PageLayout';
import { Section } from '@/components/layout/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, CheckCircle, Users, Target, Brain, Lightbulb, TrendingUp, Shield } from 'lucide-react';

export default function CofactorProposal() {
  return (
    <PageLayout>
      <div>
        {/* Hero Section */}
        <Section maxWidth="6xl" fluid className="min-h-[80vh] p-0 flex items-center" style={{backgroundImage: 'url(/lovable-uploads/908f3567-ba5a-43c2-be9a-bd4900137ceb.png)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
          <div className="relative overflow-hidden rounded-2xl w-full">
            
              <div className="space-y-6 relative text-center py-16 px-8 flex flex-col justify-center">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent">
                  Query Innovation
                </h1>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground/90">
                  Team Alignment & Design Workshop
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  Strategic AI-powered design sprint to optimize user experience, validate product direction, 
                  and create a comprehensive roadmap for growth with your medical professional users.
                </p>
              </div>
          </div>
        </Section>

        {/* Project Timeline */}
        <Section maxWidth="6xl" fluid>
              <div className="space-y-8 max-w-[900px] mx-auto">
                <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Timeline
                </h2>
                  <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    A 3 week structured approach combining strategic alignment, intensive design sprinting, and actionable synthesis.
                  </p>
                </div>
          <div className="grid gap-8 lg:gap-12">
            {/* Week 1 */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">1</div>
                  Week 1 – Admin & Prep
                </CardTitle>
                <p className="text-muted-foreground">Alignment with Adi & Juan, define sprint challenge, and prepare logistics</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                    <Badge variant="outline" className="md:shrink-0 self-start">Day 1-2</Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold">Kick-off & Alignment</h4>
                      <p className="text-sm text-muted-foreground">Confirm objectives, success criteria, view map, team roles</p>
                      <p className="text-xs text-primary font-medium mt-1">Ask: Up to two 45 minute meetings</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                    <Badge variant="outline" className="md:shrink-0 self-start">Day 3-4</Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold">Team Recruitment</h4>
                      <p className="text-sm text-muted-foreground">Recruit sprint team (5-7 participants), schedule workshop & user tests</p>
                      <p className="text-xs text-primary font-medium mt-1">Ask: Who will participate from CoFactorAI and how can we get a physician and physician advisor?</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                    <Badge variant="outline" className="md:shrink-0 self-start">Day 5</Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold">Participant Interviews</h4>
                      <p className="text-sm text-muted-foreground">Participant interviews, prior research, share sprint primer</p>
                      <p className="text-xs text-primary font-medium mt-1">Ask: 30 minute interview with each participant</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Week 2 */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-secondary/20 to-secondary/10">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-bold">2</div>
                  Week 2 – Design Sprint Workshop (4 Days)
                </CardTitle>
                <p className="text-muted-foreground">Time boxed design sprint supported by AI design prototyping and testing</p>
              </CardHeader>
              <CardContent className="p-6">
                {/* Monday Detailed Agenda */}
                <div className="space-y-6">
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Monday – Define the Challenge
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">9:00-9:30</Badge>
                        <span>Introductions & Sprint Overview</span>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">9:30-10:30</Badge>
                        <span>Expert Interviews with MDs & PAs</span>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">10:45-11:15</Badge>
                        <span>HMW Clustering & Voting</span>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">11:15-12:00</Badge>
                        <span>Long-Term Goal Setting</span>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">1:15-3:00</Badge>
                        <span>Mapping the Challenge</span>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">3:15-4:30</Badge>
                        <span>Expert Debrief & Finalize Map</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Tuesday – AI Design & Decision
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">9:15-10:45</Badge>
                        <span>AI Design Generation (Lovable is preferred choice excellent for this use case)</span>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">11:00-12:30</Badge>
                        <span>Curate & Share AI Outputs</span>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">1:15-2:30</Badge>
                        <span>Heatmap Voting & Presentations</span>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">2:45-3:45</Badge>
                        <span>Straw Poll & Decider Vote</span>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">3:45-4:30</Badge>
                        <span>Storyboarding</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h5 className="font-medium mb-2">Wednesday – Prototype</h5>
                      <p className="text-sm text-muted-foreground">Jordan at minimum will create prototype for user testing. Recommend Cameron join as well.</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h5 className="font-medium mb-2">Thursday – Test & Learn</h5>
                      <p className="text-sm text-muted-foreground">User test against as many MDs as possible</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Week 3 */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-accent/20 to-accent/10">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold">3</div>
                  Week 3 – Synthesis & Direction Setting
                </CardTitle>
                <p className="text-muted-foreground">Translate sprint outcomes into actionable product direction</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span>Analyze user test insights and document outcomes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span>Create a list of PRDs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span>Final presentation to leadership with prototype demo</span>
                  </div>
                </div>
              </CardContent>
            </Card>
              </div>
            </div>
        </Section>

        {/* Tools & Technology */}
        <Section maxWidth="6xl" fluid>
          <div className="space-y-8 max-w-[900px] mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Lightbulb className="w-6 h-6" />
                    Tools & Technology
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Primary Tools</h4>
                      <div className="space-y-2">
                        <Badge variant="secondary">Lovable - AI Prototyping</Badge>
                        <Badge variant="secondary">Miro - Workshop Collaboration</Badge>
                        <Badge variant="secondary">Video Recording - User Testing</Badge>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Data & Testing</h4>
                      <div className="space-y-2">
                        <Badge variant="outline">Synthetic Query Data</Badge>
                        <Badge variant="outline">Real-world Input Simulation</Badge>
                        <Badge variant="outline">5 User Testing Sessions</Badge>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Deliverables */}
        <Section maxWidth="6xl" fluid>
          <div className="space-y-8 max-w-[900px] mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6" />
                    Deliverables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">React front-end application with dummy data in Lovable</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">User testing recordings & notes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">How Might We board & decision map</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">Product Direction Playbook</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">Final presentation deck with recommendations</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">Workshop collaboration materials</span>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Pricing & Terms */}
        <Section maxWidth="6xl" fluid>
          <div className="space-y-8 max-w-[900px] mx-auto">
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <TrendingUp className="w-6 h-6" />
                    Investment & Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Investment</h4>
                        <div className="text-3xl font-bold text-primary">$13,500</div>
                        <p className="text-sm text-muted-foreground mt-1">3 weeks</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Payment Terms</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">50%</Badge>
                            <span>Upon signing</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">50%</Badge>
                            <span>Upon final report delivery</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div>
                        <h4 className="font-semibold mb-3">Target Dates</h4>
                        <div className="bg-muted/50 rounded-lg p-4 text-sm mb-6">
                          <p className="font-medium">Mon, September 1st to Mon Sep 22nd</p>
                        </div>
                      </div>
                      
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Satisfaction Policy
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-4 text-sm">
                        <p>
                          If you are truly not satisfied with the final deliverable which will target our aligned 
                          objectives and success criteria, the final payment will be void.
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Terms: Due upon receipt
                        </p>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* CTA Section */}
        <Section maxWidth="6xl" fluid>
          <div className="space-y-8 max-w-[900px] mx-auto">
          <div className="text-center space-y-6 py-8">
            <h2 className="text-2xl font-bold">Ready to Transform CoFactorAI's Product Direction?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Let's collaborate to create a user-centered product strategy that drives growth and delivers exceptional value to your medical professional users.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8">
                Start the Engagement
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8">
                Schedule a Discussion
              </Button>
            </div>
          </div>
          </div>
        </Section>

      </div>
    </PageLayout>
  );
}