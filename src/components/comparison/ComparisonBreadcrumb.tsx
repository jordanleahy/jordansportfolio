
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, Scale } from 'lucide-react';

interface ComparisonBreadcrumbProps {
  comparisonTitle?: string;
}

export const ComparisonBreadcrumb: React.FC<ComparisonBreadcrumbProps> = ({ 
  comparisonTitle 
}) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link 
        to="/" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4 mr-1" />
        Home
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link 
        to="/comparisons" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Scale className="h-4 w-4 mr-1" />
        Comparisons
      </Link>
      {comparisonTitle && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{comparisonTitle}</span>
        </>
      )}
    </nav>
  );
};
