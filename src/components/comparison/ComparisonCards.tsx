import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComparisonData } from '@/data/comparisonData';
import { Building2, Calendar, MapPin, Users, DollarSign, Target, Zap, Shield } from 'lucide-react';

interface ComparisonCardsProps {
  data: ComparisonData;
}

export const ComparisonCards: React.FC<ComparisonCardsProps> = ({ data }) => {
  const { company1, company2 } = data;

  const comparisonSections = [
    {
      title: 'Company Overview',
      icon: Building2,
      items: [
        { label: 'Founded', value1: company1.founded, value2: company2.founded, icon: Calendar },
        { label: 'Headquarters', value1: company1.headquarters, value2: company2.headquarters, icon: MapPin },
        { label: 'Company Type', value1: company1.companyType, value2: company2.companyType },
        { label: 'Employee Size', value1: company1.employeeSize, value2: company2.employeeSize, icon: Users }
      ]
    },
    {
      title: 'Business Model',
      icon: DollarSign,
      items: [
        { label: 'Funding', value1: company1.funding, value2: company2.funding },
        { label: 'Investors', value1: company1.investors, value2: company2.investors },
        { label: 'Delivery Model', value1: company1.deliveryModel, value2: company2.deliveryModel },
        { label: 'Target Customers', value1: company1.targetCustomers, value2: company2.targetCustomers, icon: Target }
      ]
    },
    {
      title: 'Technology & Solutions',
      icon: Zap,
      items: [
        { label: 'Primary Solutions', value1: company1.primarySolutions, value2: company2.primarySolutions },
        { label: 'AI Core', value1: company1.aiCore, value2: company2.aiCore },
        { label: 'EHR Integration', value1: company1.ehrIntegration, value2: company2.ehrIntegration },
        { label: 'Client Base', value1: company1.clientBase, value2: company2.clientBase }
      ]
    },
    {
      title: 'Credentials & Recognition',
      icon: Shield,
      items: [
        { label: 'Certifications', value1: company1.certifications, value2: company2.certifications },
        { label: 'Awards & Recognition', value1: company1.awards, value2: company2.awards }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Company Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">{company1.name}</CardTitle>
            <Badge variant="secondary" className="w-fit mx-auto">{company1.companyType}</Badge>
          </CardHeader>
        </Card>
        <Card className="border-2 border-secondary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-secondary">{company2.name}</CardTitle>
            <Badge variant="outline" className="w-fit mx-auto">{company2.companyType}</Badge>
          </CardHeader>
        </Card>
      </div>

      {/* Comparison Sections */}
      {comparisonSections.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <section.icon className="h-5 w-5" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 border-b border-border/50 last:border-b-0">
                  <div className="flex items-center gap-2 font-medium text-muted-foreground">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </div>
                  <div className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/20">
                    {item.value1}
                  </div>
                  <div className="text-sm bg-secondary/5 p-3 rounded-lg border border-secondary/20">
                    {item.value2}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Key Benefits and Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">{company1.name} Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Key Benefits</h4>
                <ul className="space-y-1">
                  {company1.keyBenefits.map((benefit, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Unique Strengths</h4>
                <ul className="space-y-1">
                  {company1.uniqueStrengths.map((strength, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-secondary">{company2.name} Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Key Benefits</h4>
                <ul className="space-y-1">
                  {company2.keyBenefits.map((benefit, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-secondary mt-1">•</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Unique Strengths</h4>
                <ul className="space-y-1">
                  {company2.uniqueStrengths.map((strength, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-secondary mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};