import React from 'react';
import { FilterSidebar } from './FilterSidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
  // Mobile tabs props
  showMobileTabs?: boolean;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  publicContent?: React.ReactNode;
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
  hasActiveFilters,
  showMobileTabs = false,
  currentTab = 'mystories',
  onTabChange,
  publicContent
}: StoriesGridLayoutProps) {
  
  // Mobile tabs view
  if (showMobileTabs) {
    return (
      <div className="w-full md:hidden">
        <Tabs value={currentTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="mystories" className="text-sm">My Stories</TabsTrigger>
            <TabsTrigger value="public" className="text-sm">Public</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mystories" className="mt-0">
            <div className="categories-grid-scroll max-h-[calc(100vh-200px)] overflow-y-auto">
              {children}
            </div>
          </TabsContent>
          
          <TabsContent value="public" className="mt-0">
            <div className="categories-grid-scroll max-h-[calc(100vh-200px)] overflow-y-auto">
              {publicContent}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop view with sidebar
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
        <div className="categories-grid-scroll max-h-[calc(100vh-200px)] overflow-y-auto hidden md:block">
          {children}
        </div>
      </div>
    </div>
  );
}