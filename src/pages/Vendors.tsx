import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { VendorsTable } from '@/components/vendors/VendorsTable';
import { VendorFilters } from '@/components/vendors/VendorFilters';
import { AddVendorModal } from '@/components/vendors/AddVendorModal';
import { useVendors } from '@/hooks/useVendors';
import { VENDOR_CATEGORIES, type VendorFiltersState } from '@/types/vendor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Vendors() {
  const { slugname } = useParams<{ slugname: string }>();
  const [filters, setFilters] = useState<VendorFiltersState>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  // Fetch vendors from database
  const { data: allVendors = [], isLoading, error, refetch } = useVendors();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Apply filters
  const filteredVendors = useMemo(() => {
    let filtered = allVendors;

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
  }, [allVendors, filters]);

  const handleVendorAdded = () => {
    refetch();
  };

  const handleDeleteVendor = async (vendor: any) => {
    if (window.confirm(`Are you sure you want to delete ${vendor.company_name}?`)) {
      try {
        console.log('Attempting to delete vendor:', vendor.id, 'User ID:', user?.id);
        
        const { data, error, count } = await supabase
          .from('vendors')
          .delete()
          .eq('id', vendor.id)
          .select('*');
        
        console.log('Delete result:', { data, error, count });
        
        if (error) {
          console.error('Supabase delete error:', error);
          if (error.code === 'PGRST116') {
            alert('You can only delete vendors you created. This vendor was created by another user.');
          } else {
            alert(`Failed to delete vendor: ${error.message}`);
          }
          return;
        }
        
        if (!data || data.length === 0) {
          alert('Vendor not found or you do not have permission to delete it.');
          return;
        }
        
        alert('Vendor deleted successfully!');
        refetch();
      } catch (error) {
        console.error('Error deleting vendor:', error);
        alert('Failed to delete vendor: Network or unexpected error');
      }
    }
  };

  if (!slugname || !VENDOR_CATEGORIES[slugname as keyof typeof VENDOR_CATEGORIES]) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Category Not Found</h1>
                <p className="text-muted-foreground">
                  The vendor category "{slugname}" does not exist.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const categoryConfig = VENDOR_CATEGORIES[slugname as keyof typeof VENDOR_CATEGORIES];

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">Loading vendors...</div>
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
                <h1 className="text-2xl font-bold mb-2">Error Loading Vendors</h1>
                <p className="text-muted-foreground">
                  Unable to load vendor data. Please try again later.
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {categoryConfig.title}
              </h1>
              <p className="text-muted-foreground mt-2">
                {categoryConfig.description}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {filteredVendors.length} of {allVendors.length} vendors
              </p>
            </div>
            {user && (
              <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Vendor
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <VendorFilters
                filters={filters}
                onFiltersChange={setFilters}
                vendors={allVendors}
              />
            </div>

            <div className="lg:col-span-3">
              <VendorsTable
                vendors={filteredVendors}
                onAddClick={() => setIsAddModalOpen(true)}
                onDeleteClick={handleDeleteVendor}
              />
            </div>
          </div>
        </div>
        
        <AddVendorModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)}
          onVendorAdded={handleVendorAdded}
        />
      </div>
    </PageLayout>
  );
}
