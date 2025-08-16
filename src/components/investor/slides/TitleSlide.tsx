import React from 'react';

export const TitleSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-center pl-4 pr-16 py-8 text-center">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        1/8
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        What If Thoughts Could Become Reality?
      </h1>
      <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl leading-relaxed">
        The human mind generates over 25,000 thoughts per day.
      </p>
      <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl leading-relaxed mt-2">
        99.9% are lost forever.
      </p>
    </div>
  );
};