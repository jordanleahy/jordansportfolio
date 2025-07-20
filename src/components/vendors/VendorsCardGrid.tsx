
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type Vendor } from '@/types/vendor';
import { EditableVendorCard } from './EditableVendorCard';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface VendorsCardGridProps {
  vendors: Vendor[];
  onVendorClick?: (vendor: Vendor) => void;
  onDeleteClick?: (vendor: Vendor) => void;
  onSave?: () => void;
}

type SortField = 'company_name' | 'founding_year' | 'company_type';
type SortDirection = 'asc' | 'desc';

export function VendorsCardGrid({ vendors, onVendorClick, onDeleteClick, onSave }: VendorsCardGridProps) {
  const navigate = useNavigate();
  const { slugname } = useParams<{ slugname: string }>();
  const [sortField, setSortField] = useState<SortField>('company_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [user, setUser] = useState<any>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Sorting Controls */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
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
      </div>

      {/* Responsive Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedVendors.map((vendor) => (
          <EditableVendorCard
            key={vendor.id}
            vendor={vendor}
            onVendorClick={handleVendorClick}
            onDeleteClick={onDeleteClick}
            onSave={onSave}
            canEdit={!!user}
          />
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
