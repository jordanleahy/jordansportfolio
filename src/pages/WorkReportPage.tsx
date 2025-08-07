import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';

const WorkReportPage: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Daily Work Summary</h1>
        <p className="text-muted-foreground">
          This is where the Daily Work Summary will be displayed.
        </p>
      </div>
    </PageLayout>
  );
};

export default WorkReportPage;