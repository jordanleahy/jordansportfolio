import type { Vendor, VendorCategory } from '@/types/vendor';

// Memoized category calculation to avoid recalculating for each vendor
const categoryCache = new Map<string, VendorCategory>();

export const getVendorCategory = (vendor: Vendor): VendorCategory => {
  const cacheKey = `${vendor.id}-${vendor.company_name}`;
  
  if (categoryCache.has(cacheKey)) {
    return categoryCache.get(cacheKey)!;
  }

  const services = vendor.core_services?.join(' ').toLowerCase() || '';
  const specialties = vendor.specialties?.join(' ').toLowerCase() || '';
  const description = vendor.description?.toLowerCase() || '';
  const companyType = vendor.company_type?.toLowerCase() || '';
  
  let category: VendorCategory;

  if (services.includes('revenue cycle') || services.includes('rcm') || specialties.includes('revenue cycle')) {
    category = 'rcm';
  } else if (services.includes('healthcare') || specialties.includes('healthcare') || description.includes('healthcare')) {
    category = 'healthcare';
  } else if (services.includes('fintech') || services.includes('financial') || specialties.includes('fintech')) {
    category = 'fintech';
  } else if (services.includes('saas') || companyType.includes('saas') || description.includes('software as a service')) {
    category = 'saas';
  } else if (services.includes('ai') || services.includes('artificial intelligence') || specialties.includes('ai')) {
    category = 'ai';
  } else if (services.includes('cybersecurity') || services.includes('security') || specialties.includes('cybersecurity')) {
    category = 'cybersecurity';
  } else if (services.includes('education') || services.includes('edtech') || specialties.includes('education')) {
    category = 'edtech';
  } else if (services.includes('hr') || services.includes('human resources') || specialties.includes('hr')) {
    category = 'hrtech';
  } else {
    // Default to healthcare for most companies
    category = 'healthcare';
  }

  // Cache the result
  categoryCache.set(cacheKey, category);
  return category;
};

// Shared sorting utility
export const sortVendors = <T extends Vendor>(
  vendors: T[], 
  sortField: keyof T, 
  sortDirection: 'asc' | 'desc'
): T[] => {
  return [...vendors].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    
    if (sortField === 'updated_at') {
      // Convert date strings to Date objects for proper comparison
      aVal = new Date(aVal as string);
      bVal = new Date(bVal as string);
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
};

// Format date utility
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Extract unique filter options from vendors
export const extractFilterOptions = (vendors: Vendor[]) => {
  const companyTypes = [...new Set(vendors.map(v => v.company_type))].filter(Boolean);
  const allServices = [...new Set(vendors.flatMap(v => v.core_services))].filter(Boolean);
  const allCustomers = [...new Set(vendors.flatMap(v => v.customers))].filter(Boolean);
  const allSpecialties = [...new Set(vendors.flatMap(v => v.specialties))].filter(Boolean);

  return {
    companyTypes,
    allServices,
    allCustomers,
    allSpecialties
  };
};

// Clear category cache (useful if vendor data changes significantly)
export const clearCategoryCache = (): void => {
  categoryCache.clear();
};