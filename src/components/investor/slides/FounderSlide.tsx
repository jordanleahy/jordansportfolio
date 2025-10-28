import React from 'react';

export const FounderSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-center pl-4 pr-16 py-8 text-center">
      <h1 className="text-display-lg md:text-display-xl lg:text-display-2xl font-bold mb-8 text-primary">
        Built by Jordan Leahy
      </h1>
      <p className="text-body-lg md:text-heading-md lg:text-heading-lg text-muted-foreground max-w-4xl">
        Former BCG Digital Ventures product leader who built Story Ship from the ground up.
      </p>
    </div>
  );
};