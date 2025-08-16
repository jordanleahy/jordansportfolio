import React from 'react';

export const ProblemSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-center pl-4 pr-16 py-8 text-center">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        2/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        The Problem
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        The gap between thought and expression:
      </h2>
      <div className="space-y-4 max-w-4xl text-left">
        <div className="flex items-start space-x-3">
          <span className="text-primary font-bold text-xl">•</span>
          <p className="text-lg md:text-xl text-muted-foreground">
            <span className="font-semibold text-foreground">Ephemeral ideas</span> vanish before they can be captured
          </p>
        </div>
        <div className="flex items-start space-x-3">
          <span className="text-primary font-bold text-xl">•</span>
          <p className="text-lg md:text-xl text-muted-foreground">
            <span className="font-semibold text-foreground">Creative barriers</span> limit self-expression to those with technical skills
          </p>
        </div>
        <div className="flex items-start space-x-3">
          <span className="text-primary font-bold text-xl">•</span>
          <p className="text-lg md:text-xl text-muted-foreground">
            <span className="font-semibold text-foreground">Disconnected experiences</span> across digital platforms fragment our stories
          </p>
        </div>
        <div className="flex items-start space-x-3">
          <span className="text-primary font-bold text-xl">•</span>
          <p className="text-lg md:text-xl text-muted-foreground">
            <span className="font-semibold text-foreground">Limited visualization tools</span> fail to translate abstract thoughts into tangible stories
          </p>
        </div>
      </div>
      <p className="text-xl md:text-2xl font-semibold text-primary mt-8">
        75% of creative ideas are lost because people lack the tools to express them effectively.
      </p>
    </div>
  );
};