
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VendorPageLayout } from '@/components/vendors/VendorPageLayout';
import { VendorsCardGrid } from '@/components/vendors/VendorsCardGrid';
import { AddVendorModal } from '@/components/vendors/AddVendorModal';
import { VendorDeleteDialog } from '@/components/vendors/VendorDeleteDialog';
import { useVendorPageProvider } from '@/hooks/useVendorPageProvider';
import { useVendorActionsProvider } from '@/hooks/useVendorActionsProvider';
import { useVendorFiltersProvider } from '@/hooks/useVendorFiltersProvider';
import { VENDOR_CATEGORIES, type VendorCategory } from '@/types/vendor';

export default function VendorsIndex() {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Use the new provider hooks
  const {
    user,
    isLoadingAuth,
    allVendors,
    isLoadingVendors,
    vendorsError,
    refetchVendors,
    handleVendorAdded,
    handleVendorSaved
  } = useVendorPageProvider();

  const {
    deleteModalOpen,
    setDeleteModalOpen,
    vendorToDelete,
    handleDeleteVendor,
    confirmDeleteVendor
  } = useVendorActionsProvider(refetchVendors);

  const {
    filters,
    setFilters,
    filteredVendors
  } = useVendorFiltersProvider(allVendors);

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

  const handleVendorClick = (vendor: any) => {
    const category = getVendorCategory(vendor);
    const vendorDetailUrl = `/vendors/${category}/${vendor.slug}`;
    console.log('Navigating to vendor detail:', vendorDetailUrl);
    navigate(vendorDetailUrl);
  };

  return (
    <VendorPageLayout
      title="All Vendors"
      subtitle={`Showing ${filteredVendors.length} of ${allVendors.length} vendors`}
      isLoading={isLoadingVendors}
      error={vendorsError}
    >
      <div className="space-y-6">
        <VendorsCardGrid 
          vendors={filteredVendors.map(vendor => ({
            ...vendor,
            category: getVendorCategory(vendor)
          }))} 
          onVendorClick={handleVendorClick}
          onDeleteClick={handleDeleteVendor} 
          onSave={handleVendorSaved}
          filters={filters}
          onFiltersChange={setFilters}
          allVendors={allVendors}
          user={user}
          isLoadingAuth={isLoadingAuth}
          onAddVendor={() => setIsAddModalOpen(true)}
        />
      </div>
      
      <AddVendorModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onVendorAdded={handleVendorAdded} 
      />

      <VendorDeleteDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        vendor={vendorToDelete}
        onConfirm={confirmDeleteVendor}
      />
    </VendorPageLayout>
  );
}
