import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, QUERY_CONFIG } from '@/constants/queryKeys';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { getCategoryLabel, validateCategoryName, DEFAULT_CATEGORIES } from '@/constants/categoryConstants';
import type { CategoryInputProps } from '@/types/stories/ui';

export const CategoryInput = ({ value, onChange, placeholder = "Select or enter category...", disabled = false }: CategoryInputProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [customInput, setCustomInput] = useState(false);

  // Fetch available themes from the database
  const { data: availableThemes = [] } = useQuery({
    queryKey: QUERY_KEYS.themes,
    queryFn: () => optimizedSocialMediaService.getAvailableThemes(),
    staleTime: QUERY_CONFIG.THEMES_STALE_TIME, // Use optimized cache time
    refetchOnWindowFocus: false, // Background refetching only
  });

  // Combine default and available themes, prioritizing defaults
  const allCategories = React.useMemo(() => {
    const knownCategories = [...DEFAULT_CATEGORIES] as string[];
    const themeCategories = availableThemes.map(t => t.category).filter(c => !knownCategories.includes(c));
    return [...knownCategories, ...themeCategories];
  }, [availableThemes]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSelect = (category: string) => {
    onChange(category);
    setInputValue(category);
    setOpen(false);
    setCustomInput(false);
  };

  const handleCustomInput = () => {
    setCustomInput(true);
    setOpen(false);
  };

  const handleCustomSubmit = () => {
    const validation = validateCategoryName(inputValue);
    if (validation.valid) {
      onChange(inputValue.trim().toLowerCase());
      setCustomInput(false);
    } else {
      // Handle validation error - you could show a toast or error message
      console.error(validation.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customInput) {
      e.preventDefault();
      handleCustomSubmit();
    } else if (e.key === 'Escape' && customInput) {
      setCustomInput(false);
      setInputValue(value);
    }
  };

  if (customInput) {
    return (
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter new category name..."
          disabled={disabled}
          autoFocus
        />
        <Button 
          type="button"
          variant="outline" 
          size="sm"
          onClick={handleCustomSubmit}
          disabled={!inputValue.trim() || disabled}
        >
          Add
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm"
          onClick={() => {
            setCustomInput(false);
            setInputValue(value);
          }}
          disabled={disabled}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value ? getCategoryLabel(value) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">No category found.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCustomInput}
                >
                  Create new category
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup heading="Categories">
              {allCategories.map((category) => (
                <CommandItem
                  key={category}
                  value={category}
                  onSelect={() => handleSelect(category)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {getCategoryLabel(category)}
                  {DEFAULT_CATEGORIES.includes(category as any) && (
                    <span className="ml-auto text-xs text-muted-foreground">default</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem onSelect={handleCustomInput}>
                <span className="text-muted-foreground">+ Create new category</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};