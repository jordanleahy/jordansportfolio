import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitCompare, ArrowRight, Star, TrendingUp, CheckCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { comparisonDataMap } from '@/data/comparisonData';

const ComparisonIndex = () => {
  const availableComparisons = Object.entries(comparisonDataMap).map(([key, data]) => ({
    key,
    ...data,
    category: 'Healthcare AI',
    tags: ['Clinical AI', 'CDI', 'Revenue Cycle'],
    popularity: 'High'
  }));

  return (
    <AppLayout>
      <Helmet>
        <title>Healthcare Platform Comparisons | Jordan Leahy</title>
        <meta name="description" content="In-depth comparisons of leading healthcare AI platforms, clinical documentation improvement tools, and revenue cycle management solutions." />
        <meta property="og:title" content="Healthcare Platform Comparisons" />
        <meta property="og:description" content="Expert analysis and side-by-side comparisons of healthcare technology platforms." />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-background/50">

        {/* Available Comparisons */}
        <div className="container mx-auto px-4 py-16">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Available Comparisons</h2>
            <p className="text-lg text-muted-foreground">
              Detailed feature-by-feature comparisons to help you make informed technology decisions.
            </p>
          </div>

          <div className="grid gap-8 max-w-4xl mx-auto">
            {availableComparisons.map((comparison) => (
              <Card key={comparison.key} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {comparison.category}
                        </Badge>
                        {comparison.popularity === 'High' && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                        {comparison.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {comparison.metaDescription}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Companies Being Compared */}
                    <div className="flex items-center justify-center gap-4 py-4 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <div className="font-semibold text-primary">{comparison.company1.name}</div>
                        <div className="text-sm text-muted-foreground">Founded {comparison.company1.founded}</div>
                      </div>
                      <div className="text-muted-foreground">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-primary">{comparison.company2.name}</div>
                        <div className="text-sm text-muted-foreground">Founded {comparison.company2.founded}</div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {comparison.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="pt-4">
                      <Button asChild className="w-full group">
                        <Link to={`/comparison/${comparison.key}`}>
                          View Full Comparison
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ComparisonIndex;