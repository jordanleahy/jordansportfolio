import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Info } from 'lucide-react';

interface CompanyData {
  name: string;
  founded: string;
  headquarters: string;
  companyType: string;
  funding: string;
  investors: string;
  employeeSize: string;
  deliveryModel: string;
  targetCustomers: string;
  primarySolutions: string;
  aiCore: string;
  ehrIntegration: string;
  keyBenefits: string[];
  uniqueStrengths: string[];
  clientBase: string;
  certifications: string;
  awards: string;
}

interface Feature {
  feature: string;
  company1: boolean | string;
  company2: boolean | string;
}

interface SummaryInsights {
  company1: string;
  company2: string;
}

interface UseCase {
  useCase: string;
  bestFit: string;
}

interface ComparisonData {
  title: string;
  metaTitle: string;
  metaDescription: string;
  company1: CompanyData;
  company2: CompanyData;
  features: Feature[];
  summaryInsights: SummaryInsights;
  useCases: UseCase[];
}

interface ComparisonPreviewProps {
  data: ComparisonData;
}

export const ComparisonPreview: React.FC<ComparisonPreviewProps> = ({ data }) => {
  // Add safety checks for data structure
  if (!data || !data.company1 || !data.company2) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No comparison data available</p>
      </div>
    );
  }

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  const getBestFitBadgeColor = (bestFit: string, companyName: string) => {
    if (bestFit === 'Both') return 'default';
    return bestFit === companyName ? 'default' : 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{data.title}</CardTitle>
          <p className="text-muted-foreground">{data.metaDescription}</p>
        </CardHeader>
      </Card>

      {/* Company Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {data.company1.name}
              <Badge variant="outline">{data.company1.companyType}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Founded:</strong> {data.company1.founded}</div>
              <div><strong>HQ:</strong> {data.company1.headquarters}</div>
              <div><strong>Funding:</strong> {data.company1.funding}</div>
              <div><strong>Employees:</strong> {data.company1.employeeSize}</div>
            </div>
            <div>
              <strong>Primary Solutions:</strong>
              <p className="text-sm text-muted-foreground mt-1">{data.company1.primarySolutions}</p>
            </div>
            <div>
              <strong>AI Core:</strong>
              <p className="text-sm text-muted-foreground mt-1">{data.company1.aiCore}</p>
            </div>
            <div>
              <strong>Key Benefits:</strong>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                {data.company1.keyBenefits.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {data.company2.name}
              <Badge variant="outline">{data.company2.companyType}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Founded:</strong> {data.company2.founded}</div>
              <div><strong>HQ:</strong> {data.company2.headquarters}</div>
              <div><strong>Funding:</strong> {data.company2.funding}</div>
              <div><strong>Employees:</strong> {data.company2.employeeSize}</div>
            </div>
            <div>
              <strong>Primary Solutions:</strong>
              <p className="text-sm text-muted-foreground mt-1">{data.company2.primarySolutions}</p>
            </div>
            <div>
              <strong>AI Core:</strong>
              <p className="text-sm text-muted-foreground mt-1">{data.company2.aiCore}</p>
            </div>
            <div>
              <strong>Key Benefits:</strong>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                {data.company2.keyBenefits.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Feature</th>
                  <th className="text-center p-3 font-medium">{data.company1.name}</th>
                  <th className="text-center p-3 font-medium">{data.company2.name}</th>
                </tr>
              </thead>
              <tbody>
                {data.features.map((feature, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{feature.feature}</td>
                    <td className="p-3 text-center">{renderFeatureValue(feature.company1)}</td>
                    <td className="p-3 text-center">{renderFeatureValue(feature.company2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {data.company1.name} Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{data.summaryInsights.company1}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {data.company2.name} Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{data.summaryInsights.company2}</p>
          </CardContent>
        </Card>
      </div>

      {/* Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Use Case Suitability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.useCases.map((useCase, idx) => (
              <div key={idx} className="flex justify-between items-start p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{useCase.useCase}</p>
                </div>
                <Badge 
                  variant={getBestFitBadgeColor(useCase.bestFit, data.company1.name)}
                  className="ml-3"
                >
                  {useCase.bestFit}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};