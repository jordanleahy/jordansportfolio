
import { X, ExternalLink, Building, Calendar, DollarSign, Users, Target, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type Vendor } from '@/types/vendor';
import { CitationIndicator } from './CitationIndicator';
import { useState } from 'react';

interface VendorModalProps {
  vendor: Vendor;
  onClose: () => void;
}

export function VendorModal({ vendor, onClose }: VendorModalProps) {
  const [showCitations, setShowCitations] = useState(true);
  
  const formatFunding = (amount?: string) => {
    if (!amount) return 'Not disclosed';
    return amount;
  };

  const getCompanyTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Public': return 'default';
      case 'Private': return 'secondary';
      case 'Startup': return 'destructive';
      case 'Subsidiary': return 'outline';
      default: return 'secondary';
    }
  };

  // Extract citations from research data
  const citations = vendor.research_data?.citations || {};
  const citationCount = vendor.research_data?.citation_count || 0;

  const getCitationsForField = (fieldName: string) => {
    return citations[fieldName] || [];
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl flex items-center gap-2">
                {vendor.company_name}
                {showCitations && getCitationsForField('company_name').length > 0 && (
                  <CitationIndicator citations={getCitationsForField('company_name')} />
                )}
              </DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {vendor.headquarters}
                  {showCitations && getCitationsForField('headquarters').length > 0 && (
                    <CitationIndicator citations={getCitationsForField('headquarters')} />
                  )}
                </div>
                {vendor.founding_year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Founded {vendor.founding_year}
                    {showCitations && getCitationsForField('founding_year').length > 0 && (
                      <CitationIndicator citations={getCitationsForField('founding_year')} />
                    )}
                  </div>
                )}
                <Badge variant={getCompanyTypeBadgeColor(vendor.company_type)}>
                  {vendor.company_type}
                  {showCitations && getCitationsForField('company_type').length > 0 && (
                    <CitationIndicator citations={getCitationsForField('company_type')} className="ml-1" />
                  )}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {vendor.website_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(vendor.website_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Website
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Citation Toggle */}
          {citationCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
              <span>Source citations: {citationCount} references</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCitations(!showCitations)}
              >
                {showCitations ? 'Hide' : 'Show'} Citations
              </Button>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              Company Overview
              {showCitations && getCitationsForField('description').length > 0 && (
                <CitationIndicator citations={getCitationsForField('description')} />
              )}
            </h3>
            <p className="text-muted-foreground">{vendor.description}</p>
          </div>

          <Separator />

          {/* Core Services */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Core Services
              {showCitations && getCitationsForField('core_services').length > 0 && (
                <CitationIndicator citations={getCitationsForField('core_services')} />
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {vendor.core_services.map((service, idx) => (
                <Badge key={idx} variant="outline">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          {/* Target Customers */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Target Customers
              {showCitations && getCitationsForField('customers').length > 0 && (
                <CitationIndicator citations={getCitationsForField('customers')} />
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {vendor.customers.map((customer, idx) => (
                <Badge key={idx} variant="secondary">
                  {customer}
                </Badge>
              ))}
            </div>
          </div>

          {/* Specialty Focus */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Specialty Focus
              {showCitations && getCitationsForField('specialties').length > 0 && (
                <CitationIndicator citations={getCitationsForField('specialties')} />
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {vendor.specialties.map((specialty, idx) => (
                <Badge key={idx} variant="outline">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              Key Features & Capabilities
              {showCitations && getCitationsForField('key_features').length > 0 && (
                <CitationIndicator citations={getCitationsForField('key_features')} />
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {vendor.key_features.map((feature, idx) => (
                <Badge key={idx} variant="default">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          {/* Key Benefits */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              Key Benefits & Value
              {showCitations && getCitationsForField('key_benefits').length > 0 && (
                <CitationIndicator citations={getCitationsForField('key_benefits')} />
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {vendor.key_benefits.map((benefit, idx) => (
                <Badge key={idx} variant="secondary">
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Funding Information */}
          {(vendor.total_funding || vendor.funding_stage || vendor.key_investors.length > 0) && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Funding Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vendor.total_funding && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-2">
                      Total Funding
                      {showCitations && getCitationsForField('total_funding').length > 0 && (
                        <CitationIndicator citations={getCitationsForField('total_funding')} />
                      )}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatFunding(vendor.total_funding)}
                    </p>
                  </div>
                )}
                {vendor.funding_stage && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-2">
                      Latest Round
                      {showCitations && getCitationsForField('funding_stage').length > 0 && (
                        <CitationIndicator citations={getCitationsForField('funding_stage')} />
                      )}
                    </p>
                    <p className="text-lg font-semibold">
                      {vendor.funding_stage}
                    </p>
                  </div>
                )}
                {vendor.key_investors && vendor.key_investors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-2">
                      Investors
                      {showCitations && getCitationsForField('key_investors').length > 0 && (
                        <CitationIndicator citations={getCitationsForField('key_investors')} />
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {vendor.key_investors.map((investor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {investor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notable Customers */}
          {vendor.notable_customers && vendor.notable_customers.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                Notable Customers
                {showCitations && getCitationsForField('notable_customers').length > 0 && (
                  <CitationIndicator citations={getCitationsForField('notable_customers')} />
                )}
              </h3>
              <div className="flex flex-wrap gap-2">
                {vendor.notable_customers.map((customer, idx) => (
                  <Badge key={idx} variant="outline">
                    {customer}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {vendor.performance_metrics && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(vendor.performance_metrics).map(([key, value], idx) => (
                  <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-primary">{key}: {String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
