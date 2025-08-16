import React from 'react';

export const UnderstandingSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-center pl-4 pr-16 py-8 text-center">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        3/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Our Journey of Understanding
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        What we discovered along the way:
      </h2>
      <div className="space-y-4 max-w-4xl text-left">
        <div className="flex items-start space-x-3">
          <span className="text-primary font-bold text-xl">•</span>
          <p className="text-lg md:text-xl text-muted-foreground">
            People want to share their thoughts but struggle with traditional mediums
          </p>
        </div>
        <div className="flex items-start space-x-3">
          <span className="text-primary font-bold text-xl">•</span>
          <p className="text-lg md:text-xl text-muted-foreground">
            AI has reached a critical point where it can interpret human thought patterns
          </p>
        </div>
        <div className="flex items-start space-x-3">
          <span className="text-primary font-bold text-xl">•</span>
          <p className="text-lg md:text-xl text-muted-foreground">
            The line between consumers and creators is blurring
          </p>
        </div>
        <div className="flex items-start space-x-3">
          <span className="text-primary font-bold text-xl">•</span>
          <p className="text-lg md:text-xl text-muted-foreground">
            Human consumption of information is fundamentally changing
          </p>
        </div>
      </div>
      <p className="text-xl md:text-2xl text-muted-foreground mt-8 max-w-3xl">
        Our research revealed a significant opportunity at the intersection of thought, storytelling, and technology.
      </p>
    </div>
  );
};