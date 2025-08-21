import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVendors } from '@/hooks/useVendors';
import { useDebounce } from 'use-debounce';
import type { User } from '@supabase/supabase-js';
import type { Vendor, VendorFiltersState } from '@/types/vendor';

export const useVendorsPageOptimized = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [filters, setFilters] = useState<VendorFiltersState>({});
  const { toast } = useToast();

  // Debounce search query to prevent excessive filtering
  const [debouncedSearchQuery] = useDebounce(filters.searchQuery, 300);

  // Fetch vendors from database
  const {
    data: allVendors = [],
    isLoading: isLoadingVendors,
    error: vendorsError,
    refetch: refetchVendors
  } = useVendors();

  // Enhanced authentication handling
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('Auth check result:', { user: user?.id, error });
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Memoized filtered vendors with optimized single-pass filtering
  const filteredVendors = useMemo(() => {
    let filtered = allVendors;

    // Apply search query (using debounced value)
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(vendor => 
        vendor.company_name.toLowerCase().includes(query) ||
        vendor.description.toLowerCase().includes(query) ||
        vendor.headquarters.toLowerCase().includes(query)
      );
    }

    // Apply all other filters in single pass
    if (filters.companyType?.length || 
        filters.specialties?.length || 
        filters.services?.length || 
        filters.customers?.length || 
        filters.fundingRange?.length) {
      
      filtered = filtered.filter(vendor => {
        // Company type filter
        if (filters.companyType?.length && 
            !filters.companyType.includes(vendor.company_type)) {
          return false;
        }

        // Specialties filter
        if (filters.specialties?.length && 
            !vendor.specialties.some(specialty => 
              filters.specialties!.some(filterSpecialty => 
                specialty.toLowerCase().includes(filterSpecialty.toLowerCase())
              )
            )) {
          return false;
        }

        // Services filter
        if (filters.services?.length && 
            !vendor.core_services.some(service => 
              filters.services!.some(filterService => 
                service.toLowerCase().includes(filterService.toLowerCase())
              )
            )) {
          return false;
        }

        // Customers filter
        if (filters.customers?.length && 
            !vendor.customers.some(customer => 
              filters.customers!.some(filterCustomer => 
                customer.toLowerCase().includes(filterCustomer.toLowerCase())
              )
            )) {
          return false;
        }

        // Funding range filter
        if (filters.fundingRange?.length) {
          const fundingStr = vendor.total_funding;
          if (!fundingStr && !filters.fundingRange.includes('no-funding')) {
            return false;
          }
          
          if (fundingStr) {
            const fundingAmount = parseFloat(fundingStr.replace(/[$M,]/g, '')) * 1000000;
            const matchesFunding = filters.fundingRange.some(range => {
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
                  return false; // Already handled above
                default:
                  return true;
              }
            });
            if (!matchesFunding) return false;
          }
        }

        return true;
      });
    }

    return filtered;
  }, [allVendors, debouncedSearchQuery, filters]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleVendorAdded = useCallback(() => {
    refetchVendors();
    toast({
      title: "Success",
      description: "Vendor added successfully!",
    });
  }, [refetchVendors, toast]);

  const handleVendorSaved = useCallback(() => {
    refetchVendors();
    toast({
      title: "Success", 
      description: "Vendor updated successfully!",
    });
  }, [refetchVendors, toast]);

  const handleDeleteVendor = useCallback((vendor: Vendor) => {
    setVendorToDelete(vendor);
    setDeleteModalOpen(true);
  }, []);

  const confirmDeleteVendor = useCallback(async () => {
    if (!vendorToDelete) return;

    try {
      console.log('Attempting to delete vendor:', vendorToDelete.id);
      const { data, error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorToDelete.id)
        .select('*');
        
      console.log('Delete result:', { data, error });
      
      if (error) {
        console.error('Supabase delete error:', error);
        if (error.code === 'PGRST116') {
          toast({
            title: "Permission Denied",
            description: "You can only delete vendors you created.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to delete vendor: ${error.message}`,
            variant: "destructive",
          });
        }
        return;
      }
      
      if (!data || data.length === 0) {
        toast({
          title: "Not Found",
          description: "Vendor not found or you do not have permission to delete it.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Vendor deleted successfully!",
      });
      refetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to delete vendor: Network or unexpected error",
        variant: "destructive",
      });
    } finally {
      setDeleteModalOpen(false);
      setVendorToDelete(null);
    }
  }, [vendorToDelete, refetchVendors, toast]);

  const setFiltersOptimized = useCallback((newFilters: VendorFiltersState) => {
    setFilters(newFilters);
  }, []);

  return {
    // Auth state
    user,
    isLoadingAuth,
    
    // Vendor data
    allVendors,
    filteredVendors,
    isLoadingVendors,
    vendorsError: vendorsError?.message || null,
    refetchVendors,
    
    // Filter state
    filters,
    setFilters: setFiltersOptimized,
    
    // Action handlers
    handleVendorAdded,
    handleVendorSaved,
    handleDeleteVendor,
    
    // Delete modal state
    deleteModalOpen,
    setDeleteModalOpen,
    vendorToDelete,
    confirmDeleteVendor,
    
    // Toast utility
    toast
  };
};