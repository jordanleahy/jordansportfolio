import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, CheckCircle } from "lucide-react";

interface SortingQAStatusProps {
  sortField: string;
  sortDirection: 'asc' | 'desc';
  totalResults: number;
}

export const SortingQAStatus: React.FC<SortingQAStatusProps> = ({ 
  sortField, 
  sortDirection, 
  totalResults 
}) => {
  const getSortFieldName = (field: string) => {
    switch (field) {
      case 'companyName':
        return 'Company Name';
      case 'amountRaised':
        return 'Amount Raised';
      case 'dateOfFirstSale':
        return 'Date of First Sale';
      case 'industry':
        return 'Industry';
      case 'sale_date':
        return 'Sale Date';
      default:
        return field;
    }
  };

  const getSortIcon = () => {
    return sortDirection === "asc" ? 
      <ArrowUp className="h-4 w-4 text-blue-500" /> : 
      <ArrowDown className="h-4 w-4 text-blue-500" />;
  };

  const sortableFields = [
    { key: 'companyName', name: 'Company Name', status: 'client-side' },
    { key: 'amountRaised', name: 'Amount Raised', status: 'server-side' },
    { key: 'dateOfFirstSale', name: 'Date of First Sale', status: 'server-side' },
    { key: 'industry', name: 'Industry', status: 'server-side' }
  ];

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          Table Sorting Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Sort:</span>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="flex items-center gap-1">
                {getSortFieldName(sortField)}
                {getSortIcon()}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {sortableFields.map((field) => (
              <div key={field.key} className="flex items-center justify-between text-xs">
                <span className={field.key === sortField ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                  {field.name}
                </span>
                <Badge 
                  variant={field.status === 'server-side' ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {field.status}
                </Badge>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            {totalResults} results sorted by {getSortFieldName(sortField)} ({sortDirection}ending)
          </div>
        </div>
      </CardContent>
    </Card>
  );
};