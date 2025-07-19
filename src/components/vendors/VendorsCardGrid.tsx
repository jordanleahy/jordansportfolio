
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Building, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Vendor } from '@/types/vendor';

interface VendorsCardGridProps {
  vendors: Vendor[];
  onVendorClick?: (vendor: Vendor) => void;
  onDeleteClick?: (vendor: Vendor) => void;
}

type SortField = 'company_name' | 'founding_year' | 'company_type';
type SortDirection = 'asc' | 'desc';

export function VendorsCardGrid({ vendors, onVendorClick, onDeleteClick }: VendorsCardGridProps) {
  const navigate = useNavigate();
  const { slugname } = useParams<{ slugname: string }>();
  const [sortField, setSortField] = useState<SortField>('company_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleVendorClick = (vendor: Vendor) => {
    if (slugname) {
      console.log('Navigating to vendor:', vendor.company_name, 'with slug:', vendor.slug, 'category:', slugname);
      const vendorDetailUrl = `/vendors/${slugname}/${vendor.slug}`;
      console.log('Generated URL:', vendorDetailUrl);
      navigate(vendorDetailUrl);
    } else if (onVendorClick) {
      onVendorClick(vendor);
    }
  };

  const sortedVendors = [...vendors].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

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

  return (
    <div className="space-y-6">
      {/* Sorting Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
        <Button
          variant={sortField === 'company_name' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSort('company_name')}
          className="gap-2"
        >
          <Building className="h-4 w-4" />
          Company
          {sortField === 'company_name' && (
            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </Button>
        <Button
          variant={sortField === 'company_type' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSort('company_type')}
        >
          Type
          {sortField === 'company_type' && (
            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </Button>
        <Button
          variant={sortField === 'founding_year' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSort('founding_year')}
          className="gap-2"
        >
          <Calendar className="h-4 w-4" />
          Founded
          {sortField === 'founding_year' && (
            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </Button>
      </div>

      {/* Responsive Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedVendors.map((vendor) => (
          <Card 
            key={vendor.id} 
            className="cursor-pointer hover:bg-muted/50 transition-colors h-full flex flex-col"
            onClick={() => handleVendorClick(vendor)}
          >
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{vendor.company_name}</div>
                  <div className="text-sm text-muted-foreground font-normal truncate">
                    {vendor.headquarters}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {onDeleteClick && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(vendor);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {vendor.website_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(vendor.website_url, '_blank');
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 flex flex-col">
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">Description</div>
                <div className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {vendor.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="font-medium mb-1">Type</div>
                  <div className="text-muted-foreground text-xs">
                    {vendor.company_type}
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-1">Founded</div>
                  <div className="text-muted-foreground text-xs">
                    {vendor.founding_year || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-medium mb-1 text-sm">Funding</div>
                <div className="text-xs text-muted-foreground">
                  {formatFunding(vendor.total_funding)}
                  {vendor.funding_stage && (
                    <div className="text-xs mt-1">{vendor.funding_stage}</div>
                  )}
                </div>
              </div>

              <div>
                <div className="font-medium mb-1 text-sm">Core Services</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {vendor.core_services.map((service, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-medium mb-1 text-sm">Target Customers</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {vendor.customers.map((customer, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{customer}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-medium mb-1 text-sm">Specialties</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {vendor.specialties.map((specialty, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{specialty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
        {sortedVendors.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No vendors found matching your filters.
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
