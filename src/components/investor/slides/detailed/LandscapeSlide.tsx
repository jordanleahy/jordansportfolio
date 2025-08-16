import React from 'react';

export const LandscapeSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-center pl-4 pr-16 py-8 text-center">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        5/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        The Shifting Landscape
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        Human consumption of information is changing:
      </h2>
      <div className="max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold text-foreground border-b border-border pb-2">
              Traditional Media
            </h3>
            <div className="space-y-2 text-left">
              <p className="text-lg text-muted-foreground">Passive consumption</p>
              <p className="text-lg text-muted-foreground">Format constraints</p>
              <p className="text-lg text-muted-foreground">Creator-consumer divide</p>
              <p className="text-lg text-muted-foreground">Limited by technical skills</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold text-primary border-b border-primary pb-2">
              Story Ship Experience
            </h3>
            <div className="space-y-2 text-left">
              <p className="text-lg text-foreground font-medium">Active co-creation</p>
              <p className="text-lg text-foreground font-medium">Fluid, adaptive narratives</p>
              <p className="text-lg text-foreground font-medium">Everyone becomes a storyteller</p>
              <p className="text-lg text-foreground font-medium">Powered by thought alone</p>
            </div>
          </div>
        </div>
        <p className="text-xl md:text-2xl text-muted-foreground">
          New markets are emerging at the intersection of thought, visualization, and shared experiences.
        </p>
      </div>
    </div>
  );
};