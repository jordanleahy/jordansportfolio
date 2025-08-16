import React from 'react';

export const ThankYouSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-start pl-4 pr-16 py-8 text-left">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        14/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Thank You
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        Let's transform how humanity experiences thoughts
      </h2>
      <div className="space-y-6 max-w-4xl">
        <p className="text-xl md:text-2xl text-muted-foreground">
          Contact:{' '}
          <span className="text-primary font-semibold">
            jordanwilliamleahy@gmail.com
          </span>
        </p>
        <p className="text-xl md:text-2xl text-muted-foreground">
          Website:{' '}
          <span className="text-primary font-semibold">
            www.storyship.com
          </span>
        </p>
        <p className="text-lg md:text-xl text-muted-foreground/80 italic mt-12">
          "Every thought deserves to become a story. Every story deserves to be shared."
        </p>
      </div>
    </div>
  );
};