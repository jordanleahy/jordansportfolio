import React from 'react';
import { FilterSidebar } from './FilterSidebar';

interface StoriesGridLayoutProps {
  children: React.ReactNode;
  selectedCategories: Set<string>;
  searchQuery: string;
  availableCategories: Array<{ name: string; count: number }>;
  onCategoriesChange: (categories: Set<string>) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  onSelectAllCategories: () => void;
  hasActiveFilters: boolean;
}

export function StoriesGridLayout({
  children,
  selectedCategories,
  searchQuery,
  availableCategories,
  onCategoriesChange,
  onSearchChange,
  onClearFilters,
  onSelectAllCategories,
  hasActiveFilters
}: StoriesGridLayoutProps) {
  return (
    <div className="flex w-full">
      {/* Filter Sidebar - Desktop Only */}
      <FilterSidebar
        selectedCategories={selectedCategories}
        searchQuery={searchQuery}
        availableCategories={availableCategories}
        onCategoriesChange={onCategoriesChange}
        onSearchChange={onSearchChange}
        onClearFilters={onClearFilters}
        onSelectAllCategories={onSelectAllCategories}
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