
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Calendar, TrendingUp, Plus } from "lucide-react";

interface OfferingCardProps {
  offering: any;
  onViewDetails: (offeringId: string) => void;
  onAddVendor?: (accessionnumber: string) => void;
}

export const OfferingCard: React.FC<OfferingCardProps> = ({
  offering,
  onViewDetails,
  onAddVendor
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatPercentage = (amountSold: number, totalOffering: number) => {
    if (!amountSold || !totalOffering || totalOffering === 0) return 'N/A';
    const percentage = (amountSold / totalOffering) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const companyName = offering.issuers?.[0]?.entityname || offering.company_name || 'Unknown Company';
  const location = offering.issuers?.[0]?.city && offering.issuers?.[0]?.stateorcountrydescription 
    ? `${offering.issuers[0].city}, ${offering.issuers[0].stateorcountrydescription}`
    : offering.company_city && offering.company_location
    ? `${offering.company_city}, ${offering.company_location}`
    : 'Location not specified';

  return (
    <Card className="w-full hover:shadow-md transition-all duration-200 border border-border/50">
      <CardContent className="p-4 space-y-4">
        {/* Company Info */}
        <div 
          className="cursor-pointer space-y-2"
          onClick={() => onViewDetails(offering.accessionnumber)}
        >
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
            {companyName}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{location}</span>
          </div>
        </div>

        {/* Financial Info */}
        <div className="grid grid-cols-1 gap-3">
          {/* Total Offering */}
          <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Target</span>
            </div>
            <span className="font-semibold text-green-600">
              {offering.totalofferingamount 
                ? formatCurrency(offering.totalofferingamount) 
                : 'Not disclosed'
              }
            </span>
          </div>

          {/* Amount Sold */}
          <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Raised</span>
            </div>
            <span className="font-semibold text-blue-600">
              {offering.totalamountsold 
                ? formatCurrency(offering.totalamountsold) 
                : 'Not disclosed'
              }
            </span>
          </div>

          {/* Percentage and Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Progress:</span>
              <Badge variant="outline" className="text-purple-600 border-purple-200">
                {formatPercentage(offering.totalamountsold, offering.totalofferingamount)}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">{formatDate(offering.sale_date)}</span>
            </div>
          </div>
        </div>

        {/* Industry and Executive */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Badge variant="secondary" className="text-xs">
            {offering.industrygrouptype || 'Other'}
          </Badge>
          <span className="text-xs text-muted-foreground truncate ml-2">
            {offering.signatures?.[0]?.nameofsigner || offering.primary_signer || 'Executive not specified'}
          </span>
        </div>

        {/* Add to Vendors button */}
        {onAddVendor && (
          <div className="pt-3 border-t border-border/50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddVendor(offering.accessionnumber)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Vendors
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
