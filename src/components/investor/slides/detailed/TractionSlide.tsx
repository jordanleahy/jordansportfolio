import React from 'react';

export const TractionSlide: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-center pl-4 pr-16 py-8 text-center">
      <div className="absolute top-8 left-8 text-sm text-muted-foreground font-medium">
        8/14
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Traction & Milestones
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        Our story so far:
      </h2>
      <div className="space-y-4 max-w-4xl text-left">
        <div className="flex items-start space-x-4">
          <span className="text-muted-foreground font-medium text-lg min-w-[120px]">2024 Q3:</span>
          <p className="text-lg text-muted-foreground">Concept validation with focus groups</p>
        </div>
        <div className="flex items-start space-x-4">
          <span className="text-muted-foreground font-medium text-lg min-w-[120px]">2024 Q4:</span>
          <p className="text-lg text-muted-foreground">AI engine prototype developed</p>
        </div>
        <div className="flex items-start space-x-4">
          <span className="text-muted-foreground font-medium text-lg min-w-[120px]">2025 Q1:</span>
          <p className="text-lg text-muted-foreground">Closed beta with <span className="text-primary font-semibold">1,500 users (97% retention rate)</span></p>
        </div>
        <div className="flex items-start space-x-4">
          <span className="text-muted-foreground font-medium text-lg min-w-[120px]">2025 Q2:</span>
          <p className="text-lg text-muted-foreground">Strategic partnership with leading AI research institute</p>
        </div>
        <div className="flex items-start space-x-4">
          <span className="text-muted-foreground font-medium text-lg min-w-[120px]">2025 Q3:</span>
          <p className="text-lg text-muted-foreground">Public beta launch with <span className="text-primary font-semibold">15,000 active users</span></p>
        </div>
        <div className="flex items-start space-x-4">
          <span className="text-primary font-bold text-lg min-w-[120px]">NOW:</span>
          <p className="text-lg text-foreground font-medium">34% month-over-month growth with zero marketing spend</p>
        </div>
      </div>
    </div>
  );
};