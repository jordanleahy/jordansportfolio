import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BarChart, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ComparisonIndexCardProps {
  comparison: {
    id: string;
    slug: string;
    title: string;
    meta_description: string;
    created_at: string;
    updated_at: string;
    companies: Array<{ name: string; company_position: number }>;
    featureCount: number;
    useCaseCount: number;
  };
}

export const ComparisonIndexCard: React.FC<ComparisonIndexCardProps> = ({ comparison }) => {
  const company1 = comparison.companies.find(c => c.company_position === 1);
  const company2 = comparison.companies.find(c => c.company_position === 2);
  
  // Calculate estimated read time (average 200 words per minute, assuming ~1000 words)
  const estimatedReadTime = Math.max(3, Math.ceil((comparison.featureCount * 20 + comparison.useCaseCount * 30) / 200));
  
  return (
    <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-custom-2xl hover:scale-[1.03] border-2 border-accent/10 hover:border-accent/40">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-accent/20 to-accent/10 border-accent/30 hover:shadow-accent-sm transition-shadow">
              <Zap className="h-3 w-3 mr-1" />
              Healthcare AI
            </Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">
              <Clock className="h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(comparison.updated_at), { addSuffix: true })}
            </Badge>
          </div>
        </div>

        {/* Company Names with VS Badge */}
        <div className="mb-6">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
            <div className="text-left p-4 rounded-lg bg-muted/30 group-hover:bg-muted/50 transition-colors duration-300">
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Company 1</div>
              <h3 className="text-lg font-bold text-foreground truncate">
                {company1?.name || 'Company 1'}
              </h3>
            </div>
            
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300" />
                <Badge 
                  variant="outline" 
                  className="relative px-4 py-2 font-bold text-accent border-accent/50 bg-accent/10 shadow-accent-sm group-hover:shadow-accent-md transition-all duration-300"
                >
                  VS
                </Badge>
              </div>
            </div>
            
            <div className="text-right p-4 rounded-lg bg-muted/30 group-hover:bg-muted/50 transition-colors duration-300">
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Company 2</div>
              <h3 className="text-lg font-bold text-foreground truncate">
                {company2?.name || 'Company 2'}
              </h3>
            </div>
          </div>
        </div>

        {/* Comparison Title */}
        <h2 className="text-2xl font-semibold text-foreground mb-3 group-hover:text-accent transition-colors duration-300 leading-tight">
          {comparison.title}
        </h2>

        {/* Description */}
        <p className="text-base text-muted-foreground line-clamp-2 leading-relaxed">
          {comparison.meta_description}
        </p>
      </CardHeader>

      <CardContent className="relative z-10">
        {/* Stats Footer */}
        <div className="flex items-center justify-between mb-6 pb-5 border-b border-border/50">
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors">
              <div className="p-1.5 rounded-md bg-accent/10">
                <BarChart className="h-4 w-4 text-accent" />
              </div>
              <span className="font-medium">{comparison.featureCount} features</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors">
              <div className="p-1.5 rounded-md bg-accent/10">
                <Zap className="h-4 w-4 text-accent" />
              </div>
              <span className="font-medium">{comparison.useCaseCount} use cases</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors">
              <div className="p-1.5 rounded-md bg-accent/10">
                <Clock className="h-4 w-4 text-accent" />
              </div>
              <span className="font-medium">{estimatedReadTime} min</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Button asChild className="w-full group/button bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground shadow-accent-sm hover:shadow-accent-md transition-all duration-300">
          <Link to={`/comparison/${comparison.slug}`}>
            View Full Comparison
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
