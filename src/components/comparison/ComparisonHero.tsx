
import React from 'react';
import { ComparisonData } from '@/types/comparison';

interface ComparisonHeroProps {
  data: ComparisonData;
}

export const ComparisonHero: React.FC<ComparisonHeroProps> = ({ data }) => {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {data.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            {data.metaDescription}
          </p>
        </div>
      </div>
    </div>
  );
};
