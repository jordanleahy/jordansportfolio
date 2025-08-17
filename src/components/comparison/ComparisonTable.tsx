
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building, Users } from 'lucide-react';
import { ComparisonData } from '@/types/comparison';
import { COMPARISON_DEFAULTS } from '@/constants/comparisonConstants';

interface ComparisonTableProps {
  data: ComparisonData;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
  const { company1, company2 } = data;


  // Add fallbacks for missing data - use dynamic fallbacks
  const safeCompany1 = {
    name: company1?.name || `${data.title?.split(' vs ')[0] || COMPARISON_DEFAULTS.COMPANY_FALLBACKS.FIRST}`,
    founded: company1?.founded || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    headquarters: company1?.headquarters || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    companyType: company1?.companyType || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    funding: company1?.funding || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    investors: company1?.investors || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    employeeSize: company1?.employeeSize || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    deliveryModel: company1?.deliveryModel || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    targetCustomers: company1?.targetCustomers || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    primarySolutions: company1?.primarySolutions || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    aiCore: company1?.aiCore || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    ehrIntegration: company1?.ehrIntegration || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    clientBase: company1?.clientBase || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    certifications: company1?.certifications || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    awards: company1?.awards || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    keyBenefits: company1?.keyBenefits || [],
    uniqueStrengths: company1?.uniqueStrengths || []
  };

  const safeCompany2 = {
    name: company2?.name || `${data.title?.split(' vs ')[1] || COMPARISON_DEFAULTS.COMPANY_FALLBACKS.SECOND}`,
    founded: company2?.founded || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    headquarters: company2?.headquarters || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    companyType: company2?.companyType || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    funding: company2?.funding || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    investors: company2?.investors || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    employeeSize: company2?.employeeSize || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    deliveryModel: company2?.deliveryModel || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    targetCustomers: company2?.targetCustomers || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    primarySolutions: company2?.primarySolutions || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    aiCore: company2?.aiCore || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    ehrIntegration: company2?.ehrIntegration || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    clientBase: company2?.clientBase || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    certifications: company2?.certifications || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
    awards: company2?.awards || COMPARISON_DEFAULTS.MISSING_DATA_PLACEHOLDER,
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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
