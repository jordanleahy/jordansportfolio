import React from 'react';
export const IntroSlide: React.FC = () => {
  return <div className="h-full flex flex-col justify-center items-center px-4 py-8 text-center">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        2/8
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Introducing Story Ship
      </h1>
      <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-4xl leading-relaxed">Every Thought is a Visual Journey</p>
    </div>;
};