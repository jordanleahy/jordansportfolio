import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const WorkReportSkeleton: React.FC = () => {
  return (
    <div className="grid gap-6">
      {[...Array(3)].map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mb-4">
              <Skeleton className="h-3 w-20 mb-2" />
              <div className="flex flex-wrap gap-2">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-20 rounded-full" />
                ))}
              </div>
            </div>

            <div>
              <Skeleton className="h-3 w-24 mb-2" />
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-start">
                    <Skeleton className="h-1.5 w-1.5 rounded-full mt-2 mr-2" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};