import { useState, useMemo, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { VendorsCardGrid } from '@/components/vendors/VendorsCardGrid';
import { VendorFilters } from '@/components/vendors/VendorFilters';
import { AddVendorModal } from '@/components/vendors/AddVendorModal';
import { useVendors } from '@/hooks/useVendors';
import { VENDOR_CATEGORIES, type VendorFiltersState, type VendorCategory } from '@/types/vendor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
export default function VendorsIndex() {
  const [filters, setFilters] = useState<VendorFiltersState>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<any>(null);
  const {
    toast
  } = useToast();

  // Fetch vendors from database
  const {
    data: allVendors = [],
    isLoading,
    error,
    refetch
  } = useVendors();

  // Enhanced authentication handling
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: {
            user
          },
          error
        } = await supabase.auth.getUser();
        console.log('Auth check result:', {
          user: user?.id,
          error
        });
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    fetchUser();

    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Helper function to determine vendor category
  const getVendorCategory = (vendor: any): VendorCategory => {
    const services = vendor.core_services?.join(' ').toLowerCase() || '';
    const specialties = vendor.specialties?.join(' ').toLowerCase() || '';
    const description = vendor.description?.toLowerCase() || '';
    const companyType = vendor.company_type?.toLowerCase() || '';
    if (services.includes('revenue cycle') || services.includes('rcm') || specialties.includes('revenue cycle')) {
      return 'rcm';
    }
    if (services.includes('healthcare') || specialties.includes('healthcare') || description.includes('healthcare')) {
      return 'healthcare';
    }
    if (services.includes('fintech') || services.includes('financial') || specialties.includes('fintech')) {
      return 'fintech';
    }
    if (services.includes('saas') || companyType.includes('saas') || description.includes('software as a service')) {
      return 'saas';
    }
    if (services.includes('ai') || services.includes('artificial intelligence') || specialties.includes('ai')) {
      return 'ai';
    }
    if (services.includes('cybersecurity') || services.includes('security') || specialties.includes('cybersecurity')) {
      return 'cybersecurity';
    }
    if (services.includes('education') || services.includes('edtech') || specialties.includes('education')) {
      return 'edtech';
    }
    if (services.includes('hr') || services.includes('human resources') || specialties.includes('hr')) {
      return 'hrtech';
    }

    // Default to healthcare for most companies
    return 'healthcare';
  };

  // Apply filters including category filtering
  const filteredVendors = useMemo(() => {
    let filtered = allVendors;
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(vendor => vendor.company_name.toLowerCase().includes(query) || vendor.description.toLowerCase().includes(query) || vendor.headquarters.toLowerCase().includes(query) || getVendorCategory(vendor).toLowerCase().includes(query) || VENDOR_CATEGORIES[getVendorCategory(vendor)].title.toLowerCase().includes(query));
    }
    if (filters.companyType?.length) {
      filtered = filtered.filter(vendor => filters.companyType!.includes(vendor.company_type));
    }
    if (filters.specialties?.length) {
      filtered = filtered.filter(vendor => vendor.specialties.some(specialty => filters.specialties!.some(filterSpecialty => specialty.toLowerCase().includes(filterSpecialty.toLowerCase()))));
    }
    if (filters.services?.length) {
      filtered = filtered.filter(vendor => vendor.core_services.some(service => filters.services!.some(filterService => service.toLowerCase().includes(filterService.toLowerCase()))));
    }
    if (filters.customers?.length) {
      filtered = filtered.filter(vendor => vendor.customers.some(customer => filters.customers!.some(filterCustomer => customer.toLowerCase().includes(filterCustomer.toLowerCase()))));
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

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats: Record<VendorCategory, number> = {
      rcm: 0,
      healthcare: 0,
      fintech: 0,
      saas: 0,
      ai: 0,
      cybersecurity: 0,
      edtech: 0,
      hrtech: 0
    };
    filteredVendors.forEach(vendor => {
      const category = getVendorCategory(vendor);
      stats[category]++;
    });
    return stats;
  }, [filteredVendors]);
  const handleVendorAdded = () => {
    refetch();
  };
  const handleVendorSaved = () => {
    refetch();
  };
  const handleDeleteVendor = (vendor: any) => {
    setVendorToDelete(vendor);
    setDeleteModalOpen(true);
  };
  const confirmDeleteVendor = async () => {
    if (!vendorToDelete) return;
    try {
      console.log('Attempting to delete vendor:', vendorToDelete.id, 'User ID:', user?.id);
      const {
        data,
        error
      } = await supabase.from('vendors').delete().eq('id', vendorToDelete.id).select('*');
      console.log('Delete result:', {
        data,
        error
      });
      if (error) {
        console.error('Supabase delete error:', error);
        if (error.code === 'PGRST116') {
          toast({
            title: "Permission Denied",
            description: "You can only delete vendors you created.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to delete vendor: ${error.message}`,
            variant: "destructive"
          });
        }
        return;
      }
      if (!data || data.length === 0) {
        toast({
          title: "Not Found",
          description: "Vendor not found or you do not have permission to delete it.",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Success",
        description: "Vendor deleted successfully!"
      });
      refetch();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to delete vendor: Network or unexpected error",
        variant: "destructive"
      });
    } finally {
      setDeleteModalOpen(false);
      setVendorToDelete(null);
    }
  };
  if (isLoading) {
    return <PageLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">Loading vendors...</div>
        </div>
      </PageLayout>;
  }
  if (error) {
    return <PageLayout>
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
      </PageLayout>;
  }
  return <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div>
            
            
            
            

            {/* Category Statistics */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(categoryStats).map(([category, count]) => count > 0 && <Badge key={category} variant="secondary" className="text-xs">
                    {VENDOR_CATEGORIES[category as VendorCategory].title.replace(' Companies', '')}: {count}
                  </Badge>)}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <VendorFilters filters={filters} onFiltersChange={setFilters} vendors={allVendors} />
            {isLoadingAuth ? <Button disabled className="gap-2">
                <Plus className="h-4 w-4" />
                Loading...
              </Button> : user ? <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Vendor
              </Button> : <Button onClick={() => alert('Please log in to add vendors')} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Vendor (Login Required)
              </Button>}
          </div>

          <VendorsCardGrid vendors={filteredVendors.map(vendor => ({
          ...vendor,
          category: getVendorCategory(vendor)
        }))} onDeleteClick={handleDeleteVendor} onSave={handleVendorSaved} />
        </div>
        
        <AddVendorModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onVendorAdded={handleVendorAdded} />

        <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{vendorToDelete?.company_name}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteVendor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>;
}