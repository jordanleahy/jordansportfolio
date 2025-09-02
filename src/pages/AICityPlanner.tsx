import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';

const AICityPlanner: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg border p-6">
            <h1 className="text-3xl font-bold tracking-tight mb-4">AI City Planner</h1>
            <p className="text-muted-foreground">
              Welcome to the AI City Planner. This page is ready for development.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AICityPlanner;