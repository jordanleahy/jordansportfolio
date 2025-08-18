import React from 'react';
import { FilterSidebar } from './FilterSidebar';

interface StoriesGridLayoutProps {
  children: React.ReactNode;
  selectedCategories: Set<string>;
  selectedIndustries: Set<string>;
  searchQuery: string;
  availableCategories: Array<{ name: string; count: number }>;
  onCategoriesChange: (categories: Set<string>) => void;
  onIndustriesChange: (industries: Set<string>) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  onSelectAllCategories: () => void;
  onSelectIndustryCategories: (industryId: string) => void;
  hasActiveFilters: boolean;
}

export function StoriesGridLayout({
  children,
  selectedCategories,
  selectedIndustries,
  searchQuery,
  availableCategories,
  onCategoriesChange,
  onIndustriesChange,
  onSearchChange,
  onClearFilters,
  onSelectAllCategories,
  onSelectIndustryCategories,
  hasActiveFilters
}: StoriesGridLayoutProps) {
  return (
    <div className="flex w-full">
      {/* Filter Sidebar - Desktop Only */}
      <FilterSidebar
        selectedCategories={selectedCategories}
        selectedIndustries={selectedIndustries}
        searchQuery={searchQuery}
        availableCategories={availableCategories}
        onCategoriesChange={onCategoriesChange}
        onIndustriesChange={onIndustriesChange}
        onSearchChange={onSearchChange}
        onClearFilters={onClearFilters}
        onSelectAllCategories={onSelectAllCategories}
        onSelectIndustryCategories={onSelectIndustryCategories}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 md:pl-4">
        <div className="categories-grid-scroll max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}