import React from 'react';

export const BusinessModelSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-start pl-12 pr-16 py-12 text-left">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        7/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Business Model
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        Monetizing thought journeys:
      </h2>
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
        <div className="space-y-6">
          <div className="text-left space-y-2">
            <h3 className="text-lg md:text-xl font-semibold text-primary">Freemium Core</h3>
            <p className="text-base md:text-lg text-muted-foreground">3 Images per day, 30 per month</p>
          </div>
          <div className="text-left space-y-2">
            <h3 className="text-lg md:text-xl font-semibold text-primary">Paid Tiers</h3>
            <p className="text-base md:text-lg text-muted-foreground">$25/month for 100 credits with credit-based usage and 15% markup</p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="text-left space-y-2">
            <h3 className="text-lg md:text-xl font-semibold text-primary">Enterprise Solutions</h3>
            <p className="text-base md:text-lg text-muted-foreground">Custom implementations for education, therapy, and corporate innovation</p>
          </div>
          <div className="text-left space-y-2">
            <h3 className="text-lg md:text-xl font-semibold text-primary">Creator Economy</h3>
            <p className="text-base md:text-lg text-muted-foreground">Marketplace for unique thought templates and story worlds</p>
          </div>
        </div>
      </div>
      <p className="text-xl md:text-2xl font-semibold text-primary mt-8">
        Projected average revenue per user: $8.75/month
      </p>
    </div>
  );
};