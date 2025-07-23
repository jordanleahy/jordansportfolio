
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { VendorPageLayout } from '@/components/vendors/VendorPageLayout';
import { VendorsCardGrid } from '@/components/vendors/VendorsCardGrid';
import { AddVendorModal } from '@/components/vendors/AddVendorModal';
import { VendorDeleteDialog } from '@/components/vendors/VendorDeleteDialog';
import { useVendorPageProvider } from '@/hooks/useVendorPageProvider';
import { useVendorActionsProvider } from '@/hooks/useVendorActionsProvider';
import { useVendorFiltersProvider } from '@/hooks/useVendorFiltersProvider';
import { VENDOR_CATEGORIES } from '@/types/vendor';

export default function Vendors() {
  const { slugname } = useParams<{ slugname: string }>();
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

  // Validate category
  if (!slugname || !VENDOR_CATEGORIES[slugname as keyof typeof VENDOR_CATEGORIES]) {
    return (
      <VendorPageLayout
        title="Category Not Found"
        error={`The vendor category "${slugname}" does not exist.`}
      >
        <div />
      </VendorPageLayout>
    );
  }
  
  const categoryConfig = VENDOR_CATEGORIES[slugname as keyof typeof VENDOR_CATEGORIES];
  
  return (
    <VendorPageLayout
      title={categoryConfig.title}
      subtitle={`Showing ${filteredVendors.length} of ${allVendors.length} vendors`}
      isLoading={isLoadingVendors}
      error={vendorsError}
    >
      <div className="space-y-6">
        <VendorsCardGrid 
          vendors={filteredVendors} 
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
