
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, Users, Shield, Zap } from 'lucide-react';

const Comparison = () => {
  const availableComparisons = [
    {
      id: 'smarterdxvsiodine',
      title: 'SmarterDx vs Iodine Software',
      description: 'A comprehensive comparison of two leading clinical AI platforms for healthcare documentation and revenue cycle management.',
      categories: ['Clinical AI', 'CDI', 'Revenue Cycle'],
      companies: ['SmarterDx', 'Iodine Software'],
      highlights: [
        'AI-powered clinical documentation',
        'Revenue optimization strategies',
        'EHR integration capabilities',
        'Pricing model comparison'
      ],
      isNew: true
    }
  ];

  const comparisonCategories = [
    {
      icon: TrendingUp,
      title: 'Revenue Cycle Management',
      description: 'Compare platforms that optimize healthcare revenue cycles',
      count: 1
    },
    {
      icon: Users,
      title: 'Clinical Documentation',
      description: 'Analyze CDI and clinical documentation improvement tools',
      count: 1
    },
    {
      icon: Shield,
      title: 'Compliance & Security',
      description: 'Evaluate security features and compliance capabilities',
      count: 1
    },
    {
      icon: Zap,
      title: 'AI & Automation',
      description: 'Compare AI-powered healthcare automation solutions',
      count: 1
    }
  ];

  return (
    <>
      <Helmet>
        <title>Healthcare Platform Comparisons | Ascertain</title>
        <meta name="description" content="Compare leading healthcare technology platforms with detailed analysis of features, pricing, and capabilities." />
        <meta property="og:title" content="Healthcare Platform Comparisons | Ascertain" />
        <meta property="og:description" content="Compare leading healthcare technology platforms with detailed analysis of features, pricing, and capabilities." />
        <meta property="og:type" content="website" />
      </Helmet>

      <AppLayout>
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Healthcare Platform Comparisons
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Make informed decisions with our comprehensive side-by-side comparisons of leading healthcare technology platforms.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="secondary">Expert Analysis</Badge>
                <Badge variant="secondary">Detailed Features</Badge>
                <Badge variant="secondary">Pricing Insights</Badge>
                <Badge variant="secondary">User Reviews</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Available Comparisons */}
            <section className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-foreground">Available Comparisons</h2>
                <Badge variant="outline">{availableComparisons.length} comparison{availableComparisons.length !== 1 ? 's' : ''}</Badge>
              </div>

              <div className="grid gap-6">
                {availableComparisons.map((comparison) => (
                  <Card key={comparison.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                            {comparison.title}
                            {comparison.isNew && <Badge variant="default">New</Badge>}
                          </CardTitle>
                          <p className="text-muted-foreground mb-4">{comparison.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {comparison.categories.map((category) => (
                          <Badge key={category} variant="secondary">{category}</Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Companies Compared:</h4>
                          <div className="flex flex-wrap gap-2">
                            {comparison.companies.map((company) => (
                              <Badge key={company} variant="outline">{company}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Key Highlights:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {comparison.highlights.map((highlight, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-4">
                          <Link to={`/comparison/${comparison.id}`}>
                            <Button className="w-full sm:w-auto">
                              View Comparison
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Comparison Categories */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-8">Browse by Category</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {comparisonCategories.map((category) => (
                  <Card key={category.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <category.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">{category.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                      <Badge variant="outline">{category.count} comparison{category.count !== 1 ? 's' : ''}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Call to Action */}
            <section className="text-center">
              <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                <CardContent className="p-8">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Can't Find What You're Looking For?
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    We're constantly adding new comparisons. If you'd like to see a specific platform comparison, 
                    let us know and we'll prioritize it.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg">
                      Request a Comparison
                    </Button>
                    <Button variant="outline" size="lg">
                      Contact Us
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default Comparison;
