
import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type Vendor } from '@/types/vendor';
import { useAuth } from '@/contexts/AuthContext';

interface VendorsTableViewProps {
  vendors: Vendor[];
  onVendorClick?: (vendor: Vendor) => void;
  onDeleteClick?: (vendor: Vendor) => void;
}

type SortField = 'company_name' | 'headquarters' | 'updated_at';
type SortDirection = 'asc' | 'desc';

export function VendorsTableView({ 
  vendors, 
  onVendorClick, 
  onDeleteClick 
}: VendorsTableViewProps) {
  // Default sort by most recent activity (updated_at)
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Check if user is authenticated to show/hide delete functionality
  // Use try-catch to handle cases where AuthProvider is not available
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch {
    // Component used outside AuthProvider - user remains null
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'updated_at' ? 'desc' : 'asc');
    }
  };

  const sortedVendors = [...vendors].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    
    if (sortField === 'updated_at') {
      // Convert date strings to Date objects for proper comparison
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
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
                    Company
                    {sortField === 'company_name' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 min-w-[150px]"
                  onClick={() => handleSort('headquarters')}
                >
                  <div className="flex items-center gap-2">
                    Location
                    {sortField === 'headquarters' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="min-w-[300px]">Description</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 min-w-[150px]"
                  onClick={() => handleSort('updated_at')}
                >
                  <div className="flex items-center gap-2">
                    Last Activity
                    {sortField === 'updated_at' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVendors.map((vendor) => (
                <TableRow 
                  key={vendor.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onVendorClick?.(vendor)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium hover:text-primary">{vendor.company_name}</div>
                      <Badge variant="outline" className="mt-1">
                        {vendor.company_type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{vendor.headquarters}</TableCell>
                  <TableCell>
                    <div className="max-w-[400px] whitespace-normal break-words text-sm leading-relaxed line-clamp-2">
                      {vendor.description}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(vendor.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {onDeleteClick && user && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(vendor);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
