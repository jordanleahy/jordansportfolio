import React from 'react';
export const FundingAskSlide: React.FC = () => {
  return <div className="h-full flex flex-col justify-center items-start pl-12 pr-16 py-12 text-left">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        12/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Funding Ask
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        Investment to accelerate our journey:
      </h2>
      <div className="space-y-8 max-w-4xl">
        <div className="text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-primary mb-6 text-left">Raising: $1.5 million Seed @ 6MM Pre</h3>
        </div>
        <div className="text-left">
          <h4 className="text-xl md:text-2xl font-semibold text-foreground mb-4">Use of funds:</h4>
          <div className="space-y-3 ml-4">
            <div className="flex justify-between items-center">
              <span className="text-lg text-muted-foreground">2- 3 member team</span>
              <span className="text-lg font-semibold text-primary">60%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg text-muted-foreground">COGS: Technology </span>
              <span className="text-lg font-semibold text-primary">25%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-lg text-muted-foreground">G&A</span>
              <span className="text-lg font-semibold text-primary">15%</span>
            </div>
          </div>
        </div>
        <p className="text-xl md:text-2xl text-primary font-semibold">
          Projecting Series A readiness in 18 months with 10x user growth.
        </p>
      </div>
    </div>;
};