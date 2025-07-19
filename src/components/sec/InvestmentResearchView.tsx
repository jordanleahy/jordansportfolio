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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <h3 className="text-lg font-semibold">Investment Analysis</h3>
        <Badge variant="outline" className="w-fit">
          Generated {formatDate(generatedAt)}
        </Badge>
      </div>

      {/* Executive Summary Cards - Mobile First Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Entity</span>
            </div>
            <p className="text-xs text-muted-foreground leading-tight">
              {data.company_overview.corporate_structure}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Offering</span>
            </div>
            <p className="text-xs font-semibold text-green-600">
              {data.financial_profile.total_offering}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.financial_profile.security_offered}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Market</span>
            </div>
            <p className="text-xs text-muted-foreground leading-tight">
              {data.market_position.target_market.substring(0, 50)}...
            </p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${
          riskLevel.color === 'destructive' ? 'border-l-red-500' :
          riskLevel.color === 'warning' ? 'border-l-yellow-500' : 'border-l-green-500'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-4 w-4 ${
                riskLevel.color === 'destructive' ? 'text-red-600' :
                riskLevel.color === 'warning' ? 'text-yellow-600' : 'text-green-600'
              }`} />
              <span className="text-sm font-medium">Risk</span>
            </div>
            <Badge variant={
              riskLevel.color === 'destructive' ? 'destructive' :
              riskLevel.color === 'warning' ? 'secondary' : 'outline'
            } className="text-xs">
              {riskLevel.level}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Company Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Company Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Legal Entity
              </label>
              <p className="text-sm font-medium mt-1">{data.company_overview.legal_entity}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Headquarters
              </label>
              <p className="text-sm font-medium mt-1">{data.company_overview.headquarters}</p>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Business Description
            </label>
            <p className="text-sm mt-1 leading-relaxed">{data.company_overview.business_description}</p>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-lg">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Notable Feature
            </label>
            <p className="text-sm mt-1 leading-relaxed">{data.company_overview.notable_feature}</p>
          </div>
        </CardContent>
      </Card>

      {/* Financial Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4" />
            Financial Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-700 font-medium">Total Offering</p>
              <p className="text-lg font-bold text-green-800">{data.financial_profile.total_offering}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-medium">Amount Sold</p>
              <p className="text-lg font-bold text-blue-800">{data.financial_profile.amount_sold}</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-700 font-medium">Remaining</p>
              <p className="text-lg font-bold text-orange-800">{data.financial_profile.remaining}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Prior Funding
              </label>
              <div className="mt-2 space-y-1">
                {data.financial_profile.prior_funding.map((funding, index) => (
                  <p key={index} className="text-sm bg-muted/30 p-2 rounded">{funding}</p>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Revenue Metrics
              </label>
              <p className="text-sm mt-1">{data.financial_profile.revenue_metrics}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Position */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Market Position
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Target Market
            </label>
            <p className="text-sm mt-1 leading-relaxed">{data.market_position.target_market}</p>
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Competitive Landscape
            </label>
            <div className="mt-2 space-y-1">
              {data.market_position.competitive_landscape.map((item, index) => (
                <p key={index} className="text-sm bg-muted/30 p-2 rounded">{item}</p>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Technology
            </label>
            <div className="mt-2 space-y-1">
              {data.market_position.technology.map((tech, index) => (
                <p key={index} className="text-sm bg-muted/30 p-2 rounded">{tech}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Leadership Check
              </label>
              <p className="text-sm mt-1">{data.risk_assessment.leadership_check}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Litigation
              </label>
              <p className="text-sm mt-1">{data.risk_assessment.litigation}</p>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Regulatory
            </label>
            <div className="mt-2 space-y-1">
              {data.risk_assessment.regulatory.map((reg, index) => (
                <p key={index} className="text-sm bg-muted/30 p-2 rounded">{reg}</p>
              ))}
            </div>
          </div>

          {data.risk_assessment.concerns.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Key Concerns
              </label>
              <div className="mt-2 space-y-2">
                {data.risk_assessment.concerns.map((concern, index) => (
                  <div key={index} className="flex gap-2 p-2 bg-red-50 border border-red-200 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800">{concern}</p>
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
          <div className="space-y-2">
            {data.next_steps.map((step, index) => (
              <div key={index} className="flex gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};