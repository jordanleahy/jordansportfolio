
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ComparisonData } from '@/data/comparisonData';

interface ComparisonTableProps {
  data: ComparisonData;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
  const { company1, company2 } = data;

  const comparisonRows = [
    { label: 'Founded', value1: company1.founded, value2: company2.founded },
    { label: 'Headquarters', value1: company1.headquarters, value2: company2.headquarters },
    { label: 'Company Type', value1: company1.companyType, value2: company2.companyType },
    { label: 'Funding', value1: company1.funding, value2: company2.funding },
    { label: 'Investors', value1: company1.investors, value2: company2.investors },
    { label: 'Employee Size', value1: company1.employeeSize, value2: company2.employeeSize },
    { label: 'Delivery Model', value1: company1.deliveryModel, value2: company2.deliveryModel },
    { label: 'Target Customers', value1: company1.targetCustomers, value2: company2.targetCustomers },
    { label: 'Primary Solutions', value1: company1.primarySolutions, value2: company2.primarySolutions },
    { label: 'AI Core', value1: company1.aiCore, value2: company2.aiCore },
    { label: 'EHR Integration', value1: company1.ehrIntegration, value2: company2.ehrIntegration },
    { label: 'Client Base', value1: company1.clientBase, value2: company2.clientBase },
    { label: 'Certifications', value1: company1.certifications, value2: company2.certifications },
    { label: 'Awards & Recognition', value1: company1.awards, value2: company2.awards },
  ];

  return (
    <Card className="mb-8">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3 font-semibold border-r hidden md:table-cell">
                Category
              </TableHead>
              <TableHead className="w-1/2 md:w-1/3 font-semibold text-center px-4">{company1.name}</TableHead>
              <TableHead className="w-1/2 md:w-1/3 font-semibold text-center px-4">{company2.name}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisonRows.map((row, index) => (
              <TableRow key={index} className="border-b">
                <TableCell className="font-medium border-r hidden md:table-cell">
                  {row.label}
                </TableCell>
                <TableCell className="w-1/2 md:w-1/3 text-center px-4 text-sm">{row.value1}</TableCell>
                <TableCell className="w-1/2 md:w-1/3 text-center px-4 text-sm">{row.value2}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-b">
              <TableCell className="font-medium border-r hidden md:table-cell">
                Key Benefits
              </TableCell>
              <TableCell className="w-1/2 md:w-1/3 text-center px-4">
                <ul className="space-y-1 text-left">
                  {company1.keyBenefits.map((benefit, idx) => (
                    <li key={idx} className="text-xs">• {benefit}</li>
                  ))}
                </ul>
              </TableCell>
              <TableCell className="w-1/2 md:w-1/3 text-center px-4">
                <ul className="space-y-1 text-left">
                  {company2.keyBenefits.map((benefit, idx) => (
                    <li key={idx} className="text-xs">• {benefit}</li>
                  ))}
                </ul>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium border-r hidden md:table-cell">
                Unique Strengths
              </TableCell>
              <TableCell className="w-1/2 md:w-1/3 text-center px-4">
                <ul className="space-y-1 text-left">
                  {company1.uniqueStrengths.map((strength, idx) => (
                    <li key={idx} className="text-xs">• {strength}</li>
                  ))}
                </ul>
              </TableCell>
              <TableCell className="w-1/2 md:w-1/3 text-center px-4">
                <ul className="space-y-1 text-left">
                  {company2.uniqueStrengths.map((strength, idx) => (
                    <li key={idx} className="text-xs">• {strength}</li>
                  ))}
                </ul>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
