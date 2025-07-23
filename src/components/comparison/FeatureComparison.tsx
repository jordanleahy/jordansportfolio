
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle } from 'lucide-react';
import { FeatureComparison as FeatureComparisonType, ComparisonData } from '@/data/comparisonData';

interface FeatureComparisonProps {
  data: ComparisonData;
}

export const FeatureComparison: React.FC<FeatureComparisonProps> = ({ data }) => {
  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          📊 Visual Feature Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/5 font-semibold">Feature</TableHead>
                <TableHead className="w-3/10 font-semibold text-center">{data.company1.name}</TableHead>
                <TableHead className="w-3/10 font-semibold text-center">{data.company2.name}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.features.map((feature, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{feature.feature}</TableCell>
                  <TableCell className="text-center">
                    {renderFeatureValue(feature.company1)}
                  </TableCell>
                  <TableCell className="text-center">
                    {renderFeatureValue(feature.company2)}
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
