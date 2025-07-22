
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Building, Scale, TrendingUp } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { comparisonDataMap } from '@/data/comparisonData';

const Comparison = () => {
  const comparisons = Object.entries(comparisonDataMap).map(([key, data]) => ({
    id: key,
    ...data
  }));

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Scale className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Company Comparisons
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            In-depth analysis and head-to-head comparisons of leading healthcare technology companies.
            Make informed decisions with comprehensive feature breakdowns and insights.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {comparisons.map((comparison) => (
            <Card key={comparison.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Building className="h-6 w-6 text-primary" />
                  <Badge variant="secondary">Healthcare AI</Badge>
                </div>
                <CardTitle className="text-lg font-semibold line-clamp-2">
                  {comparison.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {comparison.metaDescription}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comparison.company1.name}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="text-sm font-medium">{comparison.company2.name}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{comparison.features.length} features compared</span>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/comparison/${comparison.id}`}>
                      View Comparison
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {comparisons.length}
              </div>
              <p className="text-muted-foreground">Active Comparisons</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {comparisons.reduce((acc, comp) => acc + comp.features.length, 0)}
              </div>
              <p className="text-muted-foreground">Features Analyzed</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {comparisons.reduce((acc, comp) => acc + comp.useCases.length, 0)}
              </div>
              <p className="text-muted-foreground">Use Cases Covered</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Need a Custom Comparison?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Don't see the companies you're interested in? We can create custom comparisons 
              tailored to your specific needs and requirements.
            </p>
            <Button size="lg">
              Request Custom Comparison
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Comparison;
