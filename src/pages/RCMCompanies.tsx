import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { VendorFilters } from '@/components/vendors/VendorFilters';
import { useVendors } from '@/hooks/useVendors';
import { type VendorFiltersState } from '@/types/vendor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Calendar } from 'lucide-react';
import { EditableVendorCard } from '@/components/vendors/EditableVendorCard';
import { VendorsTableView } from '@/components/vendors/VendorsTableView';
import { ViewToggle, type ViewMode } from '@/components/vendors/ViewToggle';

type SortField = 'company_name' | 'founding_year' | 'company_type';
type SortDirection = 'asc' | 'desc';

export default function RCMCompanies() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<VendorFiltersState>({});
  const [sortField, setSortField] = useState<SortField>('company_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  
  // Fetch all vendors and filter for RCM companies
  const { data: allVendors = [], isLoading, error } = useVendors();
  
  // Filter to show only published RCM companies
  const rcmCompanies = useMemo(() => {
    return allVendors.filter(vendor => 
      vendor.status === 'published' && 
      (vendor.core_services.some(service => 
        service.toLowerCase().includes('revenue cycle') || 
        service.toLowerCase().includes('rcm') ||
        service.toLowerCase().includes('billing') ||
        service.toLowerCase().includes('coding')
      ) ||
      vendor.specialties.some(specialty => 
        specialty.toLowerCase().includes('revenue cycle') || 
        specialty.toLowerCase().includes('rcm') ||
        specialty.toLowerCase().includes('billing') ||
        specialty.toLowerCase().includes('coding')
      ))
    );
  }, [allVendors]);

  // Apply additional filters
  const filteredCompanies = useMemo(() => {
    let filtered = rcmCompanies;

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(vendor => 
        vendor.company_name.toLowerCase().includes(query) ||
        vendor.description.toLowerCase().includes(query) ||
        vendor.headquarters.toLowerCase().includes(query)
      );
    }

    if (filters.companyType?.length) {
      filtered = filtered.filter(vendor => 
        filters.companyType!.includes(vendor.company_type)
      );
    }

    if (filters.specialties?.length) {
      filtered = filtered.filter(vendor => 
        vendor.specialties.some(specialty => 
          filters.specialties!.some(filterSpecialty => 
            specialty.toLowerCase().includes(filterSpecialty.toLowerCase())
          )
        )
      );
    }

    if (filters.services?.length) {
      filtered = filtered.filter(vendor => 
        vendor.core_services.some(service => 
          filters.services!.some(filterService => 
            service.toLowerCase().includes(filterService.toLowerCase())
          )
        )
      );
    }

    if (filters.customers?.length) {
      filtered = filtered.filter(vendor => 
        vendor.customers.some(customer => 
          filters.customers!.some(filterCustomer => 
            customer.toLowerCase().includes(filterCustomer.toLowerCase())
          )
        )
      );
    }

    if (filters.fundingRange?.length) {
      filtered = filtered.filter(vendor => {
        const fundingStr = vendor.total_funding;
        if (!fundingStr) return filters.fundingRange!.includes('no-funding');
        
        const fundingAmount = parseFloat(fundingStr.replace(/[$M,]/g, '')) * 1000000;
        
        return filters.fundingRange!.some(range => {
          switch (range) {
            case 'under-10m': return fundingAmount < 10000000;
            case '10m-50m': return fundingAmount >= 10000000 && fundingAmount < 50000000;
            case '50m-100m': return fundingAmount >= 50000000 && fundingAmount < 100000000;
            case 'over-100m': return fundingAmount >= 100000000;
            case 'no-funding': return !fundingStr;
            default: return true;
          }
        });
      });
    }

    return filtered;
  }, [rcmCompanies, filters]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleVendorClick = (vendor: any) => {
    navigate(`/rcmcompanies/${vendor.slug}`);
  };

  // Sort companies
  const sortedCompanies = useMemo(() => {
    return [...filteredCompanies].sort((a, b) => {
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
  }, [filteredCompanies, sortField, sortDirection]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">Loading RCM companies...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Error Loading RCM Companies</h1>
                <p className="text-muted-foreground">
                  Unable to load RCM company data. Please try again later.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Revenue Cycle Management (RCM) Companies
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Showing {sortedCompanies.length} of {rcmCompanies.length} companies
            </p>
          </div>

          {/* Toolbar with Filters and Sort Controls */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Filters Button */}
              <VendorFilters 
                filters={filters} 
                onFiltersChange={setFilters} 
                vendors={rcmCompanies} 
              />
              
              {/* Sort Controls */}
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
            
            {/* View Toggle */}
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>

          {/* Content View */}
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedCompanies.map(vendor => (
                <EditableVendorCard 
                  key={vendor.id} 
                  vendor={vendor} 
                  onVendorClick={handleVendorClick}
                  canEdit={false} // Read-only for public view
                />
              ))}
              
              {sortedCompanies.length === 0 && (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      No RCM companies found matching your filters.
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <VendorsTableView 
              vendors={sortedCompanies}
              onVendorClick={handleVendorClick}
              // No onDeleteClick for public view - removes delete functionality
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}