import React from 'react';
export const PricingSlide: React.FC = () => {
  return <div className="h-full flex flex-col justify-center items-center pl-4 pr-16 py-8 text-center">
      <div className="absolute top-8 left-8 text-body-sm text-muted-foreground font-medium">
        5/8
      </div>
      <h1 className="text-display-lg md:text-display-xl lg:text-display-2xl font-bold mb-8 text-primary">Markup on Digital Thought</h1>
      <p className="text-body-lg md:text-heading-md lg:text-heading-lg text-muted-foreground max-w-4xl">
        Our freemium model to paid is ready. You can sign up today.
      </p>
    </div>;
};