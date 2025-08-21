
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface VendorPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: string | null;
  showNavigation?: boolean;
  className?: string;
}

export const VendorPageLayout: React.FC<VendorPageLayoutProps> = ({
  children,
  title,
  subtitle,
  isLoading,
  error,
  showNavigation = true,
  className = "container mx-auto py-8 px-4"
}) => {
  return (
    <AppLayout showNavigation={showNavigation}>
      <div className={className}>
        {title && (
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading vendors...</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Error Loading Vendors</h2>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          children
        )}
      </div>
    </AppLayout>
  );
};
