
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { VendorsTable } from '@/components/vendors/VendorsTable';
import { VendorFilters } from '@/components/vendors/VendorFilters';
import { RCM_SAMPLE_DATA, type Vendor, type VendorFiltersState } from '@/types/vendor';
import { Card, CardContent } from '@/components/ui/card';

const CATEGORY_TITLES: Record<string, string> = {
  rcm: 'Revenue Cycle Management (RCM) Companies'
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  rcm: 'Comprehensive analysis of RCM vendors, their capabilities, funding, and market positioning for competitive intelligence research.'
};

export default function Vendors() {
  const { slugname } = useParams<{ slugname: string }>();
  const [filters, setFilters] = useState<VendorFiltersState>({});

  // Get data based on category
  const allVendors = useMemo(() => {
    switch (slugname) {
      case 'rcm':
        return RCM_SAMPLE_DATA;
      default:
        return [];
    }
  }, [slugname]);

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
        // Parse funding from string like "$47M" or "$34.1M"
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

  if (!slugname || !CATEGORY_TITLES[slugname]) {
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

  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {CATEGORY_TITLES[slugname]}
            </h1>
            <p className="text-muted-foreground mt-2">
              {CATEGORY_DESCRIPTIONS[slugname]}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Showing {filteredVendors.length} of {allVendors.length} vendors
            </p>
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
              />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
