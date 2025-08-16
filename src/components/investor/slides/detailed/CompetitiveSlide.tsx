import React from 'react';

export const CompetitiveSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-start pl-4 pr-16 py-8 text-left">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        9/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        The Competitive Landscape
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        How we're charting new territory:
      </h2>
      <div className="max-w-6xl">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="text-center space-y-2">
            <h3 className="text-lg md:text-xl font-semibold text-foreground border-b border-border pb-2">
              Competitor Type
            </h3>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg md:text-xl font-semibold text-foreground border-b border-border pb-2">
              Their Approach
            </h3>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg md:text-xl font-semibold text-primary border-b border-primary pb-2">
              Story Ship Advantage
            </h3>
          </div>
        </div>
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <p className="text-base md:text-lg text-muted-foreground">Social Platforms</p>
            <p className="text-base md:text-lg text-muted-foreground">User-generated content</p>
            <p className="text-base md:text-lg text-primary font-medium">Thought-generated content</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <p className="text-base md:text-lg text-muted-foreground">AI Art Tools</p>
            <p className="text-base md:text-lg text-muted-foreground">Prompt-to-image</p>
            <p className="text-base md:text-lg text-primary font-medium">Thought-to-narrative</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <p className="text-base md:text-lg text-muted-foreground">Digital Storytelling</p>
            <p className="text-base md:text-lg text-muted-foreground">Template-based</p>
            <p className="text-base md:text-lg text-primary font-medium">Uniquely personal</p>
          </div>
        </div>
      </div>
      <p className="text-xl md:text-2xl text-primary font-semibold mt-8">
        Our proprietary thought-to-narrative engine creates a significant technical moat.
      </p>
    </div>
  );
};