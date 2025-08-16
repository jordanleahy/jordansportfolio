import React from 'react';
export const RoadmapSlide: React.FC = () => {
  return <div className="h-full flex flex-col justify-center items-start pl-12 pr-16 py-12 text-left">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        11/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Our Roadmap: Expanding the Journey
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        Where we're sailing next:
      </h2>
      <div className="space-y-8 max-w-5xl">
        <div className="text-left space-y-4">
          <h3 className="text-xl md:text-2xl font-bold text-primary">Next 6 months:</h3>
          <div className="space-y-2 ml-4">
            <p className="text-lg text-muted-foreground">• Focused on revenue generation.</p>
            <p className="text-lg text-muted-foreground">• Building agents to create and distribute content </p>
            <p className="text-lg text-muted-foreground">• Targeting SME sales & marketing leaaders</p>
          </div>
        </div>
        
        <div className="text-left space-y-4">
          <h3 className="text-xl md:text-2xl font-bold text-primary">Long-term vision:</h3>
          <div className="space-y-2 ml-4">
            <p className="text-lg text-muted-foreground">• Thought-driven metaverse experiences</p>
            <p className="text-lg text-muted-foreground">• Neural interface integration</p>
            <p className="text-lg text-muted-foreground">• Defining the new standard for human-AI co-creation</p>
          </div>
        </div>
      </div>
    </div>;
};