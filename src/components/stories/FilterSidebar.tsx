import React from 'react';
import { Search, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getCategoryLabel } from '@/constants/categoryConstants';

interface FilterSidebarProps {
  selectedCategories: Set<string>;
  searchQuery: string;
  availableCategories: Array<{ name: string; count: number }>;
  onCategoriesChange: (categories: Set<string>) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  onSelectAllCategories: () => void;
  hasActiveFilters: boolean;
}

export function FilterSidebar({
  selectedCategories,
  searchQuery,
  availableCategories,
  onCategoriesChange,
  onSearchChange,
  onClearFilters,
  onSelectAllCategories,
  hasActiveFilters
}: FilterSidebarProps) {
  const handleCategoryToggle = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    onCategoriesChange(newSelected);
  };

  return (
    <div className="hidden md:block w-[280px] h-full bg-background border-r border-border">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Active Filters</h4>
            <div className="flex flex-wrap gap-1">
              {selectedCategories.size > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCategories.size} Categories
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchQuery}"
                </Badge>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Categories</h4>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAllCategories}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                All
              </Button>
              {selectedCategories.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCategoriesChange(new Set())}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  None
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-400px)] pr-4">
            <div className="space-y-2">
              {availableCategories.map((category) => (
                <label
                  key={category.name}
                  className="flex items-center space-x-3 cursor-pointer group hover:bg-muted/50 rounded-md p-2 transition-colors"
                >
                  <Checkbox
                    checked={selectedCategories.has(category.name)}
                    onCheckedChange={() => handleCategoryToggle(category.name)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <span 
                      className="text-sm text-foreground group-hover:text-foreground truncate block"
                      title={getCategoryLabel(category.name)}
                    >
                      {getCategoryLabel(category.name)}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {category.count}
                  </Badge>
                </label>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}