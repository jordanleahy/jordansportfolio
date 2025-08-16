import React from 'react';

export const TeamSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-center pl-4 pr-16 py-8 text-center">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        10/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        The Team Behind the Journey
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        Visionaries and builders:
      </h2>
      <div className="space-y-8 max-w-4xl">
        <div className="text-left space-y-2">
          <h3 className="text-xl md:text-2xl font-bold text-primary">Jordan Leahy - Founder/CEO</h3>
          <p className="text-lg text-muted-foreground">
            Former product lead at BCG Digital Ventures, specialized in AI-driven user experiences
          </p>
        </div>
        <div className="text-left space-y-2">
          <h3 className="text-xl md:text-2xl font-bold text-primary">[CTO Name] - Chief Technology Officer</h3>
          <p className="text-lg text-muted-foreground">
            AI researcher with background in natural language processing and visual computing
          </p>
        </div>
        <div className="text-left space-y-2">
          <h3 className="text-xl md:text-2xl font-bold text-primary">[Creative Lead] - Chief Creative Officer</h3>
          <p className="text-lg text-muted-foreground">
            Award-winning storyteller with experience in interactive media
          </p>
        </div>
      </div>
      <p className="text-lg md:text-xl text-muted-foreground mt-8 max-w-3xl">
        Supported by advisors from the fields of neuroscience, digital media, and venture capital.
      </p>
    </div>
  );
};