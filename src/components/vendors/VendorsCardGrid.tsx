
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
  readOnly?: boolean;
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
  onAddVendor,
  readOnly = false
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

    // Use admin or public URL based on readOnly mode
    const isAdminView = window.location.pathname.startsWith('/admin');
    const vendorDetailUrl = isAdminView 
      ? `/admin/vendors/${vendor.slug}`
      : `/vendors/${slugname || 'all'}/${vendor.slug}`;
    
    console.log('🎯 [VendorsCardGrid] Navigating with URL:', {
      from: window.location.href,
      to: vendorDetailUrl,
      vendorSlug: vendor.slug,
      isAdminView,
      readOnly
    });
    
    navigate(vendorDetailUrl);
  }, [navigate, slugname, readOnly]);
  
  const sortedVendors = useMemo(() => 
    sortVendors(vendors, sortField, sortDirection),
    [vendors, sortField, sortDirection]
  );
  
  return <div className="space-y-8">
      {/* Toolbar with clear visual hierarchy */}
      <div className="bg-card border rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Primary Actions - Filtering & Sorting */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Filters - Primary control */}
            {filters && onFiltersChange && allVendors && (
              <div className="mr-2">
                <VendorFilters filters={filters} onFiltersChange={onFiltersChange} vendors={allVendors} />
              </div>
            )}
            
            {/* Sort Controls - Secondary */}
            {viewMode === 'card' && (
              <div className="flex gap-1.5 items-center">
                <span className="text-sm text-muted-foreground mr-1">Sort:</span>
                <Button 
                  variant={sortField === 'company_name' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => handleSort('company_name')} 
                  className="gap-1.5 h-8"
                >
                  <Building className="h-3.5 w-3.5" />
                  Company
                  {sortField === 'company_name' && <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </Button>
                <Button 
                  variant={sortField === 'company_type' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => handleSort('company_type')}
                  className="h-8"
                >
                  Type
                  {sortField === 'company_type' && <span className="text-xs ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </Button>
                <Button 
                  variant={sortField === 'founding_year' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => handleSort('founding_year')} 
                  className="gap-1.5 h-8"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Founded
                  {sortField === 'founding_year' && <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </Button>
              </div>
            )}
          </div>
          
          {/* Secondary Actions - View & Add */}
          <div className="flex items-center gap-3">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            
            {/* Add Vendor - Primary CTA */}
            {!readOnly && onAddVendor && (
              <div>
                {isLoadingAuth ? (
                  <Button disabled size="default" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Loading...
                  </Button>
                ) : currentUser ? (
                  <Button onClick={onAddVendor} size="default" className="gap-2 shadow-sm">
                    <Plus className="h-4 w-4" />
                    Add Vendor
                  </Button>
                ) : (
                  <Button 
                    onClick={() => alert('Please log in to add vendors')} 
                    variant="outline" 
                    size="default" 
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Vendor
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Content - Card or Table */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedVendors.map(vendor => <EditableVendorCard key={vendor.id} vendor={vendor} onVendorClick={handleVendorClick} onDeleteClick={readOnly ? undefined : onDeleteClick} onSave={readOnly ? undefined : onSave} canEdit={!readOnly && !!currentUser} />)}
          {sortedVendors.length === 0 && <div className="col-span-full">
              <Card className="border-dashed">
                <CardContent className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-2">No vendors found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                </CardContent>
              </Card>
            </div>}
        </div>
      ) : (
        <VendorsTableView 
          vendors={sortedVendors}
          onVendorClick={handleVendorClick}
          onDeleteClick={readOnly ? undefined : onDeleteClick}
        />
      )}
    </div>;
}
