
import { useState } from 'react';
import { ExternalLink, DollarSign, Users, Building, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { type Vendor } from '@/types/vendor';

interface VendorsTableProps {
  vendors: Vendor[];
  onVendorClick: (vendor: Vendor) => void;
}

type SortField = 'companyName' | 'yearFounded' | 'fundingRaised' | 'companyType';
type SortDirection = 'asc' | 'desc';

export function VendorsTable({ vendors, onVendorClick }: VendorsTableProps) {
  const [sortField, setSortField] = useState<SortField>('companyName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedVendors = [...vendors].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === 'fundingRaised') {
      aVal = a.fundingRaised || 0;
      bVal = b.fundingRaised || 0;
    }

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
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 min-w-[200px]"
                  onClick={() => handleSort('companyName')}
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company
                    {sortField === 'companyName' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="min-w-[150px]">Description</TableHead>
                <TableHead className="min-w-[120px]">Services</TableHead>
                <TableHead className="min-w-[120px]">Customers</TableHead>
                <TableHead className="min-w-[120px]">Specialties</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('companyType')}
                >
                  <div className="flex items-center gap-2">
                    Type
                    {sortField === 'companyType' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('fundingRaised')}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Funding
                    {sortField === 'fundingRaised' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('yearFounded')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Founded
                    {sortField === 'yearFounded' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVendors.map((vendor) => (
                <TableRow 
                  key={vendor.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onVendorClick(vendor)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{vendor.companyName}</div>
                      <div className="text-sm text-muted-foreground">
                        {vendor.headquarters}
                      </div>
                    </div>
                  </TableCell>
                   <TableCell>
                     <div className="max-w-[300px] whitespace-normal break-words text-sm leading-relaxed">
                       {vendor.description}
                     </div>
                   </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {vendor.coreServices.slice(0, 2).map((service, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                      {vendor.coreServices.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{vendor.coreServices.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {vendor.targetCustomers.slice(0, 2).map((customer, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {customer}
                        </Badge>
                      ))}
                      {vendor.targetCustomers.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{vendor.targetCustomers.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {vendor.specialtyFocus.slice(0, 2).map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {vendor.specialtyFocus.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{vendor.specialtyFocus.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCompanyTypeBadgeColor(vendor.companyType)}>
                      {vendor.companyType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatFunding(vendor.fundingRaised)}
                      {vendor.latestFundingRound && (
                        <div className="text-xs text-muted-foreground truncate">
                          {vendor.latestFundingRound}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {vendor.yearFounded}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {vendor.websiteUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(vendor.websiteUrl, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedVendors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No vendors found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
