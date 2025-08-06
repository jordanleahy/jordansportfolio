import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionContainer } from '@/components/cover-letter/SectionContainer';
import { HeroParallax } from '@/components/ui/hero-parallax';
import { TypewriterEffect } from '@/components/ui/typewriter-effect';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards';
import { Timeline } from '@/components/ui/timeline';
import NumberTicker from '@/components/ui/number-ticker';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { generateSEOMetadata } from '@/utils/seoHelpers';
import { 
  Lightbulb, 
  Target, 
  Users, 
  Brain, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  BookOpen,
  Award,
  Star
} from 'lucide-react';

const StoryShip = () => {
  const { user } = useAuth();
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
        navigate('/stories', { state: { demoTheme: demoInput } });
      } else {
        navigate('/auth', { state: { returnTo: '/stories', demoTheme: demoInput } });
      }
    }
  };

  // Demo story thumbnails for HeroParallax
  const storyProducts = [
    {
      title: "Marketing Campaign Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=400&fit=crop"
    },
    {
      title: "Educational Adventure",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=400&fit=crop"
    },
    {
      title: "Brand Storytelling",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&h=400&fit=crop"
    },
    {
      title: "Product Launch Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=500&h=400&fit=crop"
    },
    {
      title: "Customer Success Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=500&h=400&fit=crop"
    },
    {
      title: "Training Module Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&h=400&fit=crop"
    },
    {
      title: "Social Media Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=500&h=400&fit=crop"
    },
    {
      title: "Newsletter Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&h=400&fit=crop"
    },
    {
      title: "Event Promotion Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&h=400&fit=crop"
    },
    {
      title: "Company Culture Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&h=400&fit=crop"
    },
    {
      title: "Achievement Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=400&fit=crop"
    },
    {
      title: "Innovation Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&h=400&fit=crop"
    },
    {
      title: "Partnership Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=500&h=400&fit=crop"
    },
    {
      title: "Vision Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=500&h=400&fit=crop"
    },
    {
      title: "Impact Story",
      link: "#",
      thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&h=400&fit=crop"
    }
  ];

  // Typewriter effect words
  const typewriterWords = [
    {
      text: "Transform",
      className: "text-foreground"
    },
    {
      text: "Ideas",
      className: "text-primary"
    },
    {
      text: "Into",
      className: "text-foreground"
    },
    {
      text: "Compelling",
      className: "text-primary"
    },
    {
      text: "Stories",
      className: "text-foreground"
    }
  ];

  // Content data
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Story Generation",
      description: "Advanced AI analyzes your inputs to create compelling, original stories tailored to your specific needs and audience.",
      highlight: "Generate stories 10x faster",
      className: "md:col-span-2"
    },
    {
      icon: Target,
      title: "Multi-Purpose Flexibility",
      description: "Create content for marketing campaigns, educational materials, entertainment, or personal projects.",
      highlight: "Unlimited use cases",
      className: "md:col-span-1"
    },
    {
      icon: Sparkles,
      title: "Customizable Tone & Style",
      description: "Choose from professional, casual, dramatic, humorous, or any custom tone to match your brand voice perfectly.",
      highlight: "Perfect brand alignment",
      className: "md:col-span-1"
    },
    {
      icon: Clock,
      title: "Instant Results",
      description: "Get high-quality stories in seconds, not hours. Perfect for tight deadlines and rapid content creation.",
      highlight: "Generate in seconds",
      className: "md:col-span-1"
    },
    {
      icon: Users,
      title: "Collaborative Features",
      description: "Share, edit, and collaborate on stories with your team. Built-in version control and feedback systems.",
      highlight: "Team collaboration",
      className: "md:col-span-1"
    }
  ];

  const useCases = [
    {
      title: "Content Creators",
      description: "Generate endless story ideas for social media, blogs, and video content",
      icon: Users
    },
    {
      title: "Writers & Authors",
      description: "Overcome writer's block with AI-generated themes and story starters",
      icon: BookOpen
    },
    {
      title: "Marketing Teams",
      description: "Create compelling brand stories and campaign narratives",
      icon: Target
    },
    {
      title: "Educators",
      description: "Develop engaging stories for teaching and educational content",
      icon: Lightbulb
    }
  ];

  // Timeline data for "How It Works"
  const timelineData = [
    {
      title: "Input Your Ideas",
      content: (
        <div>
          <p className="text-muted-foreground text-xs md:text-sm font-normal mb-8">
            Provide your story concept, target audience, tone, and any specific requirements through our intuitive interface.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg p-4 border border-border">
              <h4 className="text-sm font-semibold text-card-foreground mb-2">Story Concept</h4>
              <p className="text-xs text-muted-foreground">Define your main idea and objectives</p>
            </div>
            <div className="bg-card rounded-lg p-4 border border-border">
              <h4 className="text-sm font-semibold text-card-foreground mb-2">Target Audience</h4>
              <p className="text-xs text-muted-foreground">Specify who you're writing for</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "AI Processing", 
      content: (
        <div>
          <p className="text-muted-foreground text-xs md:text-sm font-normal mb-8">
            Our advanced AI analyzes your inputs and generates multiple story variations using sophisticated language models.
          </p>
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 border border-border">
            <div className="flex items-center gap-4 mb-4">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h4 className="text-sm font-semibold text-card-foreground">Neural Processing</h4>
                <p className="text-xs text-muted-foreground">Advanced language understanding</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Refine & Export",
      content: (
        <div>
          <p className="text-muted-foreground text-xs md:text-sm font-normal mb-8">
            Review, edit, and customize your generated stories. Export in multiple formats for immediate use.
          </p>
          <div className="flex gap-4">
            <Badge variant="secondary" className="text-xs">PDF Export</Badge>
            <Badge variant="secondary" className="text-xs">Word Document</Badge>
            <Badge variant="secondary" className="text-xs">HTML</Badge>
            <Badge variant="secondary" className="text-xs">Plain Text</Badge>
          </div>
        </div>
      ),
    },
  ];

  // Testimonials for InfiniteMovingCards
  const testimonials = [
    {
      quote: "Story Ship has revolutionized our content creation process. We've reduced our story development time by 80% while maintaining exceptional quality.",
      name: "Sarah Chen",
      title: "Marketing Director at TechCorp"
    },
    {
      quote: "The AI understands our brand voice perfectly. Every story feels authentic and engaging, making our campaigns more effective than ever.",
      name: "Michael Rodriguez",
      title: "Creative Director at BrandStudio"
    },
    {
      quote: "As an educator, I use Story Ship to create compelling learning materials. My students are more engaged and retention has improved significantly.",
      name: "Dr. Emma Thompson",
      title: "Professor of Digital Media"
    },
    {
      quote: "The collaborative features are game-changing. Our entire team can work on stories seamlessly, from concept to final publication.",
      name: "David Park",
      title: "Content Manager at StartupHub"
    },
    {
      quote: "Story Ship's versatility is incredible. Whether it's marketing copy, training materials, or social content, it delivers every time.",
      name: "Lisa Wang",
      title: "Communications Lead at InnovateCo"
    }
  ];

  return (
    <>
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
      
      <AppLayout showNavigation={true}>
        {/* Hero Section with Parallax */}
        <HeroParallax products={storyProducts}>
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <SectionContainer className="text-center">
              <div className="space-y-8">
                <Badge variant="secondary" className="text-xs px-4 py-2 mb-4">
                  <Sparkles className="w-3 h-3 mr-2" />
                  AI-Powered Story Generation
                </Badge>
                
                <TypewriterEffect words={typewriterWords} className="text-2xl md:text-5xl lg:text-6xl" />
                
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Harness the power of advanced AI to create engaging stories for marketing, education, 
                  entertainment, and more. Generate professional-quality content in seconds, not hours.
                </p>

                {/* Interactive Demo */}
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl">
                    <h3 className="text-lg font-semibold text-card-foreground mb-4">Try it now - Free Demo</h3>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Enter your story idea... (e.g., 'A marketing story about sustainable fashion')"
                        value={demoInput}
                        onChange={(e) => setDemoInput(e.target.value)}
                        className="flex-1 bg-background border-border"
                      />
                      <Button 
                        onClick={handleDemoSubmit}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                        disabled={!demoInput.trim()}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      No signup required • Get results instantly
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      onClick={handleGetStarted}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
                    >
                      Get Started Free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-border hover:bg-accent px-8 py-3"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Examples
                    </Button>
                  </div>
                </div>

                {/* Social Proof with NumberTicker */}
                <div className="pt-12 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-6">Trusted by content creators worldwide</p>
                  <div className="flex justify-center items-center gap-8 opacity-60">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">4.9/5 Rating</span>
                    </div>
                    <div className="text-sm flex items-center gap-1">
                      <NumberTicker value={10000000} className="font-bold" />+ Stories Generated
                    </div>
                    <div className="text-sm flex items-center gap-1">
                      <NumberTicker value={50000} className="font-bold" />+ Users
                    </div>
                  </div>
                </div>
              </div>
            </SectionContainer>
          </div>
        </HeroParallax>

        {/* Features Section with BentoGrid */}
        <section className="py-20 bg-muted/30">
          <SectionContainer>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Powerful Features for Every Story
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create compelling stories that engage your audience and drive results.
              </p>
            </div>
            
            <BentoGrid className="max-w-4xl mx-auto">
              {features.map((feature, index) => (
                <BentoGridItem
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  header={
                    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 flex items-center justify-center">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                  }
                  icon={
                    <Badge variant="secondary" className="text-xs w-fit">
                      {feature.highlight}
                    </Badge>
                  }
                  className={feature.className}
                />
              ))}
            </BentoGrid>
          </SectionContainer>
        </section>

        {/* How It Works Section with Timeline */}
        <Timeline data={timelineData} />

        {/* Use Cases Section */}
        <section className="py-20 bg-background">
          <SectionContainer>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Perfect for Every Storyteller
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Whether you're creating content, writing books, or building brands, Story Ship adapts to your storytelling needs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {useCases.map((useCase, index) => (
                <Card key={index} className="text-center p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border bg-card">
                  <div className="space-y-4">
                    <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                      <useCase.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground">{useCase.title}</h3>
                    <p className="text-sm text-muted-foreground">{useCase.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </SectionContainer>
        </section>

        {/* Social Proof Section with InfiniteMovingCards */}
        <section className="py-20 bg-muted/30">
          <SectionContainer>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Trusted by Industry Leaders
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of content creators, marketers, and educators who trust Story Ship
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  <NumberTicker value={50000} />+
                </div>
                <div className="text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  <NumberTicker value={10000000} />+
                </div>
                <div className="text-muted-foreground">Stories Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">4.9★</div>
                <div className="text-muted-foreground">User Rating</div>
              </div>
            </div>

            <div className="rounded-md flex flex-col antialiased bg-background items-center justify-center relative overflow-hidden">
              <InfiniteMovingCards
                items={testimonials}
                direction="right"
                speed="slow"
              />
            </div>
          </SectionContainer>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground">
          <SectionContainer className="text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Transform Your Ideas into Stories?
              </h2>
              <p className="text-lg md:text-xl opacity-90">
                Join thousands of creators who've discovered the power of AI-assisted storytelling. Start your journey today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={handleGetStarted}
                  className="text-lg px-8 py-3 text-primary"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {user ? "Open Stories Dashboard" : "Start Creating Free"}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-lg px-8 py-3 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  View Examples
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm opacity-75">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Instant access
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Free forever plan
                </div>
              </div>
            </div>
          </SectionContainer>
        </section>
      </AppLayout>
    </>
  );
};

export default StoryShip;