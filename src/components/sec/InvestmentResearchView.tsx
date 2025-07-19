import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  ExternalLink,
  Users,
  Calendar,
  MapPin
} from "lucide-react";

interface InvestmentResearchData {
  company_overview: {
    legal_entity: string;
    headquarters: string;
    executive_signer: string;
    corporate_structure: string;
    business_description: string;
    notable_feature: string;
  };
  financial_profile: {
    sec_form_filed: string;
    security_offered: string;
    total_offering: string;
    amount_sold: string;
    remaining: string;
    minimum_investment?: string;
    prior_funding: string[];
    revenue_metrics: string;
    burn_rate: string;
  };
  market_position: {
    target_market: string;
    competitive_landscape: string[];
    technology: string[];
  };
  risk_assessment: {
    regulatory: string[];
    leadership_check: string;
    litigation: string;
    concerns: string[];
  };
  next_steps: string[];
}

interface InvestmentResearchViewProps {
  data: InvestmentResearchData;
  generatedAt: string;
}

export const InvestmentResearchView: React.FC<InvestmentResearchViewProps> = ({
  data,
  generatedAt
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskLevel = (concerns: string[]) => {
    if (concerns.length >= 3) return { level: 'High', color: 'destructive' };
    if (concerns.length >= 1) return { level: 'Medium', color: 'warning' };
    return { level: 'Low', color: 'success' };
  };

  const riskLevel = getRiskLevel(data.risk_assessment.concerns);

  return (
    <div className="space-y-4">
      {/* Header with generation timestamp */}
      <div className="flex flex-col gap-2 mb-4">
        <h3 className="text-lg font-semibold">Investment Analysis</h3>
        <Badge variant="outline" className="w-fit text-xs">
          Generated {formatDate(generatedAt)}
        </Badge>
      </div>

      {/* Executive Summary Cards - Stacked Mobile */}
      <div className="space-y-3 mb-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm mb-1">Legal Entity</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {data.company_overview.corporate_structure}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm mb-1">Total Offering</h4>
                <p className="text-lg font-bold text-green-600 mb-1">
                  {data.financial_profile.total_offering}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.financial_profile.security_offered}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm mb-1">Target Market</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {data.market_position.target_market}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${
          riskLevel.color === 'destructive' ? 'border-l-red-500' :
          riskLevel.color === 'warning' ? 'border-l-yellow-500' : 'border-l-green-500'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                riskLevel.color === 'destructive' ? 'text-red-600' :
                riskLevel.color === 'warning' ? 'text-yellow-600' : 'text-green-600'
              }`} />
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm mb-2">Risk Assessment</h4>
                <Badge variant={
                  riskLevel.color === 'destructive' ? 'destructive' :
                  riskLevel.color === 'warning' ? 'secondary' : 'outline'
                } className="text-xs">
                  {riskLevel.level} Risk
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4" />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">Total Offering</span>
                <span className="text-lg font-bold text-green-800">{data.financial_profile.total_offering}</span>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Amount Sold</span>
                <span className="text-lg font-bold text-blue-800">{data.financial_profile.amount_sold}</span>
              </div>
            </div>
            
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-700">Remaining</span>
                <span className="text-lg font-bold text-orange-800">{data.financial_profile.remaining}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Prior Funding History</h5>
              <div className="space-y-2">
                {data.financial_profile.prior_funding.map((funding, index) => (
                  <div key={index} className="p-2 bg-muted/30 rounded text-sm">
                    {funding}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-1">Revenue Metrics</h5>
              <p className="text-sm">{data.financial_profile.revenue_metrics}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Details Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Legal Entity</span>
              <span className="text-sm font-medium text-right">{data.company_overview.legal_entity}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Headquarters</span>
              <span className="text-sm text-right">{data.company_overview.headquarters}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Executive</span>
              <span className="text-sm text-right">{data.company_overview.executive_signer}</span>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Business Description</h5>
            <p className="text-sm leading-relaxed">{data.company_overview.business_description}</p>
          </div>
          
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <h5 className="text-sm font-medium text-primary mb-1">Key Feature</h5>
            <p className="text-sm">{data.company_overview.notable_feature}</p>
          </div>
        </CardContent>
      </Card>

      {/* Market & Competition Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Market & Competition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Target Market</h5>
            <p className="text-sm leading-relaxed">{data.market_position.target_market}</p>
          </div>
          
          <Separator />
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Competitive Landscape</h5>
            <div className="space-y-2">
              {data.market_position.competitive_landscape.map((item, index) => (
                <div key={index} className="p-2 bg-muted/30 rounded text-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Technology Stack</h5>
            <div className="space-y-2">
              {data.market_position.technology.map((tech, index) => (
                <div key={index} className="p-2 bg-muted/30 rounded text-sm">
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card className={`border-l-4 ${
        riskLevel.color === 'destructive' ? 'border-l-red-500' :
        riskLevel.color === 'warning' ? 'border-l-yellow-500' : 'border-l-green-500'
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className={`h-4 w-4 ${
              riskLevel.color === 'destructive' ? 'text-red-600' :
              riskLevel.color === 'warning' ? 'text-yellow-600' : 'text-green-600'
            }`} />
            Risk Assessment
            <Badge variant={
              riskLevel.color === 'destructive' ? 'destructive' :
              riskLevel.color === 'warning' ? 'secondary' : 'outline'
            } className="ml-auto">
              {riskLevel.level} Risk
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Leadership</span>
              <span className="text-sm text-right flex-1 ml-4">{data.risk_assessment.leadership_check}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Litigation</span>
              <span className="text-sm text-right flex-1 ml-4">{data.risk_assessment.litigation}</span>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Regulatory Environment</h5>
            <div className="space-y-2">
              {data.risk_assessment.regulatory.map((reg, index) => (
                <div key={index} className="p-2 bg-muted/30 rounded text-sm">
                  {reg}
                </div>
              ))}
            </div>
          </div>

          {data.risk_assessment.concerns.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Key Concerns</h5>
              <div className="space-y-2">
                {data.risk_assessment.concerns.map((concern, index) => (
                  <div key={index} className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800 leading-relaxed">{concern}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.next_steps.map((step, index) => (
              <div key={index} className="flex gap-3 p-3 border border-border rounded-lg bg-background">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed flex-1">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};