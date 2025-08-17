import React from 'react';
export const PricingSlide: React.FC = () => {
  return <div className="h-full flex flex-col justify-center items-center pl-4 pr-16 py-8 text-center">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        5/8
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">Markup on Digital Thought</h1>
      <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-4xl leading-relaxed">
        Our freemium model to paid is ready. You can sign up today.
      </p>
    </div>;
};