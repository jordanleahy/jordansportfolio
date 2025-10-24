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
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary/30">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Healthcare AI
            </Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(comparison.updated_at), { addSuffix: true })}
            </Badge>
          </div>
        </div>

        {/* Company Names with VS Badge */}
        <div className="mb-4">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <div className="text-left">
              <div className="text-sm text-muted-foreground mb-1">Company 1</div>
              <h3 className="text-lg font-bold text-foreground truncate">
                {company1?.name || 'Company 1'}
              </h3>
            </div>
            
            <div className="flex-shrink-0">
              <Badge 
                variant="outline" 
                className="px-3 py-1 font-bold text-primary border-primary/50 bg-primary/5"
              >
                VS
              </Badge>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Company 2</div>
              <h3 className="text-lg font-bold text-foreground truncate">
                {company2?.name || 'Company 2'}
              </h3>
            </div>
          </div>
        </div>

        {/* Comparison Title */}
        <h2 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {comparison.title}
        </h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {comparison.meta_description}
        </p>
      </CardHeader>

      <CardContent className="relative">
        {/* Stats Footer */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BarChart className="h-4 w-4" />
              <span>{comparison.featureCount} features</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span>{comparison.useCaseCount} use cases</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{estimatedReadTime} min read</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Button asChild className="w-full group/button">
          <Link to={`/comparison/${comparison.slug}`}>
            View Full Comparison
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
