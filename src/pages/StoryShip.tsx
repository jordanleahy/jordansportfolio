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
import { Sparkles, Zap, Target, ArrowRight, BookOpen, Lightbulb, Users, TrendingUp, Clock, Star, CheckCircle, Play } from "lucide-react";
const StoryShip = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [demoInput, setDemoInput] = useState("");

  // Generate SEO metadata for Story Ship landing page
  const storyShipSEO = generateSEOMetadata({
    title: "Story Ship - Transform Every Thought Into Compelling Stories",
    description: "Turn your ideas into engaging story themes with AI-powered content generation. Every thought is a story waiting to be told.",
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
    icon: Sparkles,
    title: "AI-Powered Theme Generation",
    description: "Transform any idea into a complete story theme with detailed descriptions, characters, and plot points using advanced AI.",
    highlight: "Generate 30+ posts per theme"
  }, {
    icon: Target,
    title: "Smart Story Organization",
    description: "Automatically categorize and organize your stories by theme, genre, or topic for easy management and discovery.",
    highlight: "Visual theme dashboard"
  }, {
    icon: Zap,
    title: "Instant Content Creation",
    description: "Go from a single thought to a full story collection in seconds. Perfect for content creators, writers, and storytellers.",
    highlight: "30-second generation"
  }, {
    icon: BookOpen,
    title: "Visual Storytelling",
    description: "Each story comes with AI-generated imagery in multiple formats (16:9, 9:16, 3:4, 4:3) optimized for different platforms.",
    highlight: "4 aspect ratios included"
  }, {
    icon: Clock,
    title: "Real-Time Creation",
    description: "Watch your stories come to life in real-time as our AI generates content, images, and organizes everything seamlessly.",
    highlight: "Live generation process"
  }, {
    icon: TrendingUp,
    title: "Content at Scale",
    description: "Create unlimited story themes and posts. Scale your content creation without sacrificing quality or creativity.",
    highlight: "Unlimited generation"
  }];
  const useCases = [{
    title: "Content Creators",
    description: "Generate endless story ideas for social media, blogs, and video content",
    icon: Users
  }, {
    title: "Writers & Authors",
    description: "Overcome writer's block with AI-generated themes and story starters",
    icon: BookOpen
  }, {
    title: "Marketing Teams",
    description: "Create compelling brand stories and campaign narratives",
    icon: Target
  }, {
    title: "Educators",
    description: "Develop engaging stories for teaching and educational content",
    icon: Lightbulb
  }];
  const steps = [{
    step: "1",
    title: "Share Your Thought",
    description: "Type any idea, concept, or thought you want to transform into a story"
  }, {
    step: "2",
    title: "AI Magic Happens",
    description: "Our AI analyzes your input and generates a complete story theme with detailed content"
  }, {
    step: "3",
    title: "Get Your Stories",
    description: "Receive 30+ story posts with images, descriptions, and organized themes ready to use"
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
                  <Sparkles className="w-5 h-5 mr-2" />
                  Story Ship
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent leading-tight">
                  Transform Every Thought Into Compelling Stories
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                  Every thought is a story waiting to be told. Turn your ideas into engaging themes with AI-powered content generation.
                </p>
              </div>

              {/* Interactive Demo */}
              <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-2 border-primary/20 shadow-xl bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5 text-primary" />
                      Try It Now - What's Your Story?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea placeholder="Type any thought... 'A world where dreams become reality' or 'The last bookstore on Earth' or 'AI companions for lonely humans'" value={demoInput} onChange={e => setDemoInput(e.target.value)} className="min-h-[120px] text-lg resize-none" />
                    <Button onClick={handleDemoSubmit} className="w-full text-lg py-6" disabled={!demoInput.trim()}>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate My Story Theme
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
                Powerful Features for Story Creation
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Everything you need to transform thoughts into compelling stories, complete with AI-generated content and visual assets.
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
                How Story Ship Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                From thought to story in three simple steps. Our AI handles the complexity while you focus on creativity.
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
                Perfect for Every Storyteller
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Whether you're creating content, writing books, or building brands, Story Ship adapts to your storytelling needs.
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
                Ready to Transform Your Thoughts into Stories?
              </h2>
              <p className="text-xl opacity-90">
                Join thousands of creators who've discovered the power of AI-assisted storytelling. Start your journey today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" onClick={handleGetStarted} className="text-lg px-8 py-6 text-primary">
                  <Sparkles className="w-5 h-5 mr-2" />
                  {user ? "Open Stories Dashboard" : "Start Creating Free"}
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
                  Unlimited story themes
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  AI-generated visuals
                </div>
              </div>
            </div>
          </div>
        </section>
      </AppLayout>
    </>;
};
export default StoryShip;