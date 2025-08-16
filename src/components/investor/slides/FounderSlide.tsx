import React from 'react';

export const FounderSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-center px-4 py-8 text-center">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        7/8
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Built by Jordan Leahy
      </h1>
      <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-4xl leading-relaxed">
        Former BCG Digital Ventures product leader who built Story Ship from the ground up.
      </p>
    </div>
  );
};