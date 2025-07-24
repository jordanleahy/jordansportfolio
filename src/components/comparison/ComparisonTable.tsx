
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ComparisonData } from '@/types/comparison';

interface ComparisonTableProps {
  data: ComparisonData;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
  const { company1, company2 } = data;

  // Add fallbacks for missing data
  const safeCompany1 = {
    name: company1?.name || 'Company 1',
    founded: company1?.founded || 'N/A',
    headquarters: company1?.headquarters || 'N/A',
    companyType: company1?.companyType || 'N/A',
    funding: company1?.funding || 'N/A',
    investors: company1?.investors || 'N/A',
    employeeSize: company1?.employeeSize || 'N/A',
    deliveryModel: company1?.deliveryModel || 'N/A',
    targetCustomers: company1?.targetCustomers || 'N/A',
    primarySolutions: company1?.primarySolutions || 'N/A',
    aiCore: company1?.aiCore || 'N/A',
    ehrIntegration: company1?.ehrIntegration || 'N/A',
    clientBase: company1?.clientBase || 'N/A',
    certifications: company1?.certifications || 'N/A',
    awards: company1?.awards || 'N/A',
    keyBenefits: company1?.keyBenefits || [],
    uniqueStrengths: company1?.uniqueStrengths || []
  };

  const safeCompany2 = {
    name: company2?.name || 'Company 2',
    founded: company2?.founded || 'N/A',
    headquarters: company2?.headquarters || 'N/A',
    companyType: company2?.companyType || 'N/A',
    funding: company2?.funding || 'N/A',
    investors: company2?.investors || 'N/A',
    employeeSize: company2?.employeeSize || 'N/A',
    deliveryModel: company2?.deliveryModel || 'N/A',
    targetCustomers: company2?.targetCustomers || 'N/A',
    primarySolutions: company2?.primarySolutions || 'N/A',
    aiCore: company2?.aiCore || 'N/A',
    ehrIntegration: company2?.ehrIntegration || 'N/A',
    clientBase: company2?.clientBase || 'N/A',
    certifications: company2?.certifications || 'N/A',
    awards: company2?.awards || 'N/A',
    keyBenefits: company2?.keyBenefits || [],
    uniqueStrengths: company2?.uniqueStrengths || []
  };

  const comparisonRows = [
    { label: 'Founded', value1: safeCompany1.founded, value2: safeCompany2.founded },
    { label: 'Headquarters', value1: safeCompany1.headquarters, value2: safeCompany2.headquarters },
    { label: 'Company Type', value1: safeCompany1.companyType, value2: safeCompany2.companyType },
    { label: 'Funding', value1: safeCompany1.funding, value2: safeCompany2.funding },
    { label: 'Investors', value1: safeCompany1.investors, value2: safeCompany2.investors },
    { label: 'Employee Size', value1: safeCompany1.employeeSize, value2: safeCompany2.employeeSize },
    { label: 'Delivery Model', value1: safeCompany1.deliveryModel, value2: safeCompany2.deliveryModel },
    { label: 'Target Customers', value1: safeCompany1.targetCustomers, value2: safeCompany2.targetCustomers },
    { label: 'Primary Solutions', value1: safeCompany1.primarySolutions, value2: safeCompany2.primarySolutions },
    { label: 'AI Core', value1: safeCompany1.aiCore, value2: safeCompany2.aiCore },
    { label: 'EHR Integration', value1: safeCompany1.ehrIntegration, value2: safeCompany2.ehrIntegration },
    { label: 'Client Base', value1: safeCompany1.clientBase, value2: safeCompany2.clientBase },
    { label: 'Certifications', value1: safeCompany1.certifications, value2: safeCompany2.certifications },
    { label: 'Awards & Recognition', value1: safeCompany1.awards, value2: safeCompany2.awards },
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
              <TableHead className="w-1/2 md:w-1/3 font-semibold text-center px-4">{safeCompany1.name}</TableHead>
              <TableHead className="w-1/2 md:w-1/3 font-semibold text-center px-4">{safeCompany2.name}</TableHead>
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
                  {safeCompany1.keyBenefits.map((benefit, idx) => (
                    <li key={idx} className="text-xs">• {benefit}</li>
                  ))}
                  {safeCompany1.keyBenefits.length === 0 && (
                    <li className="text-xs text-muted-foreground">No data available</li>
                  )}
                </ul>
              </TableCell>
              <TableCell className="w-1/2 md:w-1/3 text-center px-4">
                <ul className="space-y-1 text-left">
                  {safeCompany2.keyBenefits.map((benefit, idx) => (
                    <li key={idx} className="text-xs">• {benefit}</li>
                  ))}
                  {safeCompany2.keyBenefits.length === 0 && (
                    <li className="text-xs text-muted-foreground">No data available</li>
                  )}
                </ul>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium border-r hidden md:table-cell">
                Unique Strengths
              </TableCell>
              <TableCell className="w-1/2 md:w-1/3 text-center px-4">
                <ul className="space-y-1 text-left">
                  {safeCompany1.uniqueStrengths.map((strength, idx) => (
                    <li key={idx} className="text-xs">• {strength}</li>
                  ))}
                  {safeCompany1.uniqueStrengths.length === 0 && (
                    <li className="text-xs text-muted-foreground">No data available</li>
                  )}
                </ul>
              </TableCell>
              <TableCell className="w-1/2 md:w-1/3 text-center px-4">
                <ul className="space-y-1 text-left">
                  {safeCompany2.uniqueStrengths.map((strength, idx) => (
                    <li key={idx} className="text-xs">• {strength}</li>
                  ))}
                  {safeCompany2.uniqueStrengths.length === 0 && (
                    <li className="text-xs text-muted-foreground">No data available</li>
                  )}
                </ul>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
