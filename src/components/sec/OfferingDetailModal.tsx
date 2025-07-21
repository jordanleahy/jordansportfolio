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
  Plus
} from "lucide-react";

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

        {/* SEC Filing Details */}
        <div className="space-y-6">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};