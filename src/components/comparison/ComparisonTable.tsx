
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <CardTitle className="text-2xl font-bold text-center">Company Comparison</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="w-1/3 font-bold text-gray-700 py-4 px-6">Category</TableHead>
                <TableHead className="w-1/3 font-bold text-center py-4 px-6 text-primary">
                  {company1.name}
                </TableHead>
                <TableHead className="w-1/3 font-bold text-center py-4 px-6 text-secondary">
                  {company2.name}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row, index) => (
                <TableRow key={index} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-semibold text-gray-700 py-4 px-6 border-r border-gray-100">
                    {row.label}
                  </TableCell>
                  <TableCell className="text-center py-4 px-6 bg-primary/5 border-r border-gray-100">
                    <div className="text-sm font-medium text-gray-800">{row.value1}</div>
                  </TableCell>
                  <TableCell className="text-center py-4 px-6 bg-secondary/5">
                    <div className="text-sm font-medium text-gray-800">{row.value2}</div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-semibold text-gray-700 py-4 px-6 border-r border-gray-100">
                  Key Benefits
                </TableCell>
                <TableCell className="text-center py-4 px-6 bg-primary/5 border-r border-gray-100">
                  <ul className="space-y-2 text-left">
                    {company1.keyBenefits.map((benefit, idx) => (
                      <li key={idx} className="text-sm font-medium text-gray-800 flex items-start">
                        <span className="text-primary mr-2 mt-1">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="text-center py-4 px-6 bg-secondary/5">
                  <ul className="space-y-2 text-left">
                    {company2.keyBenefits.map((benefit, idx) => (
                      <li key={idx} className="text-sm font-medium text-gray-800 flex items-start">
                        <span className="text-secondary mr-2 mt-1">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-semibold text-gray-700 py-4 px-6 border-r border-gray-100">
                  Unique Strengths
                </TableCell>
                <TableCell className="text-center py-4 px-6 bg-primary/5 border-r border-gray-100">
                  <ul className="space-y-2 text-left">
                    {company1.uniqueStrengths.map((strength, idx) => (
                      <li key={idx} className="text-sm font-medium text-gray-800 flex items-start">
                        <span className="text-primary mr-2 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="text-center py-4 px-6 bg-secondary/5">
                  <ul className="space-y-2 text-left">
                    {company2.uniqueStrengths.map((strength, idx) => (
                      <li key={idx} className="text-sm font-medium text-gray-800 flex items-start">
                        <span className="text-secondary mr-2 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
