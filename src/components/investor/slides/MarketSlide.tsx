import React from 'react';

export const MarketSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-center pl-4 pr-16 py-8 text-center">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        4/8
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Globally Untapped Market
      </h1>
      <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-4xl leading-relaxed">
        We're not entering an existing market—we're creating one.
      </p>
    </div>
  );
};