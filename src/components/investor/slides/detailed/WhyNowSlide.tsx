import React from 'react';

export const WhyNowSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-start pl-4 pr-16 py-8 text-left">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        13/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Why Now? Why Us?
      </h1>
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl">
        <div className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            The perfect convergence:
          </h2>
          <div className="space-y-3 text-left">
            <p className="text-lg text-muted-foreground">
              • AI capabilities have reached the critical threshold for thought interpretation
            </p>
            <p className="text-lg text-muted-foreground">
              • Global shift toward visual communication and immersive experiences
            </p>
            <p className="text-lg text-muted-foreground">
              • Increasing demand for personalized content creation tools
            </p>
            <p className="text-lg text-muted-foreground">
              • Growing creator economy seeking new mediums
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-primary">
            Our unique position:
          </h2>
          <div className="space-y-3 text-left">
            <p className="text-lg text-foreground">
              • First-mover in the thought-to-narrative space
            </p>
            <p className="text-lg text-foreground">
              • Proprietary AI technology with multiple patent applications
            </p>
            <p className="text-lg text-foreground">
              • Proven user engagement metrics exceeding industry standards
            </p>
            <p className="text-lg text-foreground">
              • Team combining expertise in AI, storytelling, and product development
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};