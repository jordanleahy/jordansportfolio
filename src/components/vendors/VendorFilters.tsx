
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type Vendor, type VendorFiltersState } from '@/types/vendor';

interface VendorFiltersProps {
  filters: VendorFiltersState;
  onFiltersChange: (filters: VendorFiltersState) => void;
  vendors: Vendor[];
}

export function VendorFilters({ filters, onFiltersChange, vendors }: VendorFiltersProps) {
  const updateFilters = (key: keyof VendorFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleCheckboxChange = (key: keyof VendorFiltersState, value: string, checked: boolean) => {
    const currentValues = filters[key] as string[] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    updateFilters(key, newValues.length > 0 ? newValues : undefined);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  // Extract unique values for filter options
  const companyTypes = [...new Set(vendors.map(v => v.company_type))];
  const allServices = [...new Set(vendors.flatMap(v => v.core_services))];
  const allCustomers = [...new Set(vendors.flatMap(v => v.customers))];
  const allSpecialties = [...new Set(vendors.flatMap(v => v.specialties))];

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value
  );

  return (
    <Card className="sticky top-4 hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search companies..."
              value={filters.searchQuery || ''}
              onChange={(e) => updateFilters('searchQuery', e.target.value || undefined)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Company Type */}
        <div className="space-y-3">
          <Label>Company Type</Label>
          <div className="space-y-2">
            {companyTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.companyType?.includes(type) || false}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('companyType', type, checked as boolean)
                  }
                />
                <Label htmlFor={`type-${type}`} className="text-sm font-normal">
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Funding Range */}
        <div className="space-y-3">
          <Label>Funding Range</Label>
          <div className="space-y-2">
            {[
              { value: 'no-funding', label: 'No Funding' },
              { value: 'under-10m', label: 'Under $10M' },
              { value: '10m-50m', label: '$10M - $50M' },
              { value: '50m-100m', label: '$50M - $100M' },
              { value: 'over-100m', label: 'Over $100M' }
            ].map((range) => (
              <div key={range.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`funding-${range.value}`}
                  checked={filters.fundingRange?.includes(range.value) || false}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('fundingRange', range.value, checked as boolean)
                  }
                />
                <Label htmlFor={`funding-${range.value}`} className="text-sm font-normal">
                  {range.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Core Services */}
        <div className="space-y-3">
          <Label>Core Services</Label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {allServices.slice(0, 8).map((service) => (
              <div key={service} className="flex items-center space-x-2">
                <Checkbox
                  id={`service-${service}`}
                  checked={filters.services?.includes(service) || false}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('services', service, checked as boolean)
                  }
                />
                <Label htmlFor={`service-${service}`} className="text-sm font-normal">
                  {service}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Target Customers */}
        <div className="space-y-3">
          <Label>Target Customers</Label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {allCustomers.slice(0, 8).map((customer) => (
              <div key={customer} className="flex items-center space-x-2">
                <Checkbox
                  id={`customer-${customer}`}
                  checked={filters.customers?.includes(customer) || false}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('customers', customer, checked as boolean)
                  }
                />
                <Label htmlFor={`customer-${customer}`} className="text-sm font-normal">
                  {customer}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Specialties */}
        <div className="space-y-3">
          <Label>Specialties</Label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {allSpecialties.slice(0, 8).map((specialty) => (
              <div key={specialty} className="flex items-center space-x-2">
                <Checkbox
                  id={`specialty-${specialty}`}
                  checked={filters.specialties?.includes(specialty) || false}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('specialties', specialty, checked as boolean)
                  }
                />
                <Label htmlFor={`specialty-${specialty}`} className="text-sm font-normal">
                  {specialty}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
