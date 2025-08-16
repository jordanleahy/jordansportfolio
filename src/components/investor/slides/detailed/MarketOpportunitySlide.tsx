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
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl text-left">
        <div className="space-y-3">
          <p className="text-base md:text-lg text-muted-foreground">
            • The average person has <span className="text-primary font-semibold">6,200 thoughts per day</span> - a vast untapped creative resource
          </p>
          <p className="text-base md:text-lg text-muted-foreground">
            • Only <span className="text-primary font-semibold">0.1% of human imagination</span> currently reaches tangible expression
          </p>
          <p className="text-base md:text-lg text-muted-foreground">
            • Democratizing creation could unlock <span className="text-primary font-semibold">$175B in creative economic value</span> by 2030
          </p>
          <p className="text-base md:text-lg text-muted-foreground">
            • Global digital storytelling market: <span className="text-primary font-semibold">$32.5B by 2028</span>
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-base md:text-lg text-muted-foreground">
            • AI-generated content sector growing at <span className="text-primary font-semibold">37% annually</span>
          </p>
          <p className="text-base md:text-lg text-muted-foreground">
            • <span className="text-primary font-semibold">4.8B smartphone users</span> seeking new forms of expression
          </p>
          <p className="text-base md:text-lg text-muted-foreground">
            • Convergence of social media, AR/VR, and AI creating new market categories
          </p>
        </div>
      </div>
      <p className="text-xl md:text-2xl font-semibold text-primary mt-8">
        We're not just entering an existing market—we're defining a new one.
      </p>
    </div>
  );
};