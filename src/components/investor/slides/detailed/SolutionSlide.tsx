import React from 'react';
export const SolutionSlide: React.FC = () => {
  return <div className="h-full flex flex-col justify-center items-start pl-12 pr-16 py-12 text-left">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        4/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Our Solution
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        Transforming thoughts into virtual journeys
      </h2>
      <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl leading-relaxed mb-8">Story Ship allows any person in the world, at any time, to translate their in the moment thoughts into a virtual illustrative story.</p>
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <div className="space-y-2">
          <h3 className="text-lg md:text-xl font-semibold text-primary">Instant Capture</h3>
          <p className="text-base md:text-lg text-muted-foreground">Seamlessly record thoughts as they occur</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg md:text-xl font-semibold text-primary">AI Translation</h3>
          <p className="text-base md:text-lg text-muted-foreground">Convert abstract ideas into visual narratives</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg md:text-xl font-semibold text-primary">Immersive Visualization</h3>
          <p className="text-base md:text-lg text-muted-foreground">Experience thoughts as interactive journeys</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg md:text-xl font-semibold text-primary">Universal Access</h3>
          <p className="text-base md:text-lg text-muted-foreground">No artistic or technical skills required</p>
        </div>
      </div>
    </div>;
};