
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { VendorPageLayout } from '@/components/vendors/VendorPageLayout';
import { VendorsCardGrid } from '@/components/vendors/VendorsCardGrid';
import { AddVendorModal } from '@/components/vendors/AddVendorModal';
import { VendorDeleteDialog } from '@/components/vendors/VendorDeleteDialog';
import { useVendorsPageOptimized } from '@/hooks/useVendorsPageOptimized';
import { VENDOR_CATEGORIES } from '@/types/vendor';
import { useVendorBySlug } from '@/hooks/useVendors';
import { getVendorCategory } from '@/utils/vendorUtils';

export default function Vendors() {
  const { slugname } = useParams<{ slugname: string }>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const isValidCategory = !!slugname && !!(VENDOR_CATEGORIES as any)[slugname as keyof typeof VENDOR_CATEGORIES];

  const { data: vendorBySlug, isLoading: isLoadingVendorLookup } = useVendorBySlug(slugname || '');

  useEffect(() => {
    if (!isValidCategory && vendorBySlug) {
      const category = getVendorCategory(vendorBySlug);
      const base = location.pathname.startsWith('/admin/') ? '/admin/vendors' : '/vendors';
      navigate(`${base}/${category}/${vendorBySlug.slug}`, { replace: true });
    }
  }, [isValidCategory, vendorBySlug, navigate, location]);

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

  // Validate category or redirect if slug is a vendor
  if (!isValidCategory) {
    // While checking if this slug is actually a vendor, show loading
    if (isLoadingVendorLookup) {
      return (
        <VendorPageLayout title="Loading...">
          <div />
        </VendorPageLayout>
      );
    }

    // If a vendor exists for this slug, the effect above will redirect
    if (vendorBySlug) {
      return null;
    }

    // Otherwise, show the original error
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
