
import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { VendorPageLayout } from '@/components/vendors/VendorPageLayout';
import { VendorsCardGrid } from '@/components/vendors/VendorsCardGrid';
import { AddVendorModal } from '@/components/vendors/AddVendorModal';
import { VendorDeleteDialog } from '@/components/vendors/VendorDeleteDialog';
import { VendorExportButton } from '@/components/VendorExportButton';
import { useVendorsPageOptimized } from '@/hooks/useVendorsPageOptimized';
import { getVendorCategory } from '@/utils/vendorUtils';

export default function VendorsIndex() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Use the optimized provider hook
  const {
    user,
    isLoadingAuth,
    allVendors,
    filteredVendors,
    isLoadingVendors,
    vendorsError,
    filters,
    setFilters,
    handleVendorAdded,
    handleVendorSaved,
    handleDeleteVendor,
    deleteModalOpen,
    setDeleteModalOpen,
    vendorToDelete,
    confirmDeleteVendor
  } = useVendorsPageOptimized();

  const handleVendorClick = useCallback((vendor: any) => {
    const category = getVendorCategory(vendor);
    const baseUrl = isAdminView ? '/admin/vendors' : '/vendors';
    const vendorDetailUrl = `${baseUrl}/${category}/${vendor.slug}`;
    navigate(vendorDetailUrl);
  }, [navigate, isAdminView]);

  return (
    <VendorPageLayout
      title="All Vendors"
      subtitle={`Showing ${filteredVendors.length} of ${allVendors.length} vendors`}
      isLoading={isLoadingVendors}
      error={vendorsError}
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <VendorExportButton />
        </div>
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
          onAddVendor={isAdminView ? () => setIsAddModalOpen(true) : undefined}
          readOnly={!isAdminView}
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
