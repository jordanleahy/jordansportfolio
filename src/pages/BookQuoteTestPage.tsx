import React from 'react';
import { BookQuoteTest } from '@/components/test/BookQuoteTest';

export const BookQuoteTestPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Book Quote Research Test</h1>
          <p className="text-muted-foreground">
            End-to-end testing of the book research and quote verification system
          </p>
        </div>
        <BookQuoteTest />
      </div>
    </div>
  );
};