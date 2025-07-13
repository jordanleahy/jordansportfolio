import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface FilterTestResultsProps {
  filters: any;
  resultsCount: number;
}

export const FilterTestResults: React.FC<FilterTestResultsProps> = ({ 
  filters, 
  resultsCount 
}) => {
  const getFilterStatus = () => {
    const tests = [];
    
    // Test industry filters
    if (filters.industries && filters.industries.length > 0) {
      tests.push({
        name: "Industry Filter",
        status: "active",
        detail: `${filters.industries.length} industries selected`
      });
    }
    
    // Test amount range filters
    if (filters.amountRange && (filters.amountRange[0] > 0 || filters.amountRange[1] < 100000000)) {
      tests.push({
        name: "Amount Range Filter", 
        status: "active",
        detail: `$${filters.amountRange[0].toLocaleString()} - $${filters.amountRange[1].toLocaleString()}`
      });
    }
    
    // Test search query
    if (filters.searchQuery && filters.searchQuery.length > 0) {
      tests.push({
        name: "Search Filter",
        status: "active", 
        detail: `"${filters.searchQuery}"`
      });
    }
    
    // Results validation
    tests.push({
      name: "Results Count",
      status: resultsCount > 0 ? "pass" : "warning",
      detail: `${resultsCount} results found`
    });
    
    return tests;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "active":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const tests = getFilterStatus();

  if (tests.length === 1 && tests[0].name === "Results Count") {
    return null; // Don't show if no filters are active
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Filter Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(test.status)}
                <span className="text-sm font-medium">{test.name}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {test.detail}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};