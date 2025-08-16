import React from 'react';

export const MissingLinkSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-center pl-4 pr-16 py-8 text-center">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        3/8
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        The Missing Link in Human Expression
      </h1>
      <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl leading-relaxed">
        For centuries, we've had tools to express what we can say, write, or draw.
      </p>
      <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl leading-relaxed mt-2">
        But never what we can simply think.
      </p>
    </div>
  );
};