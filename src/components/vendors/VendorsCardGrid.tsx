
import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type Vendor, type VendorFiltersState } from '@/types/vendor';
import { EditableVendorCard } from './EditableVendorCard';
import { VendorFilters } from './VendorFilters';
import { ViewToggle, type ViewMode } from './ViewToggle';
import { VendorsTableView } from './VendorsTableView';
import { sortVendors } from '@/utils/vendorUtils';

interface VendorsCardGridProps {
  vendors: Vendor[];
  onVendorClick?: (vendor: Vendor) => void;
  onDeleteClick?: (vendor: Vendor) => void;
  onSave?: () => void;
  filters?: VendorFiltersState;
  onFiltersChange?: (filters: VendorFiltersState) => void;
  allVendors?: Vendor[];
  user?: any;
  isLoadingAuth?: boolean;
  onAddVendor?: () => void;
}

type SortField = 'company_name' | 'founding_year' | 'company_type';
type SortDirection = 'asc' | 'desc';

export function VendorsCardGrid({
  vendors,
  onVendorClick,
  onDeleteClick,
  onSave,
  filters,
  onFiltersChange,
  allVendors,
  user: propUser,
  isLoadingAuth,
  onAddVendor
}: VendorsCardGridProps) {
  const navigate = useNavigate();
  const {
    slugname
  } = useParams<{
    slugname: string;
  }>();
  const [sortField, setSortField] = useState<SortField>('company_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  
  // Use the user from props directly (auth is handled by parent)
  const currentUser = propUser;
  
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);
  
  const handleVendorClick = useCallback((vendor: Vendor) => {
    console.log('🚀 [VendorsCardGrid] handleVendorClick called:', {
      vendorId: vendor.id,
      vendorName: vendor.company_name,
      vendorSlug: vendor.slug,
      slugname,
      currentUrl: window.location.href,
      timestamp: new Date().toISOString()
    });

    // Always use the simplified URL structure
    const vendorDetailUrl = `/admin/vendors/${vendor.slug}`;
    
    console.log('🎯 [VendorsCardGrid] Navigating with simplified URL:', {
      from: window.location.href,
      to: vendorDetailUrl,
      vendorSlug: vendor.slug
    });
    
    navigate(vendorDetailUrl);
  }, [navigate]);
  
  const sortedVendors = useMemo(() => 
    sortVendors(vendors, sortField, sortDirection),
    [vendors, sortField, sortDirection]
  );
  
  return <div className="space-y-6">
      {/* Toolbar with Filters, Sort Controls, View Toggle and Add Vendor */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Filters Button */}
          {filters && onFiltersChange && allVendors && <VendorFilters filters={filters} onFiltersChange={onFiltersChange} vendors={allVendors} />}
          
          {/* Sort Controls */}
          {viewMode === 'card' && (
            <>
              <Button variant={sortField === 'company_name' ? 'default' : 'outline'} size="sm" onClick={() => handleSort('company_name')} className="gap-2">
                <Building className="h-4 w-4" />
                Company
                {sortField === 'company_name' && <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </Button>
              <Button variant={sortField === 'company_type' ? 'default' : 'outline'} size="sm" onClick={() => handleSort('company_type')}>
                Type
                {sortField === 'company_type' && <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </Button>
              <Button variant={sortField === 'founding_year' ? 'default' : 'outline'} size="sm" onClick={() => handleSort('founding_year')} className="gap-2">
                <Calendar className="h-4 w-4" />
                Founded
                {sortField === 'founding_year' && <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </Button>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          
          {/* Add Vendor Button */}
          {onAddVendor && <div>
              {isLoadingAuth ? <Button disabled size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Loading...
                </Button> : currentUser ? <Button onClick={onAddVendor} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Vendor
                </Button> : <Button onClick={() => alert('Please log in to add vendors')} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Vendor (Login Required)
                </Button>}
            </div>}
        </div>
      </div>

      {/* View Content - Card or Table */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedVendors.map(vendor => <EditableVendorCard key={vendor.id} vendor={vendor} onVendorClick={handleVendorClick} onDeleteClick={onDeleteClick} onSave={onSave} canEdit={!!currentUser} />)}
          {sortedVendors.length === 0 && <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  No vendors found matching your filters.
                </CardContent>
              </Card>
            </div>}
        </div>
      ) : (
        <VendorsTableView 
          vendors={sortedVendors}
          onVendorClick={handleVendorClick}
          onDeleteClick={onDeleteClick}
        />
      )}
    </div>;
}
