import React from 'react';

export const FundingSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-center pl-4 pr-16 py-8 text-center">
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        $1.5M to Scale What Already Works
      </h1>
      <div className="space-y-4 max-w-4xl">
        <p className="text-xl md:text-2xl text-muted-foreground">
          Contact:{' '}
          <span className="text-primary font-semibold">
            jordanwilliamleahy@gmail.com
          </span>
        </p>
        <p className="text-xl md:text-2xl text-muted-foreground">
          <span className="text-primary font-semibold">
            www.storyship.com
          </span>
        </p>
        <p className="text-lg md:text-xl text-muted-foreground/80 italic mt-8">
          "The future belongs to those who can visualize it."
        </p>
      </div>
    </div>
  );
};