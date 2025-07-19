
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  onVendorClick?: (vendor: Vendor) => void;
}

type SortField = 'company_name' | 'founding_year' | 'company_type';
type SortDirection = 'asc' | 'desc';

export function VendorsTable({ vendors, onVendorClick }: VendorsTableProps) {
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
      navigate(`/vendors/${slugname}/${vendor.slug}`);
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
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 min-w-[200px]"
                  onClick={() => handleSort('company_name')}
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company
                    {sortField === 'company_name' && (
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
                  onClick={() => handleSort('company_type')}
                >
                  <div className="flex items-center gap-2">
                    Type
                    {sortField === 'company_type' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead>Funding</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('founding_year')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Founded
                    {sortField === 'founding_year' && (
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
                  onClick={() => handleVendorClick(vendor)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium hover:text-primary">{vendor.company_name}</div>
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
                      {vendor.core_services.slice(0, 2).map((service, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                      {vendor.core_services.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{vendor.core_services.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {vendor.customers.slice(0, 2).map((customer, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {customer}
                        </Badge>
                      ))}
                      {vendor.customers.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{vendor.customers.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {vendor.specialties.slice(0, 2).map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {vendor.specialties.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{vendor.specialties.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCompanyTypeBadgeColor(vendor.company_type)}>
                      {vendor.company_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatFunding(vendor.total_funding)}
                      {vendor.funding_stage && (
                        <div className="text-xs text-muted-foreground truncate">
                          {vendor.funding_stage}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {vendor.founding_year || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {vendor.website_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(vendor.website_url, '_blank');
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
