import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  MapPin, 
  User, 
  FileText,
  Phone,
  Mail,
  Users,
  Briefcase,
  UserCheck,
  Brain,
  Plus
} from "lucide-react";
import { InvestmentResearchView } from "./InvestmentResearchView";
import { useInvestmentResearch, useSaveInvestmentResearch } from "@/hooks/useInvestmentResearch";
import { useState } from "react";

interface OfferingDetailModalProps {
  offering: any;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
}

export const OfferingDetailModal: React.FC<OfferingDetailModalProps> = ({
  offering,
  isOpen,
  isLoading = false,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get investment research for this offering
  const { data: investmentResearch, isLoading: researchLoading } = useInvestmentResearch(
    offering?.accessionnumber
  );
  const saveResearch = useSaveInvestmentResearch();

  // Sample research data for demo (would normally come from AI generation)
  const sampleResearchData = {
    company_overview: {
      legal_entity: offering?.issuers?.[0]?.entityname || "Unknown Company",
      headquarters: offering?.issuers?.[0]?.city ? `${offering.issuers[0].city}, ${offering.issuers[0].stateorcountrydescription}` : "Not specified",
      executive_signer: offering?.signatures?.[0]?.nameofsigner || "Not specified",
      corporate_structure: `${offering?.issuers?.[0]?.entitytype || "Unknown"} incorporated in ${offering?.issuers?.[0]?.jurisdictionofinc || "Unknown"}`,
      business_description: "Business description not available from SEC filings. Further research required to determine specific business operations and market focus.",
      notable_feature: "Company has filed for private placement offering under Regulation D."
    },
    financial_profile: {
      sec_form_filed: offering?.formd_submission?.filing_date || "Not specified",
      security_offered: offering?.isequitytype ? "Equity" : offering?.isdebttype ? "Debt" : "Other",
      total_offering: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(offering?.totalofferingamount || 0),
      amount_sold: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(offering?.totalamountsold || 0),
      remaining: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(offering?.totalremaining || 0),
      minimum_investment: offering?.minimuminvestmentaccepted ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(offering.minimuminvestmentaccepted) : "Not disclosed",
      prior_funding: ["Previous funding history not available in SEC filings"],
      revenue_metrics: "Revenue information not disclosed in current filings",
      burn_rate: "Financial metrics require additional research beyond SEC filings"
    },
    market_position: {
      target_market: offering?.industrygrouptype || "Industry not specified in filings",
      competitive_landscape: ["Competitive analysis requires market research beyond SEC data"],
      technology: ["Technology stack information not available in regulatory filings"]
    },
    risk_assessment: {
      regulatory: ["Private placement under Regulation D exemption", "Must comply with federal securities laws"],
      leadership_check: `Executive signer: ${offering?.signatures?.[0]?.nameofsigner || "Not specified"}. Further background check recommended.`,
      litigation: "No litigation information available in current SEC filings",
      concerns: offering?.totalofferingamount > 100000000 ? ["Large offering amount relative to typical private placements"] : []
    },
    next_steps: [
      "Request complete business plan and financial statements",
      "Conduct management team background checks",
      "Analyze competitive landscape and market opportunity",
      "Review legal documentation and offering memorandum",
      "Validate business model and revenue projections"
    ]
  };

  const handleGenerateResearch = async () => {
    if (!offering?.accessionnumber) return;
    
    try {
      await saveResearch.mutateAsync({
        accessionnumber: offering.accessionnumber,
        researchData: sampleResearchData
      });
    } catch (error) {
      console.error("Failed to generate research:", error);
    }
  };

  if (!isOpen) return null;
  
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-5 w-32" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j}>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!offering) return null;

  const formatCurrency = (amount: number | string) => {
    if (!amount) return 'Not disclosed';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'Not disclosed';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const issuer = offering.issuers?.[0];
  const signature = offering.signatures?.[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5" />
            {issuer?.entityname || 'Unknown Company'}
          </DialogTitle>
        </DialogHeader>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">SEC Filing</span>
              <span className="sm:hidden">Filing</span>
            </TabsTrigger>
            <TabsTrigger value="research" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Investment Analysis</span>
              <span className="sm:hidden">Analysis</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* People Information Tabs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  People Involved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="executives" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="executives" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Executives & Insiders
                    </TabsTrigger>
                    <TabsTrigger value="brokers" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Broker-Dealers
                    </TabsTrigger>
                    <TabsTrigger value="individuals" className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Individual Brokers
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="executives" className="mt-4">
                    <div className="space-y-4">
                      {offering.related_persons && offering.related_persons.length > 0 ? (
                        offering.related_persons.map((person: any, index: number) => (
                          <Card key={index} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Name</label>
                                <p className="font-semibold">
                                  {[person.firstname, person.middlename, person.lastname]
                                    .filter(Boolean)
                                    .join(' ') || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {person.relationship_1 && (
                                    <Badge variant="outline">{person.relationship_1}</Badge>
                                  )}
                                  {person.relationship_2 && (
                                    <Badge variant="outline">{person.relationship_2}</Badge>
                                  )}
                                  {person.relationship_3 && (
                                    <Badge variant="outline">{person.relationship_3}</Badge>
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Address</label>
                                <p className="text-sm">
                                  {[person.street1, person.street2, person.city, person.stateorcountrydescription, person.zipcode]
                                    .filter(Boolean)
                                    .join(', ') || 'Not specified'}
                                </p>
                              </div>
                              {person.relationshipclarification && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Clarification</label>
                                  <p className="text-sm">{person.relationshipclarification}</p>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No executive information available</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="brokers" className="mt-4">
                    <div className="space-y-4">
                      {offering.recipients && offering.recipients.length > 0 ? (
                        offering.recipients
                          .filter((recipient: any) => !recipient.recipientcrdnumber)
                          .map((recipient: any, index: number) => (
                            <Card key={index} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                                  <p className="font-semibold">{recipient.recipientname || 'Not specified'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Associated BD Name</label>
                                  <p>{recipient.associatedbdname || 'Not specified'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Associated BD CRD</label>
                                  <p className="font-mono text-sm">{recipient.associatedbdcrdnumber || 'Not specified'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                                  <p className="text-sm">
                                    {[recipient.street1, recipient.street2, recipient.city, recipient.stateorcountrydescription, recipient.zipcode]
                                      .filter(Boolean)
                                      .join(', ') || 'Not specified'}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Foreign Solicitation</label>
                                  <Badge variant={recipient.foreignsolicitation ? "secondary" : "outline"}>
                                    {recipient.foreignsolicitation ? "Yes" : "No"}
                                  </Badge>
                                </div>
                                {recipient.descriptions_list && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Descriptions</label>
                                    <p className="text-sm">{recipient.descriptions_list}</p>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No broker-dealer information available</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="individuals" className="mt-4">
                    <div className="space-y-4">
                      {offering.recipients && offering.recipients.length > 0 ? (
                        offering.recipients
                          .filter((recipient: any) => recipient.recipientcrdnumber)
                          .map((recipient: any, index: number) => (
                            <Card key={index} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                                  <p className="font-semibold">{recipient.recipientname || 'Not specified'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">CRD Number</label>
                                  <p className="font-mono text-sm">{recipient.recipientcrdnumber}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Associated BD Name</label>
                                  <p>{recipient.associatedbdname || 'Not specified'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Associated BD CRD</label>
                                  <p className="font-mono text-sm">{recipient.associatedbdcrdnumber || 'Not specified'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                                  <p className="text-sm">
                                    {[recipient.street1, recipient.street2, recipient.city, recipient.stateorcountrydescription, recipient.zipcode]
                                      .filter(Boolean)
                                      .join(', ') || 'Not specified'}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Foreign Solicitation</label>
                                  <Badge variant={recipient.foreignsolicitation ? "secondary" : "outline"}>
                                    {recipient.foreignsolicitation ? "Yes" : "No"}
                                  </Badge>
                                </div>
                              </div>
                            </Card>
                          ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No individual broker information available</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                    <p className="font-semibold">{issuer?.entityname || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Entity Type</label>
                    <p>{issuer?.entitytype || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CIK Number</label>
                    <p className="font-mono text-sm">{issuer?.cik || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Jurisdiction of Incorporation</label>
                    <p>{issuer?.jurisdictionofinc || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Year of Incorporation</label>
                    <p>{issuer?.yearofinc_value_entered || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Street Address</label>
                    <p>{issuer?.street1 || 'Not specified'}</p>
                    {issuer?.street2 && <p>{issuer.street2}</p>}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">City</label>
                    <p>{issuer?.city || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">State/Country</label>
                    <p>{issuer?.stateorcountrydescription || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ZIP Code</label>
                    <p>{issuer?.zipcode || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <p>{issuer?.issuerphonenumber || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Offering Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Offering Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Offering Amount</label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(offering.totalofferingamount)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount Sold</label>
                    <p className="font-semibold">{formatCurrency(offering.totalamountsold)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount Remaining</label>
                    <p className="font-semibold">{formatCurrency(offering.totalremaining)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Minimum Investment</label>
                    <p>{formatCurrency(offering.minimuminvestmentaccepted)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Industry</label>
                    <div className="mt-1">
                      <Badge variant="secondary">
                        {offering.industrygrouptype || 'Other'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Filing Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Accession Number</label>
                    <p className="font-mono text-sm">{offering.accessionnumber}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of First Sale</label>
                    <p>{formatDate(offering.sale_date)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Federal Exemptions</label>
                    <p>{offering.federalexemptions_items_list || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Is Amendment</label>
                    <Badge variant={offering.isamendment ? "destructive" : "secondary"}>
                      {offering.isamendment ? "Yes" : "No"}
                    </Badge>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Revenue Range</label>
                    <p>{offering.revenuerange || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Security Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {offering.isequitytype && (
                      <Badge variant="outline">Equity</Badge>
                    )}
                    {offering.isdebttype && (
                      <Badge variant="outline">Debt</Badge>
                    )}
                    {offering.ispooledinvestmentfundtype && (
                      <Badge variant="outline">Pooled Investment Fund</Badge>
                    )}
                    {offering.ismineralpropertytype && (
                      <Badge variant="outline">Mineral Property</Badge>
                    )}
                    {offering.istenantincommontype && (
                      <Badge variant="outline">Tenant-in-Common</Badge>
                    )}
                    {offering.issecuritytobeacquiredtype && (
                      <Badge variant="outline">Security to be Acquired</Badge>
                    )}
                    {offering.isoptiontoacquiretype && (
                      <Badge variant="outline">Option to Acquire</Badge>
                    )}
                    {offering.isothertype && (
                      <Badge variant="outline">Other</Badge>
                    )}
                    {!offering.isequitytype && !offering.isdebttype && !offering.ispooledinvestmentfundtype && 
                     !offering.ismineralpropertytype && !offering.istenantincommontype && 
                     !offering.issecuritytobeacquiredtype && !offering.isoptiontoacquiretype && 
                     !offering.isothertype && (
                      <p className="text-muted-foreground">No security types specified</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Authorized Representative */}
              {signature && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Authorized Representative
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="font-semibold">{signature.nameofsigner || 'Not specified'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Signature Name</label>
                      <p>{signature.signaturename || 'Not specified'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Title</label>
                      <p>{signature.signaturetitle || 'Not specified'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Signature Date</label>
                      <p>{formatDate(signature.signaturedate)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator className="my-6" />

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Has Non-Accredited Investors</label>
                    <Badge variant={offering.hasnonaccreditedinvestors ? "destructive" : "secondary"}>
                      {offering.hasnonaccreditedinvestors ? "Yes" : "No"}
                    </Badge>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Number of Non-Accredited Investors</label>
                    <p>{offering.numbernonaccreditedinvestors || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">More Than One Year</label>
                    <Badge variant={offering.morethanoneyear ? "secondary" : "outline"}>
                      {offering.morethanoneyear ? "Yes" : "No"}
                    </Badge>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Number Already Invested</label>
                    <p>{offering.totalnumberalreadyinvested || 'Not specified'}</p>
                  </div>
                </div>

                {offering.descriptionofothertype && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description of Other Type</label>
                    <p className="text-sm bg-muted p-3 rounded-md">{offering.descriptionofothertype}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="research" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold">Investment Due Diligence</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered analysis based on SEC filings and public data
                </p>
              </div>
              
              {!investmentResearch && (
                <Button 
                  onClick={handleGenerateResearch}
                  disabled={saveResearch.isPending}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {saveResearch.isPending ? "Generating..." : "Generate Analysis"}
                </Button>
              )}
            </div>

            {investmentResearch ? (
              <InvestmentResearchView 
                data={investmentResearch.research_data}
                generatedAt={investmentResearch.generated_at}
              />
            ) : researchLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="h-5 bg-muted rounded animate-pulse w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
                        <div className="h-4 bg-muted rounded animate-pulse w-3/5" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Investment Analysis Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate an AI-powered investment analysis based on available SEC filing data.
                  </p>
                  <Button 
                    onClick={handleGenerateResearch}
                    disabled={saveResearch.isPending}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Analysis
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};