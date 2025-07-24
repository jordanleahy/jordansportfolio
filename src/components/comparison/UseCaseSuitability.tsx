
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ComparisonData } from '@/types/comparison';

interface UseCaseSuitabilityProps {
  data: ComparisonData;
}

export const UseCaseSuitability: React.FC<UseCaseSuitabilityProps> = ({ data }) => {
  const getBadgeVariant = (bestFit: string, companyName: string) => {
    if (bestFit === 'Both') return 'secondary';
    if (bestFit === companyName) return 'default';
    return 'outline';
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          📌 Use Case Suitability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/3 font-semibold">Use Case</TableHead>
                <TableHead className="w-1/3 font-semibold text-center">Best Fit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.useCases.map((useCase, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{useCase.useCase}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={
                        useCase.bestFit === 'Both' ? 'secondary' :
                        useCase.bestFit === data.company1.name ? 'default' : 'outline'
                      }
                    >
                      {useCase.bestFit}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
