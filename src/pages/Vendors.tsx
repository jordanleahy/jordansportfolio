
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { VendorsTable } from '@/components/vendors/VendorsTable';
import { VendorFilters } from '@/components/vendors/VendorFilters';
import { VendorModal } from '@/components/vendors/VendorModal';
import { RCM_SAMPLE_DATA, type Vendor, type VendorFilters } from '@/types/vendor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CATEGORY_TITLES: Record<string, string> = {
  rcm: 'Revenue Cycle Management (RCM) Companies'
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  rcm: 'Comprehensive analysis of RCM vendors, their capabilities, funding, and market positioning for competitive intelligence research.'
};

export default function Vendors() {
  const { slugname } = useParams<{ slugname: string }>();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [filters, setFilters] = useState<VendorFilters>({});

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
        vendor.companyName.toLowerCase().includes(query) ||
        vendor.description.toLowerCase().includes(query) ||
        vendor.headquarters.toLowerCase().includes(query)
      );
    }

    if (filters.companyType?.length) {
      filtered = filtered.filter(vendor =>
        filters.companyType!.includes(vendor.companyType)
      );
    }

    if (filters.specialties?.length) {
      filtered = filtered.filter(vendor =>
        vendor.specialtyFocus.some(specialty =>
          filters.specialties!.some(filterSpecialty =>
            specialty.toLowerCase().includes(filterSpecialty.toLowerCase())
          )
        )
      );
    }

    if (filters.services?.length) {
      filtered = filtered.filter(vendor =>
        vendor.coreServices.some(service =>
          filters.services!.some(filterService =>
            service.toLowerCase().includes(filterService.toLowerCase())
          )
        )
      );
    }

    if (filters.customers?.length) {
      filtered = filtered.filter(vendor =>
        vendor.targetCustomers.some(customer =>
          filters.customers!.some(filterCustomer =>
            customer.toLowerCase().includes(filterCustomer.toLowerCase())
          )
        )
      );
    }

    if (filters.fundingRange?.length) {
      filtered = filtered.filter(vendor => {
        const funding = vendor.fundingRaised || 0;
        return filters.fundingRange!.some(range => {
          switch (range) {
            case 'under-10m': return funding < 10000000;
            case '10m-50m': return funding >= 10000000 && funding < 50000000;
            case '50m-100m': return funding >= 50000000 && funding < 100000000;
            case 'over-100m': return funding >= 100000000;
            case 'no-funding': return funding === 0;
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
                onVendorClick={setSelectedVendor}
              />
            </div>
          </div>
        </div>
      </div>

      {selectedVendor && (
        <VendorModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </PageLayout>
  );
}
