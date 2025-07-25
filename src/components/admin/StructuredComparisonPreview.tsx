import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Info } from 'lucide-react';

interface StructuredComparisonData {
  comparison?: {
    title: string;
    meta_title: string;
    meta_description: string;
  };
  basic_info?: Array<{
    category: string;
    company1_value: string;
    company2_value: string;
    sort_order: number;
  }>;
  features?: Array<{
    feature_name: string;
    company1_value: string;
    company2_value: string;
    sort_order: number;
  }>;
  insights?: Array<{
    company_position: number;
    insight_text: string;
  }>;
  use_cases?: Array<{
    use_case: string;
    best_fit: string;
    sort_order: number;
  }>;
}

interface StructuredComparisonPreviewProps {
  data: StructuredComparisonData;
  company1Name?: string;
  company2Name?: string;
}

export const StructuredComparisonPreview: React.FC<StructuredComparisonPreviewProps> = ({ 
  data, 
  company1Name = "Company 1", 
  company2Name = "Company 2" 
}) => {
  if (!data || (!data.comparison && !data.basic_info && !data.features)) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No comparison data available</p>
      </div>
    );
  }

  const renderFeatureValue = (value: string) => {
    // Check if it's a boolean-like string
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'yes') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (value.toLowerCase() === 'false' || value.toLowerCase() === 'no') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <span className="text-sm">{value}</span>;
  };

  const getBestFitBadgeColor = (bestFit: string, companyName: string) => {
    if (bestFit === 'Both') return 'default';
    return bestFit === companyName ? 'default' : 'secondary';
  };

  // Get company info from basic_info
  const getCompanyInfo = (position: 1 | 2) => {
    const info: Record<string, string> = {};
    data.basic_info?.forEach(item => {
      info[item.category] = position === 1 ? item.company1_value : item.company2_value;
    });
    return info;
  };

  const company1Info = getCompanyInfo(1);
  const company2Info = getCompanyInfo(2);

  const company1Insight = data.insights?.find(i => i.company_position === 1);
  const company2Insight = data.insights?.find(i => i.company_position === 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      {data.comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{data.comparison.title}</CardTitle>
            <p className="text-muted-foreground">{data.comparison.meta_description}</p>
          </CardHeader>
        </Card>
      )}

      {/* Company Overview */}
      {data.basic_info && data.basic_info.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {company1Name}
                {company1Info['Company Type'] && (
                  <Badge variant="outline">{company1Info['Company Type']}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 text-sm">
                {Object.entries(company1Info).map(([category, value]) => (
                  <div key={category} className="flex justify-between">
                    <strong>{category}:</strong>
                    <span className="text-muted-foreground">{value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {company2Name}
                {company2Info['Company Type'] && (
                  <Badge variant="outline">{company2Info['Company Type']}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 text-sm">
                {Object.entries(company2Info).map(([category, value]) => (
                  <div key={category} className="flex justify-between">
                    <strong>{category}:</strong>
                    <span className="text-muted-foreground">{value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feature Comparison */}
      {data.features && data.features.length > 0 && (
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
                    <th className="text-center p-3 font-medium">{company1Name}</th>
                    <th className="text-center p-3 font-medium">{company2Name}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.features.map((feature, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{feature.feature_name}</td>
                      <td className="p-3 text-center">{renderFeatureValue(feature.company1_value)}</td>
                      <td className="p-3 text-center">{renderFeatureValue(feature.company2_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Insights */}
      {(company1Insight || company2Insight) && (
        <div className="grid md:grid-cols-2 gap-6">
          {company1Insight && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  {company1Name} Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{company1Insight.insight_text}</p>
              </CardContent>
            </Card>
          )}

          {company2Insight && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  {company2Name} Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{company2Insight.insight_text}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Use Cases */}
      {data.use_cases && data.use_cases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Use Case Suitability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.use_cases.map((useCase, idx) => (
                <div key={idx} className="flex justify-between items-start p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{useCase.use_case}</p>
                  </div>
                  <Badge 
                    variant={getBestFitBadgeColor(useCase.best_fit, company1Name)}
                    className="ml-3"
                  >
                    {useCase.best_fit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};