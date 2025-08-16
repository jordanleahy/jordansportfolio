
import React from 'react';

export const MarketOpportunitySlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-start pl-12 pr-16 py-12 text-left">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        6/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Market Opportunity
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        What is the value of unlocked human imagination?
      </h2>
      <p className="text-xl md:text-2xl font-semibold text-primary mt-8">
        We're not just entering an existing market—we're defining a new one.
      </p>
    </div>
  );
};
