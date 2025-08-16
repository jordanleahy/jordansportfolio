import React from 'react';

export const JourneyBeginsSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-start pl-12 pr-16 py-12 text-left">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        1/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Our Journey Begins
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-6 text-foreground">
        From Insight to Innovation
      </h2>
      <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl leading-relaxed mb-4">
        What if we could capture our fleeting thoughts and transform them into immersive visual experiences?
      </p>
      <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl leading-relaxed mb-8">
        Story Ship was born from the realization that our most valuable asset—our thoughts—often disappear before they can be shared with the world.
      </p>
      <p className="text-lg md:text-xl text-muted-foreground/80 italic max-w-3xl">
        "We're not just building a product; we're creating a new way to experience human imagination."
      </p>
    </div>
  );
};