
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, FileText, Users, BarChart3 } from 'lucide-react';

const ProjectCardsSection = () => {
  const projects = [
    {
      id: 1,
      title: "Platform Comparisons",
      description: "Comprehensive side-by-side comparisons of leading healthcare technology platforms with detailed analysis of features, pricing, and capabilities.",
      icon: BarChart3,
      badge: "New",
      badgeVariant: "default" as const,
      link: "/comparison",
      highlights: ["Expert Analysis", "Detailed Features", "Pricing Insights"]
    },
    {
      id: 2,
      title: "Revenue Cycle Analytics",
      description: "Advanced analytics and insights for healthcare revenue cycle management, featuring AI-powered documentation and optimization tools.",
      icon: TrendingUp,
      badge: "Analytics",
      badgeVariant: "secondary" as const,
      link: "/rcmcompanies",
      highlights: ["AI-Powered", "Real-time Data", "ROI Tracking"]
    },
    {
      id: 3,
      title: "Clinical Documentation",
      description: "Comprehensive resources and tools for clinical documentation improvement, featuring CDI best practices and automated solutions.",
      icon: FileText,
      badge: "Documentation",
      badgeVariant: "outline" as const,
      link: "/blog",
      highlights: ["Best Practices", "Automation", "Compliance"]
    },
    {
      id: 4,
      title: "Healthcare Insights",
      description: "In-depth analysis and insights into healthcare technology trends, market dynamics, and industry developments.",
      icon: Users,
      badge: "Insights",
      badgeVariant: "secondary" as const,
      link: "/blog",
      highlights: ["Market Analysis", "Industry Trends", "Expert Opinions"]
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Explore Our Resources
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover comprehensive tools and insights to help you make informed decisions about healthcare technology platforms.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <project.icon className="h-8 w-8 text-primary" />
                  <Badge variant={project.badgeVariant}>{project.badge}</Badge>
                </div>
                <CardTitle className="text-xl">{project.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  {project.description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {project.highlights.map((highlight, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                  
                  <Link to={project.link} className="block">
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      Explore
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectCardsSection;
