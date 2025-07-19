
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

interface VendorModalProps {
  vendor: Vendor;
  onClose: () => void;
}

export function VendorModal({ vendor, onClose }: VendorModalProps) {
  const formatFunding = (amount?: number) => {
    if (!amount) return 'Not disclosed';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl">{vendor.companyName}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {vendor.headquarters}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Founded {vendor.yearFounded}
                </div>
                <Badge variant={getCompanyTypeBadgeColor(vendor.companyType)}>
                  {vendor.companyType}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {vendor.websiteUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(vendor.websiteUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Website
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Company Overview</h3>
            <p className="text-muted-foreground">{vendor.description}</p>
          </div>

          <Separator />

          {/* Core Services */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Core Services
            </h3>
            <div className="flex flex-wrap gap-2">
              {vendor.coreServices.map((service, idx) => (
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
            </h3>
            <div className="flex flex-wrap gap-2">
              {vendor.targetCustomers.map((customer, idx) => (
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
            </h3>
            <div className="flex flex-wrap gap-2">
              {vendor.specialtyFocus.map((specialty, idx) => (
                <Badge key={idx} variant="outline">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Key Features & Capabilities</h3>
            <div className="flex flex-wrap gap-2">
              {vendor.keyFeatures.map((feature, idx) => (
                <Badge key={idx} variant="default">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          {/* Key Benefits */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Key Benefits & Value</h3>
            <div className="flex flex-wrap gap-2">
              {vendor.keyBenefits.map((benefit, idx) => (
                <Badge key={idx} variant="secondary">
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Funding Information */}
          {(vendor.fundingRaised || vendor.latestFundingRound || vendor.investors) && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Funding Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vendor.fundingRaised && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Total Funding</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatFunding(vendor.fundingRaised)}
                    </p>
                  </div>
                )}
                {vendor.latestFundingRound && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Latest Round</p>
                    <p className="text-lg font-semibold">
                      {vendor.latestFundingRound}
                    </p>
                  </div>
                )}
                {vendor.investors && vendor.investors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Investors</p>
                    <div className="flex flex-wrap gap-1">
                      {vendor.investors.map((investor, idx) => (
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
          {vendor.notableCustomers && vendor.notableCustomers.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Notable Customers</h3>
              <div className="flex flex-wrap gap-2">
                {vendor.notableCustomers.map((customer, idx) => (
                  <Badge key={idx} variant="outline">
                    {customer}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          {vendor.metrics && vendor.metrics.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {vendor.metrics.map((metric, idx) => (
                  <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-primary">{metric}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {vendor.notes && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Additional Notes</h3>
              <p className="text-muted-foreground bg-muted/50 p-4 rounded-lg">
                {vendor.notes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
