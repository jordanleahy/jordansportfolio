import React from 'react';
import { QAVisionChecker } from '@/components/qa/QAVisionChecker';

export default function QAVision() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">QA Vision Analysis</h1>
          <p className="text-muted-foreground">
            Upload images to automatically detect quality issues like missing text, layout problems, and content errors.
          </p>
        </div>
        
        <QAVisionChecker />
      </div>
    </div>
  );
}