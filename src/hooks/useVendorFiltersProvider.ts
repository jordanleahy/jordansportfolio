
import { useState, useMemo } from 'react';
import type { Vendor, VendorFiltersState } from '@/types/vendor';

export const useVendorFiltersProvider = (allVendors: Vendor[]) => {
  const [filters, setFilters] = useState<VendorFiltersState>({});

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
            case 'under-10m':
              return fundingAmount < 10000000;
            case '10m-50m':
              return fundingAmount >= 10000000 && fundingAmount < 50000000;
            case '50m-100m':
              return fundingAmount >= 50000000 && fundingAmount < 100000000;
            case 'over-100m':
              return fundingAmount >= 100000000;
            case 'no-funding':
              return !fundingStr;
            default:
              return true;
          }
        });
      });
    }

    return filtered;
  }, [allVendors, filters]);

  return {
    filters,
    setFilters,
    filteredVendors
  };
};
