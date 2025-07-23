
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface ComparisonCardProps {
  id: string;
  title: string;
  description: string;
  categories: string[];
  companies: string[];
  highlights: string[];
  isNew?: boolean;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  id,
  title,
  description,
  categories,
  companies,
  highlights,
  isNew = false
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl mb-2 flex items-center gap-2">
              {title}
              {isNew && <Badge variant="default">New</Badge>}
            </CardTitle>
            <p className="text-muted-foreground mb-4">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <Badge key={category} variant="secondary">{category}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Companies Compared:</h4>
            <div className="flex flex-wrap gap-2">
              {companies.map((company) => (
                <Badge key={company} variant="outline">{company}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Key Highlights:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {highlights.map((highlight, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-4">
            <Link to={`/comparison/${id}`}>
              <Button className="w-full sm:w-auto">
                View Comparison
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
