
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparisonData } from '@/types/comparison';

interface SummaryInsightsProps {
  data: ComparisonData;
}

export const SummaryInsights: React.FC<SummaryInsightsProps> = ({ data }) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          🧠 Summary Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">{data.company1.name}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {data.summaryInsights.company1}
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">{data.company2.name}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {data.summaryInsights.company2}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
