import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/layout/AppLayout";
import { generateSEOMetadata } from "@/utils/seoHelpers";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Zap, Target, ArrowRight, BookOpen, Lightbulb, Users, TrendingUp, Clock, Star, CheckCircle, Play, Heart, Stethoscope, Brain, GraduationCap, FileText, Microscope } from "lucide-react";

const StoryShip = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [demoInput, setDemoInput] = useState("");

  // Generate SEO metadata for Story Ship landing page
  const storyShipSEO = generateSEOMetadata({
    title: "Story Ship - Create Engaging Medical Education Content",
    description: "Transform medical concepts into compelling educational stories and content. Advanced medical storytelling for healthcare professionals and educators.",
    image: "/lovable-uploads/a3482ced-732a-40a0-95b4-3199495f0f4f.png",
    url: "/storyship",
    type: "website"
  });
  
  const handleGetStarted = () => {
    if (user) {
      navigate('/stories');
    } else {
      navigate('/auth');
    }
  };
  
  const handleDemoSubmit = () => {
    if (demoInput.trim()) {
      if (user) {
        navigate('/stories', {
          state: {
            demoTheme: demoInput
          }
        });
      } else {
        navigate('/auth', {
          state: {
            returnTo: '/stories',
            demoTheme: demoInput
          }
        });
      }
    }
  };
  
  const features = [{
    icon: Brain,
    title: "Medical Concept Transformation",
    description: "Convert complex medical concepts into engaging educational narratives with patient stories, case studies, and visual explanations.",
    highlight: "30+ educational posts per topic"
  }, {
    icon: Stethoscope,
    title: "Clinical Case Stories",
    description: "Automatically generate patient case studies and clinical scenarios organized by specialty, difficulty, and learning objectives.",
    highlight: "Evidence-based scenarios"
  }, {
    icon: Zap,
    title: "Instant Medical Content",
    description: "Transform medical topics into digestible educational content in seconds. Perfect for medical educators and healthcare professionals.",
    highlight: "30-second generation"
  }, {
    icon: Microscope,
    title: "Visual Medical Storytelling",
    description: "Each medical story includes professionally generated medical illustrations, diagrams, and imagery optimized for educational platforms.",
    highlight: "Medical-grade visuals"
  }, {
    icon: GraduationCap,
    title: "Learning-Focused Content",
    description: "Content designed with educational principles, including learning objectives, assessment questions, and knowledge checks.",
    highlight: "Pedagogically sound"
  }, {
    icon: FileText,
    title: "Multi-Format Output",
    description: "Generate content for lectures, patient education materials, social media, and continuing education programs simultaneously.",
    highlight: "Multiple formats"
  }];
  
  const useCases = [{
    title: "Medical Educators",
    description: "Create engaging case studies and educational content for medical students and residents",
    icon: GraduationCap
  }, {
    title: "Healthcare Professionals",
    description: "Develop patient education materials and clinical training scenarios",
    icon: Stethoscope
  }, {
    title: "Medical Researchers",
    description: "Transform research findings into accessible educational narratives",
    icon: Microscope
  }, {
    title: "Healthcare Organizations",
    description: "Create consistent educational content for staff training and patient communication",
    icon: Heart
  }];
  
  const steps = [{
    step: "1",
    title: "Input Medical Concept",
    description: "Enter any medical topic, condition, or educational objective you want to transform into engaging content"
  }, {
    step: "2",
    title: "Intelligent Medical Processing",
    description: "Our system analyzes your input using medical knowledge to generate educationally sound content and case studies"
  }, {
    step: "3",
    title: "Get Educational Content",
    description: "Receive 30+ medical education posts with visuals, case studies, and learning materials ready for use"
  }];
  
  return <>
      <Helmet>
        <title>{storyShipSEO.title}</title>
        <meta name="description" content={storyShipSEO.description} />
        <meta property="og:title" content={storyShipSEO.ogTitle} />
        <meta property="og:description" content={storyShipSEO.ogDescription} />
        <meta property="og:image" content={storyShipSEO.image} />
        <meta property="og:url" content={storyShipSEO.url} />
        <meta property="og:type" content={storyShipSEO.type} />
        <meta property="og:site_name" content={storyShipSEO.siteName} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={storyShipSEO.ogTitle} />
        <meta name="twitter:description" content={storyShipSEO.ogDescription} />
        <meta name="twitter:image" content={storyShipSEO.image} />
      </Helmet>
      
      <AppLayout>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-50" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              {/* Brand & Tagline */}
              <div className="space-y-4">
                <Badge className="px-6 py-2 text-lg font-semibold bg-primary/10 text-primary border-primary/20">
                  <Heart className="w-5 h-5 mr-2" />
                  Story Ship
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent leading-tight">Every medical concept is a story</h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                  Transform complex medical concepts into engaging educational stories. Advanced content creation for healthcare professionals and medical educators.
                </p>
              </div>

              {/* Interactive Demo */}
              <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-2 border-primary/20 shadow-xl bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea placeholder="Enter a medical concept... 'Diabetes Type 2 pathophysiology' or 'Cardiac catheterization procedure' or 'Pediatric asthma management'" value={demoInput} onChange={e => setDemoInput(e.target.value)} className="min-h-[120px] text-lg resize-none" />
                    <Button onClick={handleDemoSubmit} className="w-full text-lg py-6" disabled={!demoInput.trim()}>
                      <Heart className="w-5 h-5 mr-2" />
                      Generate Medical Education Content
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
                
                
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Powerful Features for Medical Education
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Everything you need to transform medical concepts into compelling educational content, complete with professional visuals and case studies.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {feature.highlight}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-gradient-to-b from-background to-primary/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                How Medical Story Ship Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                From medical concept to educational content in three simple steps. Our system handles the complexity while you focus on teaching.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {steps.map((step, index) => <div key={index} className="text-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 mx-auto bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold">
                        {step.step}
                      </div>
                      {index < steps.length - 1 && <ArrowRight className="hidden md:block absolute top-8 left-full transform -translate-y-1/2 translate-x-4 w-6 h-6 text-primary/50" />}
                    </div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>)}
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Perfect for Medical Education
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Whether you're teaching medical students, training residents, or educating patients, Medical Story Ship adapts to your educational needs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {useCases.map((useCase, index) => <Card key={index} className="text-center p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="space-y-4">
                    <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                      <useCase.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{useCase.title}</h3>
                    <p className="text-sm text-muted-foreground">{useCase.description}</p>
                  </div>
                </Card>)}
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-24 bg-gradient-to-b from-background to-primary/5">
          
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to Transform Medical Education?
              </h2>
              
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" onClick={() => navigate('/auth')} className="text-lg px-8 py-6 text-primary">
                  <Heart className="w-5 h-5 mr-2" />
                  {user ? "Open Education Dashboard" : "Start Creating Medical Content"}
                </Button>
                <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm opacity-75">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Evidence-based content
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Medical-grade visuals
                </div>
              </div>
            </div>
          </div>
        </section>
      </AppLayout>
    </>;
};

export default StoryShip;